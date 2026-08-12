import { Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardCheck,
    ClipboardList,
    ClipboardX,
    Hash,
    Plus,
    Search,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InventoryCount {
    id: number;
    count_date: string;
    status: 'draft' | 'finalized';
    finalized_at: string | null;
    notes: string | null;
    items_count: number;
    location: { name: string };
    counted_by: { name: string };
}

type StatusFilter = 'all' | 'draft' | 'finalized';

export default function InventoryCountsIndex({ counts }: { counts: InventoryCount[] }) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<StatusFilter>('all');

    const isEmpty = counts.length === 0;

    const draftCount = useMemo(() => counts.filter((c) => c.status === 'draft').length, [counts]);
    const finalizedCount = useMemo(() => counts.filter((c) => c.status === 'finalized').length, [counts]);

    function toggleStatus(value: StatusFilter) {
        setStatus((current) => (current === value ? 'all' : value));
    }

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return counts.filter((c) => {
            const matchesQuery =
                !q ||
                [c.location.name, c.counted_by.name, c.notes].some((f) => f?.toLowerCase().includes(q));
            const matchesStatus = status === 'all' || c.status === status;

            return matchesQuery && matchesStatus;
        });
    }, [counts, query, status]);

    const noResults = !isEmpty && filtered.length === 0;
    const hasFilters = query.trim() !== '' || status !== 'all';

    function clearFilters() {
        setQuery('');
        setStatus('all');
    }

    function handleDelete(count: InventoryCount) {
        if (confirm(`Delete this draft count for ${count.location.name} (${count.count_date})? This cannot be undone.`)) {
            router.delete(`/inventory-counts/${count.id}`);
        }
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Inventory Counts" />
            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Inventory Counts</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                    {counts.length}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Physical stock counts, reconciled against system records.
                        </p>
                    </div>
                    <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                        <Link href="/inventory-counts/create">
                            <Plus className="size-4" />
                            Start New Count
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats — double as filters; tap one to filter, tap again to clear */}
                        <div className="grid grid-cols-3 gap-2.5 sm:max-w-lg sm:gap-3">
                            <StatCard
                                icon={ClipboardList}
                                label="Total Counts"
                                value={counts.length}
                                accent="teal"
                                active={status === 'all'}
                                onClick={() => setStatus('all')}
                            />
                            <StatCard
                                icon={Hash}
                                label="In Progress"
                                value={draftCount}
                                accent="amber"
                                active={status === 'draft'}
                                onClick={() => toggleStatus('draft')}
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Finalized"
                                value={finalizedCount}
                                accent="green"
                                active={status === 'finalized'}
                                onClick={() => toggleStatus('finalized')}
                            />
                        </div>

                        {/* Search */}
                        <div className="relative max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by branch or counted by…"
                                className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                aria-label="Search inventory counts"
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
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Branch</th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Counted By</th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Items</th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((c) => (
                                        <tr key={c.id} className="border-t transition-colors hover:bg-muted/30">
                                            <td className="p-2.5 whitespace-nowrap">{formatDate(c.count_date)}</td>
                                            <td className="p-2.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <ClipboardCheck className="size-3.5" />
                                                    </div>
                                                    <span className="font-medium">{c.location.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-2.5 text-muted-foreground">{c.counted_by.name}</td>
                                            <td className="p-2.5 text-muted-foreground tabular-nums">
                                                {c.items_count} item{c.items_count !== 1 ? 's' : ''}
                                            </td>
                                            <td className="p-2.5">
                                                <StatusBadge status={c.status} />
                                            </td>
                                            <td className="p-2.5 text-right">
                                                <div className="inline-flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                        className="hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                    >
                                                        <Link href={`/inventory-counts/${c.id}`}>
                                                            {c.status === 'draft' ? 'Continue' : 'View'}
                                                        </Link>
                                                    </Button>
                                                    {c.status === 'draft' && (
                                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(c)}>
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards on mobile */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((c) => (
                                <div key={c.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-start gap-2.5">
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                <ClipboardCheck className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{c.location.name}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {formatDate(c.count_date)} &middot; {c.counted_by.name}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </div>

                                    <div className="mt-2.5 flex items-center justify-between border-t pt-2.5">
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {c.items_count} item{c.items_count !== 1 ? 's' : ''} counted
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                asChild
                                                className="hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                            >
                                                <Link href={`/inventory-counts/${c.id}`}>
                                                    {c.status === 'draft' ? 'Continue' : 'View'}
                                                </Link>
                                            </Button>
                                            {c.status === 'draft' && (
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(c)}>
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'draft' | 'finalized' }) {
    if (status === 'finalized') {
        return (
            <Badge className="gap-1 border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                <CheckCircle2 className="size-3" />
                Finalized
            </Badge>
        );
    }

    return <Badge variant="secondary">Draft</Badge>;
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
    active,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    accent: 'teal' | 'amber' | 'green';
    active?: boolean;
    onClick?: () => void;
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
    }[accent];

    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'flex items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition-all',
                onClick && 'cursor-pointer hover:border-[var(--pos-teal)]/50 hover:shadow-sm',
                active && 'border-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]',
            )}
        >
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', styles)}>
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
            </div>
        </button>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ClipboardX className="size-7" />
            </div>
            <p className="text-sm font-medium">No inventory counts yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Start a count to reconcile physical stock against what the system expects.
            </p>
            <Button asChild className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                <Link href="/inventory-counts/create">
                    <Plus className="size-4" />
                    Start New Count
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
            <p className="text-sm font-medium">No counts match your filters</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different search term or status filter.</p>
            {hasFilters && (
                <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}

InventoryCountsIndex.layout = {
    breadcrumbs: [{ title: 'Inventory Counts', href: '/inventory-counts' }],
};
