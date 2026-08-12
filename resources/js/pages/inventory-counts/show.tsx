import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    Hash,
    Info,
    Package,
    Scale,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface Product {
    id: number;
    name: string;
    sku: string | null;
    barcode: string | null;
    cost_price: string;
}

interface CountItem {
    id: number;
    product_id: number;
    expected_qty: number;
    counted_qty: number;
    variance: number;
    unit_cost_at_count: string;
    product: Product;
}

interface InventoryCount {
    id: number;
    count_date: string;
    status: 'draft' | 'finalized';
    finalized_at: string | null;
    notes: string | null;
    location: { name: string };
    counted_by: { name: string };
    items: CountItem[];
}

interface Props {
    count: InventoryCount;
    products: Product[];
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShowInventoryCount({ count, products }: Props) {
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [countedQty, setCountedQty] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isDraft = count.status === 'draft';
    const countedProductIds = new Set(count.items.map((i) => i.product_id));

    const filteredProducts = useMemo(() => {
        if (!search.trim()) {
            return [];
        }

        const q = search.trim().toLowerCase();

        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q) ||
                    p.barcode?.toLowerCase().includes(q),
            )
            .slice(0, 8);
    }, [search, products]);

    const summary = useMemo(() => {
        const overCount = count.items.filter((i) => i.variance > 0).length;
        const shortCount = count.items.filter((i) => i.variance < 0).length;
        const totalVarianceValue = count.items.reduce(
            (sum, i) => sum + i.variance * parseFloat(i.unit_cost_at_count),
            0,
        );

        return { overCount, shortCount, totalVarianceValue };
    }, [count.items]);

    function selectProduct(p: Product) {
        setSelectedProduct(p);
        setSearch(p.name);
        setCountedQty('');
    }

    function handleAddItem(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedProduct || countedQty === '') {
            return;
        }

        setSubmitting(true);
        router.post(
            `/inventory-counts/${count.id}/items`,
            { product_id: selectedProduct.id, counted_qty: countedQty },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedProduct(null);
                    setSearch('');
                    setCountedQty('');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    }

    function handleRemoveItem(item: CountItem) {
        router.delete(`/inventory-counts/${count.id}/items/${item.id}`, { preserveScroll: true });
    }

    function handleFinalize() {
        if (
            confirm(
                'Finalize this count? Stock records will be adjusted to match what was physically counted — this cannot be undone.',
            )
        ) {
            router.post(`/inventory-counts/${count.id}/finalize`);
        }
    }

    function handleDeleteDraft() {
        if (confirm('Delete this draft count? All counted items will be lost.')) {
            router.delete(`/inventory-counts/${count.id}`);
        }
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title={`Inventory Count — ${count.location.name}`} />

            <div className="mx-auto max-w-5xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="size-9 shrink-0">
                        <Link href="/inventory-counts">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-1 items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                    <ClipboardCheck className="size-4" />
                                </div>
                                <h1 className="text-xl font-semibold tracking-tight">{count.location.name}</h1>
                            </div>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                {count.count_date} · Counted by {count.counted_by.name}
                            </p>
                        </div>
                        {count.status === 'finalized' ? (
                            <Badge className="gap-1 border-0 bg-[var(--pos-green)]/15 text-[var(--pos-green)]">
                                <CheckCircle2 className="size-3" />
                                Finalized
                            </Badge>
                        ) : (
                            <Badge variant="secondary">Draft</Badge>
                        )}
                    </div>
                </div>

                {count.notes && <div className="rounded-xl border bg-muted/30 p-4 text-sm">{count.notes}</div>}

                {/* Summary at a glance */}
                {count.items.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <StatCard icon={Hash} label="Items Counted" value={String(count.items.length)} accent="teal" />
                        <StatCard
                            icon={TrendingUp}
                            label="Over"
                            value={String(summary.overCount)}
                            accent="green"
                        />
                        <StatCard
                            icon={TrendingDown}
                            label="Short"
                            value={String(summary.shortCount)}
                            accent="red"
                        />
                        <StatCard
                            icon={Scale}
                            label="Net Value Impact"
                            value={`${summary.totalVarianceValue < 0 ? '-' : summary.totalVarianceValue > 0 ? '+' : ''}${peso(Math.abs(summary.totalVarianceValue))}`}
                            accent={summary.totalVarianceValue < 0 ? 'red' : summary.totalVarianceValue > 0 ? 'green' : 'gray'}
                        />
                    </div>
                )}

                {isDraft && (
                    <div className="rounded-xl border bg-card p-4 sm:p-5">
                        <form onSubmit={handleAddItem} className="space-y-3">
                            <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                <Search className="size-4 shrink-0" />
                                <p className="text-sm font-medium">Add a Counted Product</p>
                            </div>

                            <div className="relative">
                                <Label htmlFor="product_search">Product (name, SKU, or barcode)</Label>
                                <Input
                                    id="product_search"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setSelectedProduct(null);
                                    }}
                                    placeholder="Start typing to search..."
                                    autoComplete="off"
                                    className="focus-visible:ring-[var(--pos-teal)]"
                                />
                                {search && !selectedProduct && filteredProducts.length > 0 && (
                                    <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border bg-background shadow-md">
                                        {filteredProducts.map((p) => (
                                            <button
                                                type="button"
                                                key={p.id}
                                                onClick={() => selectProduct(p)}
                                                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                                            >
                                                <span>
                                                    {p.name}
                                                    {p.sku && <span className="text-muted-foreground"> · {p.sku}</span>}
                                                </span>
                                                {countedProductIds.has(p.id) && (
                                                    <Badge variant="secondary" className="ml-2">
                                                        Already counted
                                                    </Badge>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {selectedProduct && (
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <Label htmlFor="counted_qty">Physically Counted Quantity *</Label>
                                        <Input
                                            id="counted_qty"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={countedQty}
                                            onChange={(e) => setCountedQty(e.target.value)}
                                            autoFocus
                                            className="focus-visible:ring-[var(--pos-teal)]"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={submitting || countedQty === ''}
                                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                    >
                                        {countedProductIds.has(selectedProduct.id) ? 'Update Count' : 'Add to Count'}
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {count.items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Package className="size-5" />
                        </div>
                        <p className="text-sm font-medium">No products counted yet</p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            {isDraft ? 'Search for a product above to start counting.' : 'This count has no items.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Table on larger screens */}
                        <div className="hidden overflow-hidden rounded-xl border bg-card lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="p-3 text-left font-medium">Product</th>
                                        <th className="p-3 text-right font-medium">Expected</th>
                                        <th className="p-3 text-right font-medium">Counted</th>
                                        <th className="p-3 text-right font-medium">Variance</th>
                                        <th className="p-3 text-right font-medium">Value Impact</th>
                                        {isDraft && <th className="p-3 text-right font-medium">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {count.items.map((item) => {
                                        const valueImpact = item.variance * parseFloat(item.unit_cost_at_count);

                                        return (
                                            <tr key={item.id} className="border-t">
                                                <td className="p-3 font-medium">
                                                    {item.product.name}
                                                    {item.product.sku && (
                                                        <span className="text-muted-foreground"> · {item.product.sku}</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right tabular-nums">{item.expected_qty}</td>
                                                <td className="p-3 text-right tabular-nums">{item.counted_qty}</td>
                                                <td className="p-3 text-right tabular-nums">
                                                    <VarianceValue variance={item.variance} />
                                                </td>
                                                <td className="p-3 text-right tabular-nums">
                                                    <ValueImpact value={valueImpact} />
                                                </td>
                                                {isDraft && (
                                                    <td className="p-3 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                            onClick={() => handleRemoveItem(item)}
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Remove
                                                        </Button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t bg-muted/40 font-medium">
                                        <td className="p-3" colSpan={4}>
                                            Net variance value
                                        </td>
                                        <td className="p-3 text-right" colSpan={isDraft ? 2 : 1}>
                                            <ValueImpact value={summary.totalVarianceValue} bold />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Cards on mobile */}
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {count.items.map((item) => {
                                const valueImpact = item.variance * parseFloat(item.unit_cost_at_count);

                                return (
                                    <div key={item.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{item.product.name}</p>
                                                {item.product.sku && (
                                                    <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                                                )}
                                            </div>
                                            {isDraft && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="shrink-0 gap-1 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30"
                                                    onClick={() => handleRemoveItem(item)}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="mt-2.5 grid grid-cols-3 gap-2 border-t pt-2.5 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">Expected</p>
                                                <p className="mt-0.5 font-medium tabular-nums">{item.expected_qty}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Counted</p>
                                                <p className="mt-0.5 font-medium tabular-nums">{item.counted_qty}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">Variance</p>
                                                <p className="mt-0.5 tabular-nums">
                                                    <VarianceValue variance={item.variance} />
                                                </p>
                                            </div>
                                        </div>
                                        {valueImpact !== 0 && (
                                            <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs">
                                                <span className="text-muted-foreground">Value impact</span>
                                                <ValueImpact value={valueImpact} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {isDraft ? (
                    <>
                        <div className="rounded-xl border bg-[var(--pos-teal)]/5 p-4">
                            <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                <Info className="size-4 shrink-0" />
                                <p className="text-sm font-medium">Before you finalize</p>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Finalizing adjusts stock batches to match what was physically counted — shrinkage
                                is FIFO-deducted, found stock becomes a new batch. This cannot be undone, so make
                                sure every counted product above looks right first.
                            </p>
                        </div>

                        {/* Desktop actions */}
                        <div className="hidden gap-2 sm:flex">
                            <Button
                                onClick={handleFinalize}
                                disabled={count.items.length === 0}
                                className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                            >
                                <CheckCircle2 className="size-4" />
                                Finalize Count
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteDraft} className="gap-1.5">
                                <Trash2 className="size-4" />
                                Delete Draft
                            </Button>
                        </div>

                        {/* Mobile sticky action bar */}
                        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 sm:hidden">
                            <Button
                                onClick={handleFinalize}
                                disabled={count.items.length === 0}
                                className="flex-1 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                            >
                                <CheckCircle2 className="size-4" />
                                Finalize
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteDraft} className="flex-1 gap-1.5">
                                <Trash2 className="size-4" />
                                Delete
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-3">
                        <p className="text-sm text-muted-foreground">
                            Finalized {count.finalized_at} — stock has been adjusted to match this count.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/inventory-counts">Back to Counts</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function VarianceValue({ variance }: { variance: number }) {
    if (variance === 0) {
        return <span className="text-muted-foreground">0</span>;
    }

    return (
        <span className={variance < 0 ? 'text-red-600' : 'text-[var(--pos-green)]'}>
            {variance > 0 ? '+' : ''}
            {variance}
        </span>
    );
}

function ValueImpact({ value, bold }: { value: number; bold?: boolean }) {
    if (value === 0) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <span className={cn(value < 0 ? 'text-red-600' : 'text-[var(--pos-green)]', bold && 'font-semibold')}>
            {value < 0 ? '-' : '+'}
            {peso(Math.abs(value))}
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    accent: 'teal' | 'amber' | 'red' | 'green' | 'gray';
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
        gray: 'bg-muted text-muted-foreground',
    }[accent];

    return (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', styles)}>
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="truncate text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

ShowInventoryCount.layout = {
    breadcrumbs: [{ title: 'Inventory Counts', href: '/inventory-counts' }],
};
