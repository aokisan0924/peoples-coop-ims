import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Barcode,
    Package,
    Pencil,
    Printer,
    Search,
    Tag,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import products from '@/routes/products';
import type { Product } from '@/types/inventory';

export default function ProductsIndex({
    products: productList,
}: {
    products: Product[];
}) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('all');

    const isEmpty = productList.length === 0;

    const lowStockCount = useMemo(
        () => productList.filter((p) => p.is_low_stock).length,
        [productList],
    );
    const inactiveCount = useMemo(
        () => productList.filter((p) => !p.is_active).length,
        [productList],
    );

    const categoryOptions = useMemo(() => {
        const set = new Set<string>();
        productList.forEach((p) => {
            if (p.category?.name) {
                set.add(p.category.name);
            }
        });

        return Array.from(set).sort();
    }, [productList]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return productList.filter((p) => {
            const matchesQuery =
                !q ||
                [p.name, p.barcode, p.sku, p.category?.name].some((field) =>
                    field?.toLowerCase().includes(q),
                );
            const matchesCategory =
                category === 'all' || p.category?.name === category;

            return matchesQuery && matchesCategory;
        });
    }, [productList, query, category]);

    const noResults = !isEmpty && filtered.length === 0;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Products" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">
                                Products
                            </h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                    {productList.length}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage your catalog, stock levels, and pricing.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    >
                        <Link href={products.create().url}>
                            <Package className="size-4" />
                            Add Product
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
                            <StatCard
                                icon={Package}
                                label="Total"
                                value={productList.length}
                                accent="teal"
                            />
                            <StatCard
                                icon={AlertTriangle}
                                label="Low Stock"
                                value={lowStockCount}
                                accent="amber"
                            />
                            <StatCard
                                icon={XCircle}
                                label="Inactive"
                                value={inactiveCount}
                                accent="red"
                            />
                        </div>

                        {/* Search + category filter */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative max-w-sm flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by name, barcode, or SKU…"
                                    className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                    aria-label="Search products"
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
                            {categoryOptions.length > 0 && (
                                <select
                                    value={category}
                                    onChange={(e) =>
                                        setCategory(e.target.value)
                                    }
                                    aria-label="Filter by category"
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-[var(--pos-teal)] focus-visible:outline-none sm:w-48"
                                >
                                    <option value="all">All categories</option>
                                    {categoryOptions.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults
                        onClear={() => {
                            setQuery('');
                            setCategory('all');
                        }}
                    />
                ) : (
                    <>
                        {/* Table on larger screens — a 6-column table is comfortable there.
                            Cards on mobile, where that same table would force horizontal scroll. */}
                        <div className="hidden overflow-hidden rounded-xl border lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Name
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Barcode
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Category
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Stock
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Member Price
                                        </th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="group border-t transition-colors hover:bg-muted/30"
                                        >
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <Package className="size-4" />
                                                    </div>
                                                    <span className="truncate">
                                                        {product.name}
                                                    </span>
                                                    {!product.is_active && (
                                                        <Badge className="border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 font-mono text-xs text-muted-foreground">
                                                {product.barcode ??
                                                    product.sku ??
                                                    '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {product.category?.name ?? '—'}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-1.5 tabular-nums">
                                                    {product.total_stock}
                                                    {product.is_low_stock && (
                                                        <Badge className="gap-1 border-0 bg-amber-100 font-normal text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                                            <AlertTriangle className="size-3" />
                                                            Low
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 tabular-nums">
                                                ₱
                                                {product.member_piece_price?.toFixed(
                                                    2,
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title="Edit"
                                                    >
                                                        <Link
                                                            href={
                                                                products.edit(
                                                                    product.id,
                                                                ).url
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title="Show barcode"
                                                    >
                                                        <Link
                                                            href={`/products/${product.id}/barcode`}
                                                        >
                                                            <Barcode className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title="Print label"
                                                    >
                                                        <a
                                                            href={`/products/${product.id}/label`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Printer className="size-3.5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((product) => (
                                <div
                                    key={product.id}
                                    className="rounded-xl border bg-card p-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-start gap-2.5">
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                <Package className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="truncate font-medium">
                                                        {product.name}
                                                    </p>
                                                    {!product.is_active && (
                                                        <Badge className="border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                {product.category?.name && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Tag className="size-3 shrink-0" />
                                                        {product.category.name}
                                                    </p>
                                                )}
                                                {(product.barcode ??
                                                    product.sku) && (
                                                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                                        {product.barcode ??
                                                            product.sku}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                                            ₱
                                            {product.member_piece_price?.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="tabular-nums">
                                            Stock: {product.total_stock}
                                        </span>
                                        {product.is_low_stock && (
                                            <Badge className="gap-1 border-0 bg-amber-100 font-normal text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                                <AlertTriangle className="size-3" />
                                                Low
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mt-3 grid grid-cols-3 gap-1.5 border-t pt-2.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <Link
                                                href={
                                                    products.edit(product.id)
                                                        .url
                                                }
                                            >
                                                <Pencil className="size-3.5" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <Link
                                                href={`/products/${product.id}/barcode`}
                                            >
                                                <Barcode className="size-3.5" />
                                                Barcode
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <a
                                                href={`/products/${product.id}/label`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Printer className="size-3.5" />
                                                Print
                                            </a>
                                        </Button>
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

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    accent: 'teal' | 'amber' | 'red';
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
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
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Package className="size-7" />
            </div>
            <p className="text-sm font-medium">No products yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Add your first product to start tracking stock and pricing.
            </p>
            <Button
                asChild
                size="sm"
                className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
            >
                <Link href={products.create().url}>
                    <Package className="size-4" />
                    Add Product
                </Link>
            </Button>
        </div>
    );
}

function NoResults({ onClear }: { onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">
                No products match your filters
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Try a different search term or category.
            </p>
            <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onClear}
            >
                Clear filters
            </Button>
        </div>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [{ title: 'Products', href: products.index().url }],
};
