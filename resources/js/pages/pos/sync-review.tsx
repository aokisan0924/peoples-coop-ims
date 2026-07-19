import { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { offlineDb, type PendingSale } from '@/lib/offline-db';
import { syncEngine } from '@/lib/sync-engine';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

            <div className="mx-auto max-w-2xl space-y-4 p-3 sm:space-y-6 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <h1 className="text-lg font-semibold sm:text-xl">Offline Sync Review</h1>
                        <p className="text-sm text-muted-foreground">Sales queued on this device, and how they synced.</p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/pos" className="gap-1.5">
                            <ArrowLeft className="size-4" />
                            <span className="hidden sm:inline">Back to POS</span>
                        </Link>
                    </Button>
                </div>

                {/* Failed — needs attention */}
                <section className="overflow-hidden rounded-xl border border-red-200 dark:border-red-900/60">
                    <div className="flex items-center justify-between gap-2 border-b border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/60 dark:bg-red-950/30">
                        <h2 className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                            <AlertTriangle className="size-4" />
                            Failed Sales ({failedSales.length})
                        </h2>
                        {failedSales.length > 0 && (
                            <Button size="sm" onClick={handleRetryAll} className="gap-1.5 bg-[#00a79b] text-white hover:bg-[#00a79b]/90">
                                <RefreshCw className="size-3.5" />
                                Retry All
                            </Button>
                        )}
                    </div>

                    <div className="p-4">
                        {failedSales.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No failed sales. Everything's synced or pending normally.</p>
                        ) : (
                            <div className="space-y-3">
                                {failedSales.map((sale) => (
                                    <div
                                        key={sale.uuid}
                                        className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50/60 p-3 sm:flex-row sm:items-start sm:justify-between dark:border-red-900/60 dark:bg-red-950/20"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium">
                                                {sale.payload.items.length} item(s) · {computeTotal(sale)} unit(s)
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Recorded {new Date(sale.created_at).toLocaleString()}
                                            </p>
                                            <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                                                {sale.error_message ?? 'Unknown error'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 gap-1.5 bg-[#00a79b] text-white hover:bg-[#00a79b]/90 sm:flex-none"
                                                onClick={() => handleRetry(sale.uuid)}
                                                disabled={retryingUuid === sale.uuid}
                                            >
                                                <RefreshCw className={cn('size-3.5', retryingUuid === sale.uuid && 'animate-spin')} />
                                                {retryingUuid === sale.uuid ? 'Retrying…' : 'Retry'}
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleDiscard(sale.uuid)} aria-label="Discard sale">
                                                <Trash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Pending / syncing */}
                {pendingSales.length > 0 && (
                    <section className="overflow-hidden rounded-xl border">
                        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                            <Clock className="size-4 text-muted-foreground" />
                            <h2 className="text-sm font-medium">Pending / Syncing ({pendingSales.length})</h2>
                        </div>
                        <div className="divide-y">
                            {pendingSales.map((sale) => (
                                <div key={sale.uuid} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                    <span>
                                        {sale.payload.items.length} item(s) — {new Date(sale.created_at).toLocaleTimeString()}
                                    </span>
                                    <Badge variant="secondary" className="gap-1">
                                        {sale.status === 'syncing' && <RefreshCw className="size-3 animate-spin" />}
                                        {sale.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recently synced — confirmation history */}
                {syncedSales.length > 0 && (
                    <section className="overflow-hidden rounded-xl border">
                        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-3">
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-500" />
                            <h2 className="text-sm font-medium">Recently Synced</h2>
                        </div>
                        <div className="divide-y">
                            {syncedSales.map((sale) => (
                                <div key={sale.uuid} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                    <span className="font-mono tabular-nums">{sale.receipt_number ?? '—'}</span>
                                    <Badge variant="outline" className="border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-500">
                                        Synced
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {sales.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
                        <CheckCircle2 className="size-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Nothing queued</p>
                        <p className="max-w-xs text-sm text-muted-foreground">Sales you ring up will show here while they sync.</p>
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
