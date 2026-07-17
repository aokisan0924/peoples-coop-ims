import { Head, Link } from '@inertiajs/react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';

export default function BarcodeDisplay({ product }: { product: Product }) {
    return (
        <>
            <Head title={`Barcode - ${product.name}`} />

            <div className="p-4 flex flex-col items-center">
                <div className="w-full max-w-md flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Scan This Barcode</h1>
                    <Button variant="outline" asChild>
                        <a href={`/products/${product.id}/label`} target="_blank" rel="noopener noreferrer">
                            Print Instead
                        </a>
                    </Button>
                </div>

                <BarcodeLabel
                    barcode={product.barcode ?? product.sku}
                    productName={product.name}
                    price={product.member_piece_price?.toFixed(2)}
                    size="display"
                />

                <p className="text-sm text-muted-foreground mt-4 text-center max-w-sm">
                    Point your barcode scanner at this screen. Increase screen brightness if the scan doesn't register on the first try.
                </p>

                <Button variant="link" asChild className="mt-4">
                    <Link href={products.index().url}>← Back to Products</Link>
                </Button>
            </div>
        </>
    );
}

BarcodeDisplay.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Scan Barcode', href: '#' },
    ],
};