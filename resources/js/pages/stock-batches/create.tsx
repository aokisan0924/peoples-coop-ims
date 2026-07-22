import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Boxes, Info, PackagePlus } from 'lucide-react';
import StockBatchFormFields from '@/components/stock-batches/stock-batch-form-fields';
import { Button } from '@/components/ui/button';
import stockBatches from '@/routes/stock-batches';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    cost_price: string;
}

interface Supplier {
    id: number;
    name: string;
}

export default function CreateStockBatch({
    products,
    suppliers,
    locations,
    userLocationName,
}: {
    products: Product[];
    suppliers: Supplier[];
    locations: { id: number; name: string }[] | null;
    userLocationName: string | null;
}) {
    const { data, setData, post, processing, errors } = useForm({
        product_id: null as number | null,
        supplier_id: null as number | null,
        location_id: null as number | null,
        received_qty: 1,
        cost_price: '',
        received_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        paid_on_delivery: true,
        payable_due_date: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(stockBatches.store().url);
    }

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Receive Stock" />

            <div className="mx-auto max-w-5xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="size-9 shrink-0"
                    >
                        <Link href={stockBatches.index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <PackagePlus className="size-4" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Receive Stock
                            </h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Log a new stock batch to track it on a FIFO basis.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                        {/* Form card */}
                        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
                            <StockBatchFormFields
                                data={data}
                                setData={setData}
                                errors={errors}
                                products={products}
                                suppliers={suppliers}
                                locations={locations}
                                userLocationName={userLocationName}
                            />

                            {/* Desktop actions, inline with the form card */}
                            <div className="mt-6 hidden gap-2 border-t pt-4 sm:flex">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <PackagePlus className="size-4" />
                                    {processing
                                        ? 'Receiving…'
                                        : 'Receive Stock'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    disabled={processing}
                                >
                                    <Link href={stockBatches.index().url}>
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </div>

                        {/* Helper sidebar */}
                        <div className="space-y-3">
                            <div className="rounded-xl border bg-[var(--pos-teal)]/5 p-4">
                                <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                    <Info className="size-4 shrink-0" />
                                    <p className="text-sm font-medium">
                                        How FIFO batches work
                                    </p>
                                </div>
                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                    <li>
                                        • Sales draw from the oldest unexpired
                                        batch first.
                                    </li>
                                    <li>
                                        • Cost per unit here is used to
                                        calculate margins on this batch.
                                    </li>
                                    <li>
                                        • Leave expiry blank for non-perishable
                                        items.
                                    </li>
                                    <li>
                                        • A batch can only be deleted before any
                                        stock is sold from it.
                                    </li>
                                    <li>
                                        • Uncheck "Paid on Delivery" for a
                                        supplier batch to track it as unpaid in
                                        Accounts Payable.
                                    </li>
                                </ul>
                            </div>

                            {products.length === 0 && (
                                <div className="flex items-start gap-2 rounded-xl border border-dashed p-4 text-xs text-muted-foreground">
                                    <Boxes className="mt-0.5 size-4 shrink-0" />
                                    <p>
                                        No products found yet. Add a product
                                        first so it appears in the list above.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile sticky action bar */}
                    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 sm:hidden">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                        >
                            <PackagePlus className="size-4" />
                            {processing ? 'Receiving…' : 'Receive Stock'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                            disabled={processing}
                            className="flex-1"
                        >
                            <Link href={stockBatches.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CreateStockBatch.layout = {
    breadcrumbs: [
        { title: 'Stock Batches', href: stockBatches.index().url },
        { title: 'Receive Stock', href: stockBatches.create().url },
    ],
};
