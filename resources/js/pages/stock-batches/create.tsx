import { Head, useForm, Link } from '@inertiajs/react';
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

export default function CreateStockBatch({ products, suppliers }: { products: Product[]; suppliers: Supplier[] }) {
    const { data, setData, post, processing, errors } = useForm({
        product_id: null as number | null,
        supplier_id: null as number | null,
        received_qty: 1,
        cost_price: '',
        received_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(stockBatches.store().url);
    }

    return (
        <>
            <Head title="Receive Stock" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Receive Stock</h1>

                <form onSubmit={handleSubmit}>
                    <StockBatchFormFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        products={products}
                        suppliers={suppliers}
                    />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Receive Stock
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={stockBatches.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateStockBatch.layout = {
    breadcrumbs: [
        { title: 'Stock Batches', href: stockBatches.index().url },
        { title: 'Receive Stock', href: stockBatches.create().url },
    ],
};