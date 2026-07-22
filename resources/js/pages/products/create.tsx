import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Package, Tag } from 'lucide-react';
import ProductFormFields from '@/components/products/product-form-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import products from '@/routes/products';

interface Option {
    id: number;
    name: string;
    abbreviation?: string;
}

export default function CreateProduct({ categories, units }: { categories: Option[]; units: Option[] }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        barcode: '',
        category_id: null as number | null,
        base_unit_id: null as number | null,
        pack_unit_id: null as number | null,
        pack_conversion_factor: null as number | null,
        cost_price: '',
        markup_percentage: '18',
        low_stock_threshold: 10,
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(products.store().url);
    }

    const categoryName = categories.find((c) => c.id === data.category_id)?.name;
    const baseUnitLabel = units.find((u) => u.id === data.base_unit_id)?.abbreviation ?? units.find((u) => u.id === data.base_unit_id)?.name;

    return (
        <div className="mx-auto max-w-7xl p-3 pb-28 sm:p-6 lg:pb-6" style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Add Product" />

            <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 gap-1.5 text-muted-foreground">
                <Link href={products.index().url}>
                    <ArrowLeft className="size-4" />
                    Products
                </Link>
            </Button>

            {/* Two columns on wide screens so the form isn't stranded in a narrow
                centered card — a live pricing preview + tips fill the extra space. */}
            <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6">
                <Card className="mx-auto w-full max-w-3xl animate-in fade-in-0 slide-in-from-bottom-2 shadow-sm duration-300 lg:mx-0 lg:max-w-none">
                    <CardHeader className="sm:px-8 sm:pt-8">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                                <Package className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Add Product</CardTitle>
                                <CardDescription>Add a new item to your catalog.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="sm:px-8 sm:pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <ProductFormFields data={data} setData={setData} errors={errors} categories={categories} units={units} />

                            {/* On mobile/tablet, actions pin to the bottom of the viewport so they
                                stay reachable no matter how far the form scrolls; on large screens,
                                where the sidebar preview is visible, they sit inline after the fields. */}
                            <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:static lg:z-auto lg:mt-6 lg:flex-row-reverse lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    {processing ? 'Saving…' : 'Save Product'}
                                </Button>
                                <Button type="button" variant="outline" asChild className="sm:flex-1">
                                    <Link href={products.index().url}>Cancel</Link>
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
}: {
    name: string;
    barcode: string;
    categoryName?: string;
    baseUnitLabel?: string;
    costPrice: string | number;
    markupPercentage: string | number;
}) {
    const cost = parseFloat(String(costPrice));
    const markup = parseFloat(String(markupPercentage));
    const estimatedPrice = !isNaN(cost) && !isNaN(markup) && cost > 0 ? cost * (1 + markup / 100) : null;

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
                <div className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                            <Package className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <p className={cn('truncate font-medium', !name && 'text-muted-foreground italic')}>{name || 'Your product name'}</p>
                            {categoryName && (
                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Tag className="size-3 shrink-0" />
                                    {categoryName}
                                </p>
                            )}
                            {barcode && <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{barcode}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-muted/30 p-3">
                    <div>
                        <p className="text-xs text-muted-foreground">Estimated member price</p>
                        <p className={cn('text-lg font-semibold tabular-nums', estimatedPrice === null && 'text-muted-foreground italic')}>
                            {estimatedPrice !== null ? `₱${estimatedPrice.toFixed(2)}` : 'Enter a cost price'}
                        </p>
                    </div>
                    {baseUnitLabel && <Badge className="border-0 bg-[var(--pos-teal)]/10 font-normal text-[var(--pos-teal)]">/ {baseUnitLabel}</Badge>}
                </div>

                <p className="text-xs text-muted-foreground">This is how the product will appear in your catalog.</p>
            </CardContent>
        </Card>
    );
}

function TipsCard() {
    const tips = [
        'Leave barcode blank to have one generated automatically from the SKU.',
        'Markup % is applied to the cost price to calculate the member selling price.',
        'Set a low stock threshold to get flagged before an item runs out.',
    ];

    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-3">
                <CardDescription className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Tips</CardDescription>
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

CreateProduct.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Add Product', href: products.create().url },
    ],
};
