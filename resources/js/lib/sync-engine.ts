import { offlineDb, type PendingSale } from '@/lib/offline-db';

type SyncListener = (status: SyncStatus) => void;

export interface SyncStatus {
    isOnline: boolean;
    pendingCount: number;
    syncing: boolean;
    lastError: string | null;
}

class SyncEngine {
    private listeners: SyncListener[] = [];
    private syncing = false;
    private lastError: string | null = null;

    constructor() {
        window.addEventListener('online', () => this.handleConnectionChange());
        window.addEventListener('offline', () => this.handleConnectionChange());

        setInterval(() => {
            if (navigator.onLine) this.syncPending();
        }, 15000);

        // Refresh product cache every 5 minutes while online, plus once immediately
        this.refreshProductCache();
        setInterval(() => this.refreshProductCache(), 5 * 60 * 1000);
    }

    subscribe(listener: SyncListener): () => void {
        this.listeners.push(listener);
        this.notify();
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    private async notify() {
        const pendingCount = await offlineDb.pendingSales.where('status').anyOf(['pending', 'failed']).count();
        const status: SyncStatus = {
            isOnline: navigator.onLine,
            pendingCount,
            syncing: this.syncing,
            lastError: this.lastError,
        };
        this.listeners.forEach((l) => l(status));
    }

    private handleConnectionChange() {
        this.notify();
        if (navigator.onLine) {
            this.syncPending();
        }
    }

    /**
     * Queue a sale locally. Always succeeds immediately — the cashier never waits on network.
     */
    async queueSale(payload: PendingSale['payload']): Promise<string> {
        const uuid = crypto.randomUUID();

        await offlineDb.pendingSales.add({
            uuid,
            payload,
            created_at: new Date().toISOString(),
            status: 'pending',
        });

        this.notify();

        if (navigator.onLine) {
            this.syncPending(); // fire and forget — don't block the cashier's UI
        }

        return uuid;
    }

    /**
     * Push all pending sales to the server, oldest first (preserves the order
     * items were actually sold, which matters for FIFO stock deduction accuracy).
     */
    async syncPending(): Promise<void> {
        if (this.syncing) return; // avoid overlapping sync runs
        this.syncing = true;
        this.notify();

        try {
            const pending = await offlineDb.pendingSales
                .where('status')
                .anyOf(['pending', 'failed'])
                .sortBy('created_at');

            for (const sale of pending) {
                await this.syncOne(sale);
            }

            this.lastError = null;
        } finally {
            this.syncing = false;
            this.notify();
        }
    }

    private async syncOne(sale: PendingSale): Promise<void> {
        await offlineDb.pendingSales.update(sale.uuid, { status: 'syncing' });

        try {
            const response = await fetch('/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    client_uuid: sale.uuid,
                    ...sale.payload,
                }),
            });

            const data = await response.json();

            if (data.success) {
                await offlineDb.pendingSales.update(sale.uuid, {
                    status: 'synced',
                    receipt_number: data.sale.receipt_number,
                    sale_id: data.sale.id,
                });
            } else {
                // Business-rule failure (e.g. insufficient stock discovered only now
                // that we're back online) — flag for manager review, don't lose the record
                await offlineDb.pendingSales.update(sale.uuid, {
                    status: 'failed',
                    error_message: data.message ?? 'Sync failed',
                });
                this.lastError = data.message ?? 'A sale failed to sync — needs manager review.';
            }
        } catch (e) {
            // Network error mid-sync — leave as pending, will retry automatically
            await offlineDb.pendingSales.update(sale.uuid, { status: 'pending' });
        }
    }

    /**
     * Refresh the local product cache — call this periodically while online,
     * so offline search/scan has recent data to work with.
     */
    async refreshProductCache(): Promise<void> {
    if (!navigator.onLine) return;

    try {
        const response = await fetch('/products/offline-snapshot');
        const data = await response.json();

        await offlineDb.cachedProducts.clear();
        await offlineDb.cachedProducts.bulkAdd(
            data.products.map((p: any) => ({ ...p, cached_at: new Date().toISOString() }))
        );
    } catch {
            // silent — cache just stays stale until next successful attempt
        }
    }
}

export const syncEngine = new SyncEngine();
