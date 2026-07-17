import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth'

interface Sale {
    id: number;
    receipt_number: string;
    is_member: boolean;
    total: string;
    payment_method: 'cash' | 'gcash';
    voided_at: string | null;
    void_reason: string | null;
    created_at: string;
    cashier: { name: string };
}

interface PaginatedSales {
    data: Sale[];
    links: { url: string | null; label: string; active: boolean }[];
}

export default function SalesIndex({ sales }: { sales: PaginatedSales }) {
    const { isManager } = useAuth();

    const [voidingId, setVoidingId] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    function handleVoidSubmit(saleId: number) {
        if (!reason.trim()) return;
        router.post(`/sales/${saleId}/void`, { void_reason: reason }, {
            onSuccess: () => {
                setVoidingId(null);
                setReason('');
            },
        });
    }

    return (
        <>
            <Head title="Sales History" />

            <div className="p-4">
                <h1 className="text-xl font-semibold mb-4">Sales History</h1>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Receipt #</th>
                                <th className="text-left p-3">Date</th>
                                <th className="text-left p-3">Cashier</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Payment</th>
                                <th className="text-left p-3">Total</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.data.map((sale) => (
                                <tr key={sale.id} className="border-t">
                                    <td className="p-3 font-mono text-xs">{sale.receipt_number}</td>
                                    <td className="p-3">{new Date(sale.created_at).toLocaleString()}</td>
                                    <td className="p-3">{sale.cashier.name}</td>
                                    <td className="p-3">{sale.is_member ? 'Member' : 'Non-Member'}</td>
                                    <td className="p-3 capitalize">{sale.payment_method}</td>
                                    <td className="p-3">₱{parseFloat(sale.total).toFixed(2)}</td>
                                    <td className="p-3">
                                        {sale.voided_at ? (
                                            <Badge variant="destructive">Voided</Badge>
                                        ) : (
                                            <Badge variant="secondary">Completed</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/sales/${sale.id}/receipt`}>View</Link>
                                        </Button>
                                        {isManager && !sale.voided_at && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setVoidingId(sale.id)}
                                            >
                                                Void
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {voidingId && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-background border rounded-lg p-4 w-full max-w-sm">
                            <h2 className="font-medium mb-2">Void Sale — Reason Required</h2>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Customer complaint, wrong item scanned"
                                autoFocus
                            />
                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="destructive"
                                    onClick={() => handleVoidSubmit(voidingId)}
                                    disabled={!reason.trim()}
                                >
                                    Confirm Void
                                </Button>
                                <Button variant="outline" onClick={() => { setVoidingId(null); setReason(''); }}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

SalesIndex.layout = {
    breadcrumbs: [{ title: 'Sales History', href: '/sales' }],
};
