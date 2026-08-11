import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownNarrowWide,
    Boxes,
    PackageX,
    PackagePlus,
    Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Location {
    id: number;
    name: string;
}

interface ProductRow {
    id: number;
    name: string;
    sku: string;
    low_stock_threshold: number;
    reorder_target_qty: number;
    stock_by_location: Record<number, number>;
    restock_by_location: Record<number, number>;
    total_stock: number;
}

interface Props {
    locations: Location[];
    products: ProductRow[];
}

function cellTone(qty: number, threshold: number): string {
    if (qty <= 0) {
        return 'bg-red-50 text-red-700 font-semibold dark:bg-red-950/30 dark:text-red-400';
    }

    if (qty <= threshold) {
        return 'bg-amber-50 text-amber-700 font-medium dark:bg-amber-950/30 dark:text-amber-400';
    }

    return 'text-foreground';
}

function badgeTone(qty: number, threshold: number): string {
    if (qty <= 0) {
        return 'border-0 bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400';
    }

    if (qty <= threshold) {
        return 'border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
    }

    return 'border-0 bg-muted text-muted-foreground';
}

function isLowAnywhere(p: ProductRow, locations: Location[]): boolean {
    return locations.some(
        (loc) => (p.stock_by_location[loc.id] ?? 0) <= p.low_stock_threshold,
    );
}

function isOutAnywhere(p: ProductRow, locations: Location[]): boolean {
    return locations.some((loc) => (p.stock_by_location[loc.id] ?? 0) <= 0);
}

function worstStock(p: ProductRow, locations: Location[]): number {
    return Math.min(
        ...locations.map((loc) => p.stock_by_location[loc.id] ?? 0),
    );
}

export default function StockByBranch({ locations, products }: Props) {
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);
    const [sortCriticalFirst, setSortCriticalFirst] = useState(false);

    const lowCount = useMemo(
        () => products.filter((p) => isLowAnywhere(p, locations)).length,
        [products, locations],
    );
    const outCount = useMemo(
        () => products.filter((p) => isOutAnywhere(p, locations)).length,
        [products, locations],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        const rows = products.filter((p) => {
            const matchesQuery =
                !q ||
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q);

            if (!matchesQuery) {
                return false;
            }

            if (!lowOnly) {
                return true;
            }

            return isLowAnywhere(p, locations);
        });

        if (sortCriticalFirst) {
            return [...rows].sort(
                (a, b) => worstStock(a, locations) - worstStock(b, locations),
            );
        }

        return rows;
    }, [products, query, lowOnly, locations, sortCriticalFirst]);

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Stock by Branch" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-6 sm:p-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                            <Boxes className="size-5 text-[var(--pos-teal)]" />
                            Stock by Branch
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Current stock per product, side by side across every
                            branch.
                        </p>
                    </div>
                    <Link
                        href="/stock-batches"
                        className="text-sm font-medium text-[var(--pos-teal)] hover:underline"
                    >
                        &larr; Back to Stock Batches
                    </Link>
                </div>

                {/* Stats — double as filters; tap "Low Somewhere" to filter, tap again to clear */}
                <div className="grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
                    <BranchStatCard
                        icon={Boxes}
                        label="Products"
                        value={products.length}
                        accent="teal"
                        active={!lowOnly}
                        onClick={() => setLowOnly(false)}
                    />
                    <BranchStatCard
                        icon={AlertTriangle}
                        label="Low Somewhere"
                        value={lowCount}
                        accent="amber"
                        active={lowOnly}
                        onClick={() => setLowOnly((v) => !v)}
                    />
                    <BranchStatCard
                        icon={PackageX}
                        label="Out Somewhere"
                        value={outCount}
                        accent="red"
                    />
                </div>

                {/* Search + sort */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                        <div className="relative sm:w-72">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search product or SKU..."
                                className="pl-8 focus-visible:ring-[var(--pos-teal)]"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => setSortCriticalFirst((v) => !v)}
                            aria-pressed={sortCriticalFirst}
                            className={cn(
                                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors',
                                sortCriticalFirst
                                    ? 'border-[var(--pos-teal)] bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]'
                                    : 'text-muted-foreground hover:bg-muted',
                            )}
                        >
                            <ArrowDownNarrowWide className="size-3.5" />
                            Most critical first
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {filtered.length} product
                        {filtered.length !== 1 ? 's' : ''}
                        {lowOnly || query ? ` of ${products.length}` : ''}
                    </p>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border py-14 text-center">
                        <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Search className="size-5" />
                        </div>
                        <p className="text-sm font-medium">No products match</p>
                        <p className="text-sm text-muted-foreground">
                            {lowOnly
                                ? 'Try turning off "Low Somewhere," or adjust'
                                : 'Adjust'}{' '}
                            your search.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Comparison table — needs the wide, side-by-side layout to actually
                            compare branches at a glance, so it stays a table (not cards) but
                            only from md up, where there's enough width for it without forcing
                            horizontal scroll on most branch counts. */}
                        <div className="hidden overflow-x-auto rounded-xl border md:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="sticky left-0 bg-muted/50 px-4 py-2.5 text-left font-medium">
                                            Product
                                        </th>
                                        {locations.map((loc) => (
                                            <th
                                                key={loc.id}
                                                className="px-4 py-2.5 text-right font-medium whitespace-nowrap"
                                            >
                                                {loc.name}
                                            </th>
                                        ))}
                                        <th className="bg-muted/70 px-4 py-2.5 text-right font-medium whitespace-nowrap">
                                            Total
                                        </th>
                                        <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                                            <span className="sr-only">
                                                Actions
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filtered.map((p) => {
                                        const low = isLowAnywhere(p, locations);
                                        const out = isOutAnywhere(p, locations);

                                        return (
                                            <tr
                                                key={p.id}
                                                className={cn(
                                                    'group border-l-2 hover:bg-muted/30',
                                                    out
                                                        ? 'border-l-red-400'
                                                        : low
                                                          ? 'border-l-amber-400'
                                                          : 'border-l-transparent',
                                                )}
                                            >
                                                <td className="sticky left-0 bg-background px-4 py-2.5 group-hover:bg-muted/30">
                                                    <p className="font-medium">
                                                        {p.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {p.sku}
                                                    </p>
                                                </td>
                                                {locations.map((loc) => {
                                                    const qty =
                                                        p.stock_by_location[
                                                            loc.id
                                                        ] ?? 0;
                                                    const restock =
                                                        p.restock_by_location[
                                                            loc.id
                                                        ] ?? 0;

                                                    return (
                                                        <td
                                                            key={loc.id}
                                                            className={cn(
                                                                'px-4 py-2.5 text-right tabular-nums',
                                                                cellTone(
                                                                    qty,
                                                                    p.low_stock_threshold,
                                                                ),
                                                            )}
                                                        >
                                                            {qty}
                                                            {restock > 0 && (
                                                                <span className="ml-1 text-xs font-normal text-[var(--pos-teal,#00a79b)]">
                                                                    (+{restock})
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="bg-muted/20 px-4 py-2.5 text-right font-semibold tabular-nums">
                                                    {p.total_stock}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 opacity-0 transition-opacity group-hover:opacity-100 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title={`Receive stock for ${p.name}`}
                                                    >
                                                        <Link
                                                            href={`/stock-batches/create?product_id=${p.id}`}
                                                        >
                                                            <PackagePlus className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile card view — a wide N-branch-column table would either force
                            horizontal scrolling or shrink columns unreadably on a phone. Each
                            product becomes a card, with per-branch stock as a wrapping list of
                            badges, plus the same quick "receive stock" action as the table. */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:hidden">
                            {filtered.map((p) => {
                                const low = isLowAnywhere(p, locations);
                                const out = isOutAnywhere(p, locations);

                                return (
                                    <div
                                        key={p.id}
                                        className={cn(
                                            'rounded-xl border border-l-2 bg-card p-3 shadow-sm',
                                            out
                                                ? 'border-l-red-400'
                                                : low
                                                  ? 'border-l-amber-400'
                                                  : 'border-l-transparent',
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">
                                                    {p.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {p.sku}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="text-xs text-muted-foreground">
                                                    Total
                                                </p>
                                                <p className="font-mono text-sm font-semibold tabular-nums">
                                                    {p.total_stock}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t pt-2.5">
                                            {locations.map((loc) => {
                                                const qty =
                                                    p.stock_by_location[
                                                        loc.id
                                                    ] ?? 0;
                                                const restock =
                                                    p.restock_by_location[
                                                        loc.id
                                                    ] ?? 0;

                                                return (
                                                    <Badge
                                                        key={loc.id}
                                                        className={cn(
                                                            'gap-1 font-normal',
                                                            badgeTone(
                                                                qty,
                                                                p.low_stock_threshold,
                                                            ),
                                                        )}
                                                    >
                                                        <span className="text-muted-foreground">
                                                            {loc.name}
                                                        </span>
                                                        <span className="font-mono tabular-nums">
                                                            {qty}
                                                        </span>
                                                        {restock > 0 && (
                                                            <span className="font-mono text-[10px] tabular-nums opacity-75">
                                                                (+{restock})
                                                            </span>
                                                        )}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-2.5 border-t pt-2.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="w-full gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                            >
                                                <Link
                                                    href={`/stock-batches/create?product_id=${p.id}`}
                                                >
                                                    <PackagePlus className="size-3.5" />
                                                    Receive Stock
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-red-200 dark:bg-red-900" />{' '}
                        Out of stock
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-amber-200 dark:bg-amber-900" />{' '}
                        At or below threshold
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-muted-foreground/20" />{' '}
                        Healthy stock
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="font-mono text-[var(--pos-teal,#00a79b)]">(+N)</span>
                        How many more to buy for that branch
                    </span>
                </div>
            </div>
        </div>
    );
}

function BranchStatCard({
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
    accent: 'teal' | 'amber' | 'red';
    active?: boolean;
    onClick?: () => void;
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            aria-pressed={active}
            className={cn(
                'flex items-center gap-2.5 rounded-xl border bg-card p-3 text-left transition-all',
                onClick &&
                    'cursor-pointer hover:border-[var(--pos-teal)]/50 hover:shadow-sm',
                active &&
                    'border-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]',
            )}
        >
            <div
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    styles,
                )}
            >
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                    {label}
                </p>
            </div>
        </button>
    );
}

StockByBranch.layout = {
    breadcrumbs: [
        { title: 'Stock Batches', href: '/stock-batches' },
        { title: 'By Branch', href: '/stock-batches/by-branch' },
    ],
};
