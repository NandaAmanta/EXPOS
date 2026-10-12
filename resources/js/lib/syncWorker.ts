import { getPendingOrders, markOrdersSynced } from './db';

type SyncListener = (state: {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncedAt: Date | null;
}) => void;

class PosSyncManager {
    private isSyncing = false;
    private isServerReachable = false;
    private lastSyncedAt: Date | null = null;
    private listeners: Set<SyncListener> = new Set();
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            // Immediate check on startup
            this.checkHealth();

            window.addEventListener('online', () => {
                this.checkHealth();
            });

            window.addEventListener('offline', () => {
                this.isServerReachable = false;
                this.notify();
            });

            // Fast periodic healthcheck heartbeat (every 5 seconds)
            this.heartbeatTimer = setInterval(() => {
                this.checkHealth();
            }, 5000);
        }
    }

    public subscribe(listener: SyncListener): () => void {
        this.listeners.add(listener);
        // Immediately notify with current state
        this.notify();
        // Trigger healthcheck on new subscription
        this.checkHealth();
        return () => this.listeners.delete(listener);
    }

    /**
     * Active ping probe: checks if backend server is physically reachable
     */
    public async checkHealth(): Promise<boolean> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            if (this.isServerReachable) {
                this.isServerReachable = false;
                await this.notify();
            }
            return false;
        }

        const prevStatus = this.isServerReachable;
        let reachable = false;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);

            const response = await fetch('/api/pos/ping', {
                method: 'GET',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            reachable = response.ok;
        } catch {
            reachable = false;
        }

        this.isServerReachable = reachable;
        await this.notify();

        // If server just recovered from offline, trigger pending orders sync
        if (!prevStatus && reachable && !this.isSyncing) {
            this.triggerBackgroundSync();
        }

        return reachable;
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
            isOnline: this.isServerReachable,
            isSyncing: this.isSyncing,
            pendingCount,
            lastSyncedAt: this.lastSyncedAt,
        };

        this.listeners.forEach((fn) => fn(state));
    }

    public async triggerBackgroundSync(): Promise<{ success: boolean; synced: number }> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.isServerReachable = false;
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
                // Double check health when idle
                this.isServerReachable = true;
                await this.notify();
                return { success: true, synced: 0 };
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const response = await fetch('/api/pos/orders/batch-sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({ orders: pendingOrders }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Sync HTTP error: ${response.status}`);
            }

            const result = await response.json();
            if (result.synced_ids && Array.isArray(result.synced_ids)) {
                await markOrdersSynced(result.synced_ids);
                this.lastSyncedAt = new Date();
            }

            this.isServerReachable = true;
            this.isSyncing = false;
            await this.notify();
            return { success: true, synced: result.synced_ids?.length || 0 };
        } catch (error) {
            console.warn('Sync pending: Server unreachable or offline.', error);
            this.isServerReachable = false;
            this.isSyncing = false;
            await this.notify();
            return { success: false, synced: 0 };
        }
    }
}

export const syncManager = new PosSyncManager();
