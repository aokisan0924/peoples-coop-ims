import { Head } from '@inertiajs/react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import { type Product } from '@/types/inventory';
import products from '@/routes/products';

export default function LabelsBatch({ products: productList }: { products: Product[] }) {
    function handlePrint() {
        window.print();
    }

    return (
        <>
            <Head title="Print Labels" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4 print:hidden">
                    <h1 className="text-xl font-semibold">Print Labels ({productList.length})</h1>
                    <Button onClick={handlePrint}>Print All</Button>
                </div>

                <div className="grid grid-cols-3 gap-2 print:grid-cols-3">
                    {productList.map((product) => (
                        <BarcodeLabel
                            key={product.id}
                            barcode={product.barcode ?? product.sku}
                            productName={product.name}
                            price={product.member_piece_price?.toFixed(2)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

LabelsBatch.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Print Labels', href: '#' },
    ],
};