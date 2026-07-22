import Dexie from 'dexie';
import type {Table} from 'dexie';

export interface PendingSale {
    uuid: string; // client-generated, used as idempotency key on sync
    payload: {
        is_member: boolean;
        payment_method: 'cash' | 'gcash';
        amount_tendered: number | null;
        gcash_reference: string | null;
        items: {
            product_id: number;
            unit_type: 'piece' | 'pack';
            quantity: number;
        }[];
    };
    // Computed client-side from cached prices at queue time, for display ONLY —
    // the authoritative total is always computed server-side on sync (never trust
    // a client-supplied price), so this may drift slightly (e.g. a price change
    // that hasn't synced to this device yet) and should be shown as an estimate.
    estimated_total: number;
    created_at: string; // ISO timestamp, for display + FIFO ordering of sync
    status: 'pending' | 'syncing' | 'synced' | 'failed';
    error_message?: string;
    receipt_number?: string; // filled in once synced, for the receipt page
    sale_id?: number; // filled in once synced
}

export interface CachedProduct {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category: string | null;
    total_stock: number;
    member_piece_price: number;
    non_member_piece_price: number;
    member_pack_price: number | null;
    non_member_pack_price: number | null;
    pack_conversion_factor: number | null;
    cached_at: string;
}

class OfflineDatabase extends Dexie {
    pendingSales!: Table<PendingSale, string>;
    cachedProducts!: Table<CachedProduct, number>;

    constructor() {
        super('PeoplesCoopPOS');
        this.version(1).stores({
            pendingSales: 'uuid, status, created_at',
            cachedProducts: 'id, name, barcode, sku',
        });
    }
}

export const offlineDb = new OfflineDatabase();
