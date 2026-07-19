import { Head, Link } from '@inertiajs/react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';
import { ArrowLeft, Printer } from 'lucide-react';

export default function ProductLabel({ product }: { product: Product }) {
    function handlePrint() {
        window.print();
    }

    return (
        <div className="mx-auto max-w-2xl p-3 sm:p-6" style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title={`Label - ${product.name}`} />

            <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
                <div>
                    <Button variant="ghost" size="sm" asChild className="-ml-2 gap-1.5 text-muted-foreground">
                        <Link href={products.index().url}>
                            <ArrowLeft className="size-4" />
                            Products
                        </Link>
                    </Button>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight">Print Barcode Label</h1>
                    <p className="text-sm text-muted-foreground">{product.name}</p>
                </div>
                <Button onClick={handlePrint} className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                    <Printer className="size-4" />
                    Print
                </Button>
            </div>

            <div className="rounded-xl border bg-muted/30 p-6 print:rounded-none print:border-0 print:bg-transparent print:p-0">
                <div className="mx-auto max-w-xs print:mx-0 print:max-w-none">
                    <BarcodeLabel
                        barcode={product.barcode ?? product.sku}
                        productName={product.name}
                        price={product.member_piece_price?.toFixed(2)}
                    />
                </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground print:hidden">
                Sized for standard label printers. Use your browser's print dialog if you need to adjust paper size or margins.
            </p>
        </div>
    );
}

ProductLabel.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Print Label', href: '#' },
    ],
};
