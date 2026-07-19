import { useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { offlineDb, type PendingSale } from '@/lib/offline-db';

export default function QueuedReceipt({ uuid }: { uuid: string }) {
    const [sale, setSale] = useState<PendingSale | null>(null);

    useEffect(() => {
        offlineDb.pendingSales.get(uuid).then((s) => {
            setSale(s ?? null);

            // If it's already synced with a real server sale ID, redirect
            // to the proper printable receipt page for the full layout.
            if (s?.status === 'synced' && s.sale_id) {
                router.visit(`/sales/${s.sale_id}/receipt`);
            }
        });

        // Poll for status changes in case sync completes while this page is open
        const interval = setInterval(async () => {
            const updated = await offlineDb.pendingSales.get(uuid);
            setSale(updated ?? null);
            if (updated?.status === 'synced' && updated.sale_id) {
                clearInterval(interval);
                router.visit(`/sales/${updated.sale_id}/receipt`);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [uuid]);

    if (!sale) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Sale not found in local queue.
            </div>
        );
    }

    return (
        <>
            <Head title="Sale Recorded" />

            <div className="p-4 flex flex-col items-center">
                <div className="w-full max-w-sm text-center border rounded-lg p-6">
                    <p className="text-2xl font-bold mb-2">
                        {sale.status === 'pending' && '🟡 Sale Recorded — Offline'}
                        {sale.status === 'syncing' && '🔄 Syncing...'}
                        {sale.status === 'failed' && '⚠️ Needs Review'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {sale.status === 'pending' &&
                            'This sale is saved on this device and will sync automatically once you\'re back online.'}
                        {sale.status === 'failed' &&
                            (sale.error_message ?? 'This sale needs manager review before it can sync.')}
                    </p>
                    <p className="text-3xl font-bold">
                        ≈ ₱{(sale.estimated_total ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {sale.status === 'pending' && 'Final total confirmed once this syncs'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Recorded at {new Date(sale.created_at).toLocaleString()}
                    </p>
                </div>

                <Button asChild className="mt-4">
                    <Link href="/pos">← New Sale</Link>
                </Button>
            </div>
        </>
    );
}

QueuedReceipt.layout = {
    breadcrumbs: [
        { title: 'Point of Sale', href: '/pos' },
        { title: 'Receipt', href: '#' },
    ],
};
