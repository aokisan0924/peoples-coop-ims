import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, Pencil, Tag } from 'lucide-react';
import ProductFormFields from '@/components/products/product-form-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import products from '@/routes/products';
import type { Product } from '@/types/inventory';

interface Option {
    id: number;
    name: string;
    abbreviation?: string;
}

export default function EditProduct({
    product,
    categories,
    units,
}: {
    product: Product;
    categories: Option[];
    units: Option[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        barcode: product.barcode ?? '',
        pack_barcode: product.pack_barcode ?? '',
        category_id: product.category_id,
        base_unit_id: product.base_unit_id,
        pack_unit_id: product.pack_unit_id,
        pack_conversion_factor: product.pack_conversion_factor,
        cost_price: product.cost_price,
        markup_percentage: product.markup_percentage,
        member_piece_price_override: product.member_piece_price_override ?? '',
        member_pack_price_override: product.member_pack_price_override ?? '',
        low_stock_threshold: product.low_stock_threshold,
        is_active: product.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(products.update(product.id).url);
    }

    const categoryName = categories.find(
        (c) => c.id === data.category_id,
    )?.name;
    const baseUnitLabel =
        units.find((u) => u.id === data.base_unit_id)?.abbreviation ??
        units.find((u) => u.id === data.base_unit_id)?.name;

    return (
        <div
            className="mx-auto max-w-7xl p-3 pb-28 sm:p-6 lg:pb-6"
            style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
        >
            <Head title="Edit Product" />

            <Button
                variant="ghost"
                size="sm"
                asChild
                className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
            >
                <Link href={products.index().url}>
                    <ArrowLeft className="size-4" />
                    Products
                </Link>
            </Button>

            {/* Two columns on wide screens so the form isn't stranded in a narrow
                centered card — a live pricing preview + tips fill the extra space. */}
            <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
                <Card className="mx-auto w-full max-w-3xl animate-in shadow-sm duration-300 fade-in-0 slide-in-from-bottom-2 lg:mx-0 lg:max-w-none">
                    <CardHeader className="sm:px-8 sm:pt-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                                <Pencil className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <CardTitle className="text-lg">
                                    Edit Product
                                </CardTitle>
                                <CardDescription className="truncate">
                                    Editing "{product.name}"
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="sm:px-8 sm:pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <ProductFormFields
                                data={data}
                                setData={setData}
                                errors={errors}
                                categories={categories}
                                units={units}
                                isEdit
                            />

                            {/* On mobile/tablet, actions pin to the bottom of the viewport so they
                                stay reachable no matter how far the form scrolls; on large screens,
                                where the sidebar preview is visible, they sit inline after the fields. */}
                            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:z-auto lg:mt-6 lg:flex-row-reverse lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    {processing ? 'Saving…' : 'Update Product'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="sm:flex-1"
                                >
                                    <Link href={products.index().url}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Sidebar — hidden below lg where there isn't room to show it without
                    pushing the form off-balance. */}
                <div className="mt-4 hidden space-y-4 lg:sticky lg:top-6 lg:mt-0 lg:block">
                    <PreviewCard
                        name={data.name}
                        barcode={data.barcode}
                        categoryName={categoryName}
                        baseUnitLabel={baseUnitLabel}
                        costPrice={data.cost_price}
                        markupPercentage={data.markup_percentage}
                        active={data.is_active}
                    />
                    <TipsCard />
                </div>
            </div>
        </div>
    );
}

function PreviewCard({
    name,
    barcode,
    categoryName,
    baseUnitLabel,
    costPrice,
    markupPercentage,
    active,
}: {
    name: string;
    barcode: string;
    categoryName?: string;
    baseUnitLabel?: string;
    costPrice: string | number;
    markupPercentage: string | number;
    active: boolean;
}) {
    const cost = parseFloat(String(costPrice));
    const markup = parseFloat(String(markupPercentage));
    const estimatedPrice =
        !isNaN(cost) && !isNaN(markup) && cost > 0
            ? cost * (1 + markup / 100)
            : null;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Preview
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2.5">
                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Package className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p
                                    className={cn(
                                        'truncate font-medium',
                                        !name && 'text-muted-foreground italic',
                                    )}
                                >
                                    {name || 'Untitled product'}
                                </p>
                                {categoryName && (
                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Tag className="size-3 shrink-0" />
                                        {categoryName}
                                    </p>
                                )}
                                {barcode && (
                                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                                        {barcode}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Badge
                            className={cn(
                                'shrink-0 gap-1.5 border-0 font-normal',
                                active
                                    ? 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]'
                                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                            )}
                            style={
                                {
                                    '--pos-green': '#8dc645',
                                } as React.CSSProperties
                            }
                        >
                            <span
                                className={cn(
                                    'size-1.5 rounded-full',
                                    active
                                        ? 'bg-[var(--pos-green)]'
                                        : 'bg-red-500',
                                )}
                            />
                            {active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Estimated member price
                        </p>
                        <p
                            className={cn(
                                'text-lg font-semibold tabular-nums',
                                estimatedPrice === null &&
                                    'text-muted-foreground italic',
                            )}
                        >
                            {estimatedPrice !== null
                                ? `₱${estimatedPrice.toFixed(2)}`
                                : 'Enter a cost price'}
                        </p>
                    </div>
                    {baseUnitLabel && (
                        <Badge className="border-0 bg-[var(--pos-teal)]/10 font-normal text-[var(--pos-teal)]">
                            / {baseUnitLabel}
                        </Badge>
                    )}
                </div>

                <p className="text-xs text-muted-foreground">
                    This is how the product will appear in your catalog.
                </p>
            </CardContent>
        </Card>
    );
}

function TipsCard() {
    const tips = [
        'Turning a product inactive hides it from checkout without deleting its history.',
        'Markup % is applied to the cost price to calculate the member selling price.',
        'Changes save only after you press Update Product.',
    ];

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Tips
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                    {tips.map((tip) => (
                        <li key={tip} className="flex gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-[var(--pos-teal)]" />
                            {tip}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

EditProduct.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Edit Product', href: '#' },
    ],
};
