import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Boxes, Calendar, CheckCircle2, PackagePlus, PackageX, Search, Trash2, Truck, X, XCircle } from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import stockBatches from '@/routes/stock-batches';
import type {StockBatch} from '@/types/inventory';

interface PaginatedBatches {
    data: StockBatch[];
    links: { url: string | null; label: string; active: boolean }[];
}

type ExpiryStatus = 'none' | 'expired' | 'soon' | 'ok';

const SOON_THRESHOLD_DAYS = 30;

function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
    if (!expiryDate) {
return 'none';
}

    const diffDays = Math.ceil((new Date(expiryDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);

    if (diffDays < 0) {
return 'expired';
}

    if (diffDays <= SOON_THRESHOLD_DAYS) {
return 'soon';
}

    return 'ok';
}

export default function StockBatchesIndex({ batches, isOwner }: { batches: PaginatedBatches; isOwner: boolean }) {
    const [query, setQuery] = useState('');
    const [expiry, setExpiry] = useState<'all' | 'expired' | 'soon' | 'depleted'>('all');

    function handleDelete(batch: StockBatch) {
        if (confirm(`Delete this batch? Only possible if nothing has been sold from it yet.`)) {
            router.delete(stockBatches.destroy(batch.id).url);
        }
    }

    const isEmpty = batches.data.length === 0;

    const expiredCount = useMemo(() => batches.data.filter((b) => getExpiryStatus(b.expiry_date) === 'expired').length, [batches.data]);
    const soonCount = useMemo(() => batches.data.filter((b) => getExpiryStatus(b.expiry_date) === 'soon').length, [batches.data]);
    const depletedCount = useMemo(() => batches.data.filter((b) => b.remaining_qty === 0).length, [batches.data]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return batches.data.filter((batch) => {
            const matchesQuery = !q || [batch.product?.name, batch.supplier?.name].some((f) => f?.toLowerCase().includes(q));
            const status = getExpiryStatus(batch.expiry_date);
            const matchesExpiry =
                expiry === 'all' ||
                (expiry === 'expired' && status === 'expired') ||
                (expiry === 'soon' && status === 'soon') ||
                (expiry === 'depleted' && batch.remaining_qty === 0);

            return matchesQuery && matchesExpiry;
        });
    }, [batches.data, query, expiry]);

    const noResults = !isEmpty && filtered.length === 0;
    const hasFilters = query.trim() !== '' || expiry !== 'all';

    function clearFilters() {
        setQuery('');
        setExpiry('all');
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Stock Batches" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Stock Batches</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">{batches.data.length}</Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">FIFO stock receipts, expiry tracking, and remaining quantities.</p>
                    </div>
                    <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                        <Link href={stockBatches.create().url}>
                            <PackagePlus className="size-4" />
                            Receive Stock
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
                            <StatCard icon={Boxes} label="Total Batches" value={batches.data.length} accent="teal" />
                            <StatCard icon={AlertTriangle} label="Expiring Soon" value={soonCount} accent="amber" />
                            <StatCard icon={XCircle} label="Expired" value={expiredCount} accent="red" />
                            <StatCard icon={PackageX} label="Depleted" value={depletedCount} accent="gray" />
                        </div>

                        {/* Search + filter */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative max-w-sm flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by product or supplier…"
                                    className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                    aria-label="Search stock batches"
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
                                value={expiry}
                                onChange={(e) => setExpiry(e.target.value as typeof expiry)}
                                aria-label="Filter by expiry"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-[var(--pos-teal)] focus-visible:outline-none sm:w-48"
                            >
                                <option value="all">All batches</option>
                                <option value="soon">Expiring soon</option>
                                <option value="expired">Expired</option>
                                <option value="depleted">Depleted</option>
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
                                        {isOwner && <th className="p-3 text-left font-medium text-muted-foreground">Branch</th>}
                                        <th className="p-3 text-left font-medium text-muted-foreground">Supplier</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Remaining</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Cost/Unit</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Received</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Expiry</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((batch) => {
                                        const status = getExpiryStatus(batch.expiry_date);
                                        const pct = batch.received_qty > 0 ? Math.round((batch.remaining_qty / batch.received_qty) * 100) : 0;

                                        return (
                                            <tr key={batch.id} className="group border-t transition-colors hover:bg-muted/30">
                                                <td className="p-3 font-medium">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                            <Boxes className="size-4" />
                                                        </div>
                                                        <span className="truncate">{batch.product?.name}</span>
                                                        {batch.remaining_qty === 0 && (
                                                            <Badge className="border-0 bg-muted font-normal text-muted-foreground">Depleted</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                {isOwner && (
                                                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                                                        {batch.location?.name ?? '—'}
                                                    </td>
                                                )}
                                                <td className="p-3 text-muted-foreground">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Truck className="size-3.5 shrink-0" />
                                                        {batch.supplier?.name ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="p-3">
                                                    <div className="w-28">
                                                        <div className="flex items-baseline justify-between text-xs">
                                                            <span className="font-medium tabular-nums">{batch.remaining_qty}</span>
                                                            <span className="text-muted-foreground tabular-nums">/ {batch.received_qty}</span>
                                                        </div>
                                                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className={cn(
                                                                    'h-full rounded-full',
                                                                    pct === 0 ? 'bg-muted-foreground/30' : 'bg-[var(--pos-green)]',
                                                                )}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3 tabular-nums">₱{parseFloat(batch.cost_price).toFixed(2)}</td>
                                                <td className="p-3 whitespace-nowrap text-muted-foreground">{batch.received_date}</td>
                                                <td className="p-3">
                                                    <ExpiryBadge status={status} date={batch.expiry_date} />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleDelete(batch)}
                                                        className="size-8 text-red-600 opacity-80 transition-opacity hover:bg-red-50 hover:text-red-700 group-hover:opacity-100 dark:hover:bg-red-950/40"
                                                        title="Delete batch"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((batch) => {
                                const status = getExpiryStatus(batch.expiry_date);
                                const pct = batch.received_qty > 0 ? Math.round((batch.remaining_qty / batch.received_qty) * 100) : 0;

                                return (
                                    <div key={batch.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex min-w-0 items-start gap-2.5">
                                                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                    <Boxes className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <p className="truncate font-medium">{batch.product?.name}</p>
                                                        {batch.remaining_qty === 0 && (
                                                            <Badge className="border-0 bg-muted font-normal text-muted-foreground">Depleted</Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Truck className="size-3 shrink-0" />
                                                        {batch.supplier?.name ?? '—'}
                                                        {isOwner && batch.location?.name && (
                                                            <>
                                                                <span className="text-muted-foreground/50">&middot;</span>
                                                                {batch.location.name}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="shrink-0 text-sm font-semibold tabular-nums">₱{parseFloat(batch.cost_price).toFixed(2)}</p>
                                        </div>

                                        <div className="mt-2.5">
                                            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                                                <span>
                                                    <span className="font-medium text-foreground">{batch.remaining_qty}</span> / {batch.received_qty}{' '}
                                                    remaining
                                                </span>
                                            </div>
                                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className={cn(
                                                        'h-full rounded-full',
                                                        pct === 0 ? 'bg-muted-foreground/30' : 'bg-[var(--pos-green)]',
                                                    )}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {batch.received_date}
                                            </span>
                                            <ExpiryBadge status={status} date={batch.expiry_date} />
                                        </div>

                                        <div className="mt-3 border-t pt-2.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(batch)}
                                                className="w-full gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Delete Batch
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Pagination links={batches.links} />
                    </>
                )}
            </div>
        </div>
    );
}

function ExpiryBadge({ status, date }: { status: ExpiryStatus; date: string | null }) {
    if (status === 'none') {
return <span className="text-xs text-muted-foreground">—</span>;
}

    if (status === 'expired') {
        return (
            <Badge className="gap-1 border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400">
                <XCircle className="size-3" />
                Expired
            </Badge>
        );
    }

    if (status === 'soon') {
        return (
            <Badge className="gap-1 border-0 bg-amber-100 font-normal text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle className="size-3" />
                {date}
            </Badge>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3 text-[var(--pos-green)]" />
            {date}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent: 'teal' | 'amber' | 'red' | 'gray' }) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
        gray: 'bg-muted text-muted-foreground',
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

function Pagination({ links }: { links: PaginatedBatches['links'] }) {
    if (links.length <= 3) {
    return null;
}

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
            {links.map((link, i) => {
                const label = link.label.replace('&laquo;', '←').replace('&raquo;', '→');

                if (!link.url) {
                    return (
                        <span key={i} className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-muted-foreground/40">
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={cn(
                            'rounded-md px-3 py-1.5 text-sm transition-colors',
                            link.active ? 'bg-[var(--pos-teal)] text-white' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Boxes className="size-7" />
            </div>
            <p className="text-sm font-medium">No stock received yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Receive your first batch to start tracking stock on a FIFO basis.</p>
            <Button asChild size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                <Link href={stockBatches.create().url}>
                    <PackagePlus className="size-4" />
                    Receive Stock
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
            <p className="text-sm font-medium">No batches match your filters</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different search term or expiry filter.</p>
            {hasFilters && (
                <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}

StockBatchesIndex.layout = {
    breadcrumbs: [{ title: 'Stock Batches', href: stockBatches.index().url }],
};
