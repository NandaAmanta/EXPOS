import Dexie, { type Table } from 'dexie';
import type { PosOrderPayload, PosProduct, PosShift } from '@/types/pos';

export class ExpPosDatabase extends Dexie {
    products!: Table<PosProduct, string>;
    shifts!: Table<PosShift, string>;
    orders!: Table<PosOrderPayload, string>;

    constructor() {
        super('ExpPosLocalDb');
        this.version(1).stores({
            products: 'id, sku, barcode, category, name, price',
            shifts: 'id, status, opened_at',
            orders: 'id, order_number, is_synced, created_at',
        });
    }
}

export const posDb = new ExpPosDatabase();

/**
 * Cache products from backend to local IndexedDB
 */
export async function cacheProducts(products: PosProduct[]): Promise<void> {
    try {
        await posDb.products.bulkPut(products);
    } catch (error) {
        console.error('Failed to cache products to IndexedDB:', error);
    }
}

/**
 * Get all products from local IndexedDB
 */
export async function getLocalProducts(): Promise<PosProduct[]> {
    try {
        return await posDb.products.toArray();
    } catch (error) {
        console.error('Failed to read products from IndexedDB:', error);
        return [];
    }
}

/**
 * Save newly completed order locally (sub-100ms instant save)
 */
export async function saveLocalOrder(order: PosOrderPayload): Promise<void> {
    await posDb.orders.put(order);
}

/**
 * Get pending orders waiting to be synced to backend
 */
export async function getPendingOrders(): Promise<PosOrderPayload[]> {
    return await posDb.orders.where('is_synced').equals(0).toArray();
}

/**
 * Update sync status for successfully ingested orders
 */
export async function markOrdersSynced(syncedIds: string[]): Promise<void> {
    if (syncedIds.length === 0) return;
    await posDb.orders.where('id').anyOf(syncedIds).modify({ is_synced: 1 });
}

/**
 * Get count of pending unsynced orders
 */
export async function getUnsyncedCount(): Promise<number> {
    return await posDb.orders.where('is_synced').equals(0).count();
}

/**
 * Save active shift locally
 */
export async function saveActiveShift(shift: PosShift | null): Promise<void> {
    try {
        if (shift) {
            await posDb.shifts.put(shift);
            localStorage.setItem('pos_active_shift_id', shift.id);
        } else {
            await posDb.shifts.where('status').equals('open').modify({ status: 'closed' });
            localStorage.removeItem('pos_active_shift_id');
        }
    } catch (err) {
        console.warn('Failed to save shift in IndexedDB:', err);
    }
}

/**
 * Get active shift locally
 */
export async function getLocalActiveShift(): Promise<PosShift | undefined> {
    try {
        return await posDb.shifts.where('status').equals('open').first();
    } catch {
        return undefined;
    }
}

/**
 * Get today's local completed orders
 */
export async function getTodayLocalOrders(): Promise<PosOrderPayload[]> {
    const today = new Date().toISOString().split('T')[0];
    const all = await posDb.orders.toArray();
    return all.filter((o) => o.created_at.startsWith(today));
}
