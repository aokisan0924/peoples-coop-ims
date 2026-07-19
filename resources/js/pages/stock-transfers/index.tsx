import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import TransferStatusBadge from '@/components/stock-transfer/transfer-status-badge';
import { useAuth } from '@/hooks/use-auth';

interface Transfer {
    id: number;
    quantity: number;
    cost_price: string;
    status: 'in_transit' | 'received' | 'cancelled';
    initiated_at: string;
    received_at: string | null;
    notes: string | null;
    product: { name: string; sku: string };
    from_location: { id: number; name: string };
    to_location: { id: number; name: string };
    initiated_by: { name: string };
    received_by: { name: string } | null;
}

export default function StockTransfersIndex({ transfers }: { transfers: Transfer[] }) {
    const { user, isOwner } = useAuth();

    function handleConfirm(transfer: Transfer) {
        if (confirm(`Confirm receipt of ${transfer.quantity} unit(s) of "${transfer.product.name}"?`)) {
            router.post(`/stock-transfers/${transfer.id}/confirm`);
        }
    }

    function handleCancel(transfer: Transfer) {
        if (confirm(`Cancel this transfer? Stock will be restored to ${transfer.from_location.name}.`)) {
            router.post(`/stock-transfers/${transfer.id}/cancel`);
        }
    }

    return (
        <>
            <Head title="Stock Transfers" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Stock Transfers</h1>
                    <Button asChild>
                        <Link href="/stock-transfers/create">+ New Transfer</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Product</th>
                                <th className="text-left p-3">From → To</th>
                                <th className="text-left p-3">Qty</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-left p-3">Initiated</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transfers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                        No transfers yet.
                                    </td>
                                </tr>
                            )}
                            {transfers.map((t) => {
                                const canConfirm = t.status === 'in_transit' && (isOwner || user?.id && t.to_location.id === (user as any).location_id);
                                const canCancel = t.status === 'in_transit' && (isOwner || user?.id && t.from_location.id === (user as any).location_id);

                                return (
                                    <tr key={t.id} className="border-t">
                                        <td className="p-3 font-medium">{t.product.name}</td>
                                        <td className="p-3">{t.from_location.name} → {t.to_location.name}</td>
                                        <td className="p-3">{t.quantity}</td>
                                        <td className="p-3"><TransferStatusBadge status={t.status} /></td>
                                        <td className="p-3 text-xs">{new Date(t.initiated_at).toLocaleString()}</td>
                                        <td className="p-3 text-right space-x-2">
                                            {canConfirm && (
                                                <Button size="sm" onClick={() => handleConfirm(t)}>
                                                    Confirm Receipt
                                                </Button>
                                            )}
                                            {canCancel && (
                                                <Button size="sm" variant="destructive" onClick={() => handleCancel(t)}>
                                                    Cancel
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

StockTransfersIndex.layout = {
    breadcrumbs: [{ title: 'Stock Transfers', href: '/stock-transfers' }],
};
