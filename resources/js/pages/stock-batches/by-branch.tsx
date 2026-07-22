import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, Boxes, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
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
    stock_by_location: Record<number, number>;
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

export default function StockByBranch({ locations, products }: Props) {
    const [query, setQuery] = useState('');
    const [lowOnly, setLowOnly] = useState(false);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return products.filter((p) => {
            const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);

            if (!matchesQuery) {
return false;
}

            if (!lowOnly) {
return true;
}

            return locations.some((loc) => (p.stock_by_location[loc.id] ?? 0) <= p.low_stock_threshold);
        });
    }, [products, query, lowOnly, locations]);

    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Stock by Branch" />

            <div className="p-4 sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-lg font-semibold">
                            <Boxes className="size-5 text-[var(--pos-teal)]" />
                            Stock by Branch
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Current stock per product, side by side across every branch.
                        </p>
                    </div>
                    <Link href="/stock-batches" className="text-sm text-[var(--pos-teal)] hover:underline">
                        &larr; Back to Stock Batches
                    </Link>
                </div>

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="relative sm:w-72">
                            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search product or SKU..."
                                className="pl-8"
                            />
                        </div>
                        <Button
                            type="button"
                            variant={lowOnly ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setLowOnly((v) => !v)}
                            className={cn('gap-1.5', lowOnly && 'bg-[var(--pos-teal)] hover:bg-[var(--pos-teal)]/90')}
                        >
                            <AlertTriangle className="size-3.5" />
                            Low stock only
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                        {lowOnly || query ? ` of ${products.length}` : ''}
                    </p>
                </div>

                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                            <tr>
                                <th className="sticky left-0 bg-muted/50 px-4 py-2.5 text-left font-medium">Product</th>
                                {locations.map((loc) => (
                                    <th key={loc.id} className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                                        {loc.name}
                                    </th>
                                ))}
                                <th className="bg-muted/70 px-4 py-2.5 text-right font-medium whitespace-nowrap">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map((p) => (
                                <tr key={p.id} className="group hover:bg-muted/30">
                                    <td className="sticky left-0 bg-background px-4 py-2.5 group-hover:bg-muted/30">
                                        <p className="font-medium">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">{p.sku}</p>
                                    </td>
                                    {locations.map((loc) => {
                                        const qty = p.stock_by_location[loc.id] ?? 0;

                                        return (
                                            <td
                                                key={loc.id}
                                                className={cn('px-4 py-2.5 text-right tabular-nums', cellTone(qty, p.low_stock_threshold))}
                                            >
                                                {qty}
                                            </td>
                                        );
                                    })}
                                    <td className="bg-muted/20 px-4 py-2.5 text-right font-semibold tabular-nums">{p.total_stock}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={locations.length + 2} className="px-4 py-14">
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <div className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                <Search className="size-5" />
                                            </div>
                                            <p className="text-sm font-medium">No products match</p>
                                            <p className="text-sm text-muted-foreground">
                                                {lowOnly ? 'Try turning off "Low stock only," or adjust' : 'Adjust'} your search.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-red-200 dark:bg-red-900" /> Out of stock
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-amber-200 dark:bg-amber-900" /> At or below threshold
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block size-2.5 rounded-full bg-muted-foreground/20" /> Healthy stock
                    </span>
                </div>
            </div>
        </div>
    );
}

StockByBranch.layout = {
    breadcrumbs: [
        { title: 'Stock Batches', href: '/stock-batches' },
        { title: 'By Branch', href: '/stock-batches/by-branch' },
    ],
};
