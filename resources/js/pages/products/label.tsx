import { Head } from '@inertiajs/react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';

export default function ProductLabel({ product }: { product: Product }) {
    function handlePrint() {
        window.print();
    }

    return (
        <>
            <Head title={`Label - ${product.name}`} />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4 print:hidden">
                    <h1 className="text-xl font-semibold">Print Barcode Label</h1>
                    <Button onClick={handlePrint}>Print</Button>
                </div>

                <div className="max-w-xs">
                    <BarcodeLabel
                        barcode={product.barcode ?? product.sku}
                        productName={product.name}
                        price={product.member_piece_price?.toFixed(2)}
                    />
                </div>
            </div>
        </>
    );
}

ProductLabel.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Print Label', href: '#' },
    ],
};