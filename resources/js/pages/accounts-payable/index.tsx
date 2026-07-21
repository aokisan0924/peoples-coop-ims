import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';

interface Payable {
    id: number;
    amount: string;
    incurred_date: string;
    due_date: string | null;
    is_paid: boolean;
    payment_method: 'cash' | 'gcash' | null;
    supplier: { name: string } | null;
    location: { name: string };
    stock_batch: { product: { name: string } } | null;
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AccountsPayableIndex({ payables, totalUnpaid }: { payables: Payable[]; totalUnpaid: number }) {
    const [choosingPaymentFor, setChoosingPaymentFor] = useState<number | null>(null);

    function markPaid(payable: Payable, method: 'cash' | 'gcash') {
        router.post(`/accounts-payable/${payable.id}/mark-paid`, { payment_method: method });
        setChoosingPaymentFor(null);
    }

    return (
        <>
            <Head title="Accounts Payable" />

            <div className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            <Truck className="size-5 text-[#00a79b]" />
                            Accounts Payable
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            What's owed to suppliers — created automatically when stock is received on credit.
                        </p>
                    </div>
                </div>

                {totalUnpaid > 0 && (
                    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:bg-amber-950/20">
                        <span className="font-medium">{peso(totalUnpaid)}</span> owed to suppliers, unpaid
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left">Supplier</th>
                                <th className="p-3 text-left">For</th>
                                <th className="p-3 text-left">Branch</th>
                                <th className="p-3 text-left">Amount</th>
                                <th className="p-3 text-left">Incurred</th>
                                <th className="p-3 text-left">Due</th>
                                <th className="p-3 text-left">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payables.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                        Nothing owed to suppliers right now.
                                    </td>
                                </tr>
                            )}
                            {payables.map((p) => (
                                <tr key={p.id} className="border-t">
                                    <td className="p-3 font-medium">{p.supplier?.name ?? '—'}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {p.stock_batch?.product?.name ?? '—'}
                                    </td>
                                    <td className="p-3">{p.location.name}</td>
                                    <td className="p-3">{peso(p.amount)}</td>
                                    <td className="p-3 text-xs">{p.incurred_date}</td>
                                    <td className="p-3 text-xs">{p.due_date ?? '—'}</td>
                                    <td className="p-3">
                                        {p.is_paid ? (
                                            <Badge className="bg-green-600">
                                                Paid{p.payment_method ? ` · ${p.payment_method === 'gcash' ? 'GCash' : 'Cash'}` : ''}
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">Unpaid</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        {!p.is_paid && choosingPaymentFor !== p.id && (
                                            <Button size="sm" onClick={() => setChoosingPaymentFor(p.id)}>
                                                Mark Paid
                                            </Button>
                                        )}
                                        {!p.is_paid && choosingPaymentFor === p.id && (
                                            <span className="inline-flex items-center gap-1">
                                                <Button size="sm" variant="outline" onClick={() => markPaid(p, 'cash')}>
                                                    Cash
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => markPaid(p, 'gcash')}>
                                                    GCash
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setChoosingPaymentFor(null)}>
                                                    Cancel
                                                </Button>
                                            </span>
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
