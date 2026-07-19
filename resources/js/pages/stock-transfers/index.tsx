import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import TransferStatusBadge from '@/components/stock-transfer/transfer-status-badge';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { ArrowRight, ArrowRightLeft, CheckCircle2, Clock, Search, User, X, XCircle, type LucideIcon } from 'lucide-react';

interface Transfer {
    id: number;
    quantity: number;
    cost_price: string;
    status: 'in_transit' | 'received' | 'cancelled';
    initiated_at: string;
    received_at: string | null;
    notes: string | null;
    product: { name: string; sku: string };
    from_location: { id: number; name: string };
    to_location: { id: number; name: string };
    initiated_by: { name: string };
    received_by: { name: string } | null;
}

export default function StockTransfersIndex({ transfers }: { transfers: Transfer[] }) {
    const { user, isOwner } = useAuth();
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | 'in_transit' | 'received' | 'cancelled'>('all');

    function handleConfirm(transfer: Transfer) {
        if (confirm(`Confirm receipt of ${transfer.quantity} unit(s) of "${transfer.product.name}"?`)) {
            router.post(`/stock-transfers/${transfer.id}/confirm`);
        }
    }

    function handleCancel(transfer: Transfer) {
        if (confirm(`Cancel this transfer? Stock will be restored to ${transfer.from_location.name}.`)) {
            router.post(`/stock-transfers/${transfer.id}/cancel`);
        }
    }

    const isEmpty = transfers.length === 0;
    const inTransitCount = useMemo(() => transfers.filter((t) => t.status === 'in_transit').length, [transfers]);
    const receivedCount = useMemo(() => transfers.filter((t) => t.status === 'received').length, [transfers]);
    const cancelledCount = useMemo(() => transfers.filter((t) => t.status === 'cancelled').length, [transfers]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return transfers.filter((t) => {
            const matchesQuery =
                !q ||
                [t.product.name, t.product.sku, t.from_location.name, t.to_location.name, t.initiated_by.name].some((f) =>
                    f?.toLowerCase().includes(q),
                );
            const matchesStatus = status === 'all' || t.status === status;
            return matchesQuery && matchesStatus;
        });
    }, [transfers, query, status]);

    const noResults = !isEmpty && filtered.length === 0;
    const hasFilters = query.trim() !== '' || status !== 'all';

    function clearFilters() {
        setQuery('');
        setStatus('all');
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Stock Transfers" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Stock Transfers</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">{transfers.length}</Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Move stock between branches and track it until it's confirmed received.</p>
                    </div>
                    <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                        <Link href="/stock-transfers/create">
                            <ArrowRightLeft className="size-4" />
                            New Transfer
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
                            <StatCard icon={Clock} label="In Transit" value={inTransitCount} accent="amber" />
                            <StatCard icon={CheckCircle2} label="Received" value={receivedCount} accent="green" />
                            <StatCard icon={XCircle} label="Cancelled" value={cancelledCount} accent="red" />
                        </div>

                        {/* Search + filter */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative max-w-sm flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by product, branch, or staff…"
                                    className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                    aria-label="Search transfers"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        aria-label="Clear search"
                                        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                aria-label="Filter by status"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-[var(--pos-teal)] focus-visible:outline-none sm:w-48"
                            >
                                <option value="all">All statuses</option>
                                <option value="in_transit">In Transit</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults onClear={clearFilters} hasFilters={hasFilters} />
                ) : (
                    <>
                        {/* Table on larger screens, cards on mobile */}
                        <div className="hidden overflow-hidden rounded-xl border lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Product</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Route</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Qty</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Initiated</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((t) => {
                                        const canConfirm =
                                            t.status === 'in_transit' && (isOwner || (user?.id && t.to_location.id === (user as any).location_id));
                                        const canCancel =
                                            t.status === 'in_transit' && (isOwner || (user?.id && t.from_location.id === (user as any).location_id));

                                        return (
                                            <tr key={t.id} className="group border-t transition-colors hover:bg-muted/30">
                                                <td className="p-3 font-medium">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                            <ArrowRightLeft className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate">{t.product.name}</p>
                                                            <p className="truncate font-mono text-xs font-normal text-muted-foreground">
                                                                {t.product.sku}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                                        {t.from_location.name}
                                                        <ArrowRight className="size-3.5 shrink-0" />
                                                        {t.to_location.name}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-semibold tabular-nums">{t.quantity}</td>
                                                <td className="p-3">
                                                    <TransferStatusBadge status={t.status} />
                                                </td>
                                                <td className="p-3 text-xs whitespace-nowrap text-muted-foreground">
                                                    {new Date(t.initiated_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {(canConfirm || canCancel) && (
                                                        <div className="inline-flex gap-1.5 opacity-90 transition-opacity group-hover:opacity-100">
                                                            {canConfirm && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleConfirm(t)}
                                                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    Confirm
                                                                </Button>
                                                            )}
                                                            {canCancel && (
                                                                <Button size="sm" variant="destructive" onClick={() => handleCancel(t)} className="gap-1.5">
                                                                    <XCircle className="size-3.5" />
                                                                    Cancel
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((t) => {
                                const canConfirm =
                                    t.status === 'in_transit' && (isOwner || (user?.id && t.to_location.id === (user as any).location_id));
                                const canCancel =
                                    t.status === 'in_transit' && (isOwner || (user?.id && t.from_location.id === (user as any).location_id));

                                return (
                                    <div key={t.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-start gap-2.5">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                    <ArrowRightLeft className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{t.product.name}</p>
                                                    <p className="truncate font-mono text-xs text-muted-foreground">{t.product.sku}</p>
                                                </div>
                                            </div>
                                            <TransferStatusBadge status={t.status} />
                                        </div>

                                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className="truncate">{t.from_location.name}</span>
                                            <ArrowRight className="size-3.5 shrink-0" />
                                            <span className="truncate">{t.to_location.name}</span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                Qty: <span className="font-semibold text-foreground">{t.quantity}</span>
                                            </span>
                                            <span>{new Date(t.initiated_at).toLocaleDateString('en-PH')}</span>
                                        </div>

                                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                                            <User className="size-3" />
                                            {t.initiated_by.name}
                                        </p>

                                        {(canConfirm || canCancel) && (
                                            <div className={cn('mt-3 grid gap-1.5 border-t pt-2.5', canConfirm && canCancel ? 'grid-cols-2' : 'grid-cols-1')}>
                                                {canConfirm && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleConfirm(t)}
                                                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                                    >
                                                        <CheckCircle2 className="size-3.5" />
                                                        Confirm
                                                    </Button>
                                                )}
                                                {canCancel && (
                                                    <Button size="sm" variant="destructive" onClick={() => handleCancel(t)} className="gap-1.5">
                                                        <XCircle className="size-3.5" />
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent: 'teal' | 'amber' | 'green' | 'red' }) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', styles)}>
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ArrowRightLeft className="size-7" />
            </div>
            <p className="text-sm font-medium">No transfers yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Move stock between branches and track it here until it's confirmed received.</p>
            <Button asChild size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                <Link href="/stock-transfers/create">
                    <ArrowRightLeft className="size-4" />
                    New Transfer
                </Link>
            </Button>
        </div>
    );
}

function NoResults({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">No transfers match your filters</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different search term or status.</p>
            {hasFilters && (
                <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}

StockTransfersIndex.layout = {
    breadcrumbs: [{ title: 'Stock Transfers', href: '/stock-transfers' }],
};
