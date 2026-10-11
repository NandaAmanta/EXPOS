import { getPendingOrders, markOrdersSynced } from './db';

type SyncListener = (state: {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncedAt: Date | null;
}) => void;

class PosSyncManager {
    private isSyncing = false;
    private lastSyncedAt: Date | null = null;
    private listeners: Set<SyncListener> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.notify();
                this.triggerBackgroundSync();
            });

            window.addEventListener('offline', () => {
                this.notify();
            });

            // Periodic heartbeat check every 30 seconds
            setInterval(() => {
                if (navigator.onLine && !this.isSyncing) {
                    this.triggerBackgroundSync();
                }
            }, 30000);
        }
    }

    public subscribe(listener: SyncListener): () => void {
        this.listeners.add(listener);
        this.notify();
        return () => this.listeners.delete(listener);
    }

    private async notify() {
        let pendingCount = 0;
        try {
            const pending = await getPendingOrders();
            pendingCount = pending.length;
        } catch {
            pendingCount = 0;
        }

        const state = {
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
            isSyncing: this.isSyncing,
            pendingCount,
            lastSyncedAt: this.lastSyncedAt,
        };

        this.listeners.forEach((fn) => fn(state));
    }

    public async triggerBackgroundSync(): Promise<{ success: boolean; synced: number }> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            await this.notify();
            return { success: false, synced: 0 };
        }

        if (this.isSyncing) {
            return { success: false, synced: 0 };
        }

        this.isSyncing = true;
        await this.notify();

        try {
            const pendingOrders = await getPendingOrders();
            if (pendingOrders.length === 0) {
                this.isSyncing = false;
                await this.notify();
                return { success: true, synced: 0 };
            }

            const response = await fetch('/api/pos/orders/batch-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ orders: pendingOrders }),
            });

            if (!response.ok) {
                throw new Error(`Sync HTTP error: ${response.status}`);
            }

            const result = await response.json();
            if (result.synced_ids && Array.isArray(result.synced_ids)) {
                await markOrdersSynced(result.synced_ids);
                this.lastSyncedAt = new Date();
            }

            this.isSyncing = false;
            await this.notify();
            return { success: true, synced: result.synced_ids?.length || 0 };
        } catch (error) {
            console.warn('Sync pending: Server unreachable or offline.', error);
            this.isSyncing = false;
            await this.notify();
            return { success: false, synced: 0 };
        }
    }
}

export const syncManager = new PosSyncManager();
