import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type StockBatch } from '@/types/inventory';
import stockBatches from '@/routes/stock-batches';

interface PaginatedBatches {
    data: StockBatch[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function StockBatchesIndex({ batches }: { batches: PaginatedBatches }) {
    function handleDelete(batch: StockBatch) {
        if (confirm(`Delete this batch? Only possible if nothing has been sold from it yet.`)) {
            router.delete(stockBatches.destroy(batch.id).url);
        }
    }

    return (
        <>
            <Head title="Stock Batches" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Stock Batches (FIFO)</h1>
                    <Button asChild>
                        <Link href={stockBatches.create().url}>+ Receive Stock</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Product</th>
                                <th className="text-left p-3">Supplier</th>
                                <th className="text-left p-3">Received</th>
                                <th className="text-left p-3">Remaining</th>
                                <th className="text-left p-3">Cost/Unit</th>
                                <th className="text-left p-3">Date Received</th>
                                <th className="text-left p-3">Expiry</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                        No stock received yet.
                                    </td>
                                </tr>
                            )}
                            {batches.data.map((batch) => (
                                <tr key={batch.id} className="border-t">
                                    <td className="p-3 font-medium">{batch.product?.name}</td>
                                    <td className="p-3">{batch.supplier?.name ?? '—'}</td>
                                    <td className="p-3">{batch.received_qty}</td>
                                    <td className="p-3">{batch.remaining_qty}</td>
                                    <td className="p-3">₱{parseFloat(batch.cost_price).toFixed(2)}</td>
                                    <td className="p-3">{batch.received_date}</td>
                                    <td className="p-3">{batch.expiry_date ?? '—'}</td>
                                    <td className="p-3 text-right">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(batch)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

StockBatchesIndex.layout = {
    breadcrumbs: [
        { title: 'Stock Batches', href: stockBatches.index().url },
    ],
};