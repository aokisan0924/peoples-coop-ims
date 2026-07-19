import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { offlineDb, type PendingSale } from '@/lib/offline-db';
import { syncEngine } from '@/lib/sync-engine';
import { RefreshCw, Trash2 } from 'lucide-react';

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SyncReview() {
    const [sales, setSales] = useState<PendingSale[]>([]);
    const [retryingUuid, setRetryingUuid] = useState<string | null>(null);

    async function loadSales() {
        const all = await offlineDb.pendingSales.orderBy('created_at').reverse().toArray();
        setSales(all);
    }

    useEffect(() => {
        loadSales();
        const interval = setInterval(loadSales, 3000); // refresh while a retry might be in flight
        return () => clearInterval(interval);
    }, []);

    async function handleRetry(uuid: string) {
        setRetryingUuid(uuid);
        await offlineDb.pendingSales.update(uuid, { status: 'pending' });
        await syncEngine.syncPending();
        await loadSales();
        setRetryingUuid(null);
    }

    async function handleRetryAll() {
        const failed = sales.filter((s) => s.status === 'failed');
        for (const sale of failed) {
            await offlineDb.pendingSales.update(sale.uuid, { status: 'pending' });
        }
        await syncEngine.syncPending();
        await loadSales();
    }

    async function handleDiscard(uuid: string) {
        if (!confirm('Discard this sale permanently? This CANNOT be undone — the transaction will be lost and no stock will be deducted for it.')) {
            return;
        }
        await offlineDb.pendingSales.delete(uuid);
        await loadSales();
    }

    const failedSales = sales.filter((s) => s.status === 'failed');
    const pendingSales = sales.filter((s) => s.status === 'pending' || s.status === 'syncing');
    const syncedSales = sales.filter((s) => s.status === 'synced').slice(0, 10); // recent history only

    function computeTotal(sale: PendingSale): number {
        // We don't have server-computed prices for unsynced sales — this is a rough
        // item-count summary, not a priced total, since pricing only exists server-side.
        return sale.payload.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    return (
        <>
            <Head title="Sync Review" />

            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Offline Sync Review</h1>
                    <Button variant="outline" asChild>
                        <Link href="/pos">← Back to POS</Link>
                    </Button>
                </div>

                {/* Failed — needs attention */}
                <div className="border rounded-lg p-4 border-red-300">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-medium text-red-600">
                            Failed Sales ({failedSales.length})
                        </h2>
                        {failedSales.length > 0 && (
                            <Button size="sm" onClick={handleRetryAll}>
                                <RefreshCw className="size-4" />
                                Retry All
                            </Button>
                        )}
                    </div>

                    {failedSales.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No failed sales. Everything's synced or pending normally.</p>
                    ) : (
                        <div className="space-y-3">
                            {failedSales.map((sale) => (
                                <div key={sale.uuid} className="border rounded-lg p-3 bg-red-50 dark:bg-red-950/20">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm font-medium">
                                                {sale.payload.items.length} item(s) · {computeTotal(sale)} unit(s)
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Recorded {new Date(sale.created_at).toLocaleString()}
                                            </p>
                                            <p className="text-sm text-red-600 mt-2 font-medium">
                                                {sale.error_message ?? 'Unknown error'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                size="sm"
                                                onClick={() => handleRetry(sale.uuid)}
                                                disabled={retryingUuid === sale.uuid}
                                            >
                                                {retryingUuid === sale.uuid ? 'Retrying...' : 'Retry'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDiscard(sale.uuid)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pending / syncing */}
                {pendingSales.length > 0 && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">Pending / Syncing ({pendingSales.length})</h2>
                        <div className="space-y-2">
                            {pendingSales.map((sale) => (
                                <div key={sale.uuid} className="flex items-center justify-between text-sm">
                                    <span>{sale.payload.items.length} item(s) — {new Date(sale.created_at).toLocaleTimeString()}</span>
                                    <Badge variant="secondary">{sale.status}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recently synced — confirmation history */}
                {syncedSales.length > 0 && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">Recently Synced</h2>
                        <div className="space-y-2">
                            {syncedSales.map((sale) => (
                                <div key={sale.uuid} className="flex items-center justify-between text-sm">
                                    <span>{sale.receipt_number ?? '—'}</span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">Synced</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

SyncReview.layout = {
    breadcrumbs: [
        { title: 'Point of Sale', href: '/pos' },
        { title: 'Sync Review', href: '#' },
    ],
};
