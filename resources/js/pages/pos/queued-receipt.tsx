import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { offlineDb } from '@/lib/offline-db';
import type { PendingSale } from '@/lib/offline-db';
import { cn } from '@/lib/utils';

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
            <div className="flex h-[60vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Sale not found in local queue.
            </div>
        );
    }

    const statusMeta = {
        pending: {
            icon: Clock,
            label: 'Sale recorded — offline',
            tone: 'text-amber-600 dark:text-amber-500',
            ring: 'ring-amber-500/20 bg-amber-500/10',
            message:
                "This sale is saved on this device and will sync automatically once you're back online.",
            spin: false,
        },
        syncing: {
            icon: RefreshCw,
            label: 'Syncing…',
            tone: 'text-[#00a79b]',
            ring: 'ring-[#00a79b]/20 bg-[#00a79b]/10',
            message: 'Sending this sale to the server now.',
            spin: true,
        },
        failed: {
            icon: AlertTriangle,
            label: 'Needs review',
            tone: 'text-red-600 dark:text-red-500',
            ring: 'ring-red-500/20 bg-red-500/10',
            message:
                sale.error_message ??
                'This sale needs manager review before it can sync.',
            spin: false,
        },
        synced: {
            icon: CheckCircle2,
            label: 'Synced',
            tone: 'text-emerald-600 dark:text-emerald-500',
            ring: 'ring-emerald-500/20 bg-emerald-500/10',
            message: 'This sale has been recorded on the server.',
            spin: false,
        },
    } as const;

    const meta = statusMeta[sale.status];
    const StatusIcon = meta.icon;

    return (
        <>
            <Head title="Sale Recorded" />

            <div className="flex flex-col items-center px-4 py-10 sm:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="w-full max-w-sm rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8"
                >
                    <div
                        className={cn(
                            'mx-auto mb-4 flex size-16 items-center justify-center rounded-full ring-8',
                            meta.ring,
                        )}
                    >
                        <StatusIcon
                            className={cn(
                                'size-7',
                                meta.tone,
                                meta.spin && 'animate-spin',
                            )}
                        />
                    </div>

                    <p className={cn('text-lg font-semibold', meta.tone)}>
                        {meta.label}
                    </p>
                    <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                        {meta.message}
                    </p>

                    <p className="mt-6 font-mono text-3xl font-bold tabular-nums">
                        ≈ {peso(sale.estimated_total ?? 0)}
                    </p>
                    {sale.status === 'pending' && (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Final total confirmed once this syncs
                        </p>
                    )}

                    <p className="mt-3 text-xs text-muted-foreground">
                        Recorded at {new Date(sale.created_at).toLocaleString()}
                    </p>
                </motion.div>

                <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                    <Button
                        asChild
                        size="lg"
                        className="flex-1 bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
                    >
                        <Link href="/pos">New Sale</Link>
                    </Button>
                    {sale.status === 'failed' && (
                        <Button
                            asChild
                            size="lg"
                            variant="outline"
                            className="flex-1"
                        >
                            <Link href="/pos/sync-review">Review</Link>
                        </Button>
                    )}
                </div>
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
