import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Payable {
    id: number;
    amount: string;
    incurred_date: string;
    due_date: string | null;
    is_paid: boolean;
    supplier: { name: string };
    location: { name: string };
    stock_batch: { product: { name: string } } | null;
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AccountsPayableIndex({ payables, totalUnpaid }: { payables: Payable[]; totalUnpaid: number }) {
    const [payingId, setPayingId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');

    function handleMarkPaid(id: number) {
        router.post(`/accounts-payable/${id}/mark-paid`, { payment_method: paymentMethod }, {
            onSuccess: () => setPayingId(null),
        });
    }

    return (
        <>
            <Head title="Accounts Payable" />

            <div className="p-4">
                <h1 className="text-xl font-semibold mb-4">Accounts Payable</h1>

                <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 mb-4">
                    <p className="text-sm text-muted-foreground">Total Owed to Suppliers</p>
                    <p className="text-2xl font-bold">{peso(totalUnpaid)}</p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Supplier</th>
                                <th className="text-left p-3">Product</th>
                                <th className="text-left p-3">Branch</th>
                                <th className="text-left p-3">Amount</th>
                                <th className="text-left p-3">Incurred</th>
                                <th className="text-left p-3">Due</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payables.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                        No supplier balances recorded.
                                    </td>
                                </tr>
                            )}
                            {payables.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-3 font-medium">{p.supplier.name}</td>
                                    <td className="p-3">{p.stock_batch?.product.name ?? '—'}</td>
                                    <td className="p-3">{p.location.name}</td>
                                    <td className="p-3">{peso(p.amount)}</td>
                                    <td className="p-3 text-xs">{p.incurred_date}</td>
                                    <td className="p-3 text-xs">{p.due_date ?? '—'}</td>
                                    <td className="p-3">
                                        {p.is_paid ? (
                                            <Badge className="bg-green-600">Paid</Badge>
                                        ) : (
                                            <Badge variant="destructive">Unpaid</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {!p.is_paid && (
                                            payingId === p.id ? (
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'gcash')}>
                                                        <SelectTrigger className="w-[100px] h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="gcash">GCash</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Button size="sm" onClick={() => handleMarkPaid(p.id)}>Confirm</Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" onClick={() => setPayingId(p.id)}>Mark Paid</Button>
                                            )
                                        )}
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

AccountsPayableIndex.layout = {
    breadcrumbs: [{ title: 'Accounts Payable', href: '/accounts-payable' }],
};
