import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, Tags } from 'lucide-react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import products from '@/routes/products';
import type { Product } from '@/types/inventory';

export default function LabelsBatch({
    products: productList,
}: {
    products: Product[];
}) {
    function handlePrint() {
        window.print();
    }

    const isEmpty = productList.length === 0;

    return (
        <div
            className="mx-auto max-w-[1600px] p-3 sm:p-6"
            style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
        >
            <Head title="Print Labels" />

            <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="-ml-2 gap-1.5 text-muted-foreground"
                    >
                        <Link href={products.index().url}>
                            <ArrowLeft className="size-4" />
                            Products
                        </Link>
                    </Button>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight">
                        Print Labels ({productList.length})
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Labels are laid out 3 across when printed, matching
                        standard label sheets.
                    </p>
                </div>
                {!isEmpty && (
                    <Button
                        onClick={handlePrint}
                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    >
                        <Printer className="size-4" />
                        Print All
                    </Button>
                )}
            </div>

            {isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center print:hidden">
                    <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Tags className="size-7" />
                    </div>
                    <p className="text-sm font-medium">No products selected</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                        Pick products from your catalog to print labels for
                        them.
                    </p>
                    <Button
                        asChild
                        size="sm"
                        className="mt-2 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    >
                        <Link href={products.index().url}>
                            Back to Products
                        </Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 rounded-xl border bg-muted/30 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 print:grid-cols-3 print:gap-2 print:rounded-none print:border-0 print:bg-transparent print:p-0">
                    {productList.map((product) => (
                        <BarcodeLabel
                            key={product.id}
                            barcode={product.barcode ?? product.sku}
                            productName={product.name}
                            price={product.member_piece_price?.toFixed(2)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

LabelsBatch.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Print Labels', href: '#' },
    ],
};
