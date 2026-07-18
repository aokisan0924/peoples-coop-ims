import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GcashTransactionForm from '@/components/gcash/gcash-transaction-form';
import FloatAdjustmentForm from '@/components/gcash/float-adjustment-form';
import { useAuth } from '@/hooks/use-auth';
import { ArrowDownCircle, ArrowUpCircle, Settings2 } from 'lucide-react';

interface Transaction {
    id: number;
    type: 'cash_in' | 'cash_out' | 'float_adjustment';
    amount: string;
    fee: string;
    customer_name: string | null;
    reference_number: string | null;
    float_balance_after: string;
    notes: string | null;
    created_at: string;
    cashier: { name: string };
}

interface Props {
    floatBalance: number;
    todayStats: {
        total_cash_in: number;
        total_cash_out: number;
        total_fees: number;
        transaction_count: number;
    };
    recentTransactions: Transaction[];
}

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function GcashIndex({ floatBalance, todayStats, recentTransactions }: Props) {
    const { isManager } = useAuth();
    const [modal, setModal] = useState<'cash_in' | 'cash_out' | 'adjust' | null>(null);

    function closeModal() {
        setModal(null);
        router.reload({ only: ['floatBalance', 'todayStats', 'recentTransactions'] });
    }

    return (
        <>
            <Head title="GCash Monitor" />

            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">GCash Monitor</h1>
                    {isManager && (
                        <Button variant="outline" size="sm" onClick={() => setModal('adjust')}>
                            <Settings2 className="size-4" />
                            Reconcile Float
                        </Button>
                    )}
                </div>

                {/* Float balance — the headline number */}
                <div className="border rounded-lg p-6 text-center bg-muted/30">
                    <p className="text-sm text-muted-foreground">Current GCash Float</p>
                    <p className="text-4xl font-bold mt-1">{peso(floatBalance)}</p>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-4">
                    <Button size="lg" onClick={() => setModal('cash_in')} className="h-20">
                        <ArrowUpCircle className="size-5" />
                        Cash-In
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => setModal('cash_out')} className="h-20">
                        <ArrowDownCircle className="size-5" />
                        Cash-Out
                    </Button>
                </div>

                {/* Today's summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Cash-In Today</p>
                        <p className="text-xl font-bold mt-1">{peso(todayStats.total_cash_in)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Cash-Out Today</p>
                        <p className="text-xl font-bold mt-1">{peso(todayStats.total_cash_out)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Fees Earned</p>
                        <p className="text-xl font-bold mt-1 text-green-600">{peso(todayStats.total_fees)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Transactions</p>
                        <p className="text-xl font-bold mt-1">{todayStats.transaction_count}</p>
                    </div>
                </div>

                {/* Transaction history */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Time</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Customer</th>
                                <th className="text-left p-3">Amount</th>
                                <th className="text-left p-3">Fee</th>
                                <th className="text-left p-3">Float After</th>
                                <th className="text-left p-3">Cashier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                                        No GCash transactions yet.
                                    </td>
                                </tr>
                            )}
                            {recentTransactions.map((tx) => (
                                <tr key={tx.id} className="border-t">
                                    <td className="p-3 text-xs">{new Date(tx.created_at).toLocaleString()}</td>
                                    <td className="p-3">
                                        {tx.type === 'cash_in' && <Badge className="bg-green-600">Cash-In</Badge>}
                                        {tx.type === 'cash_out' && <Badge variant="outline">Cash-Out</Badge>}
                                        {tx.type === 'float_adjustment' && <Badge variant="secondary">Adjustment</Badge>}
                                    </td>
                                    <td className="p-3">{tx.customer_name ?? '—'}</td>
                                    <td className="p-3">{peso(tx.amount)}</td>
                                    <td className="p-3">{parseFloat(tx.fee) > 0 ? peso(tx.fee) : '—'}</td>
                                    <td className="p-3">{peso(tx.float_balance_after)}</td>
                                    <td className="p-3">{tx.cashier.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modals */}
                {(modal === 'cash_in' || modal === 'cash_out') && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background border rounded-lg p-4 w-full max-w-sm">
                            <h2 className="font-medium mb-4">
                                {modal === 'cash_in' ? 'New Cash-In' : 'New Cash-Out'}
                            </h2>
                            <GcashTransactionForm type={modal} onSuccess={closeModal} />
                            <Button variant="outline" className="w-full mt-2" onClick={() => setModal(null)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {modal === 'adjust' && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-background border rounded-lg p-4 w-full max-w-sm">
                            <h2 className="font-medium mb-4">Reconcile GCash Float</h2>
                            <FloatAdjustmentForm currentBalance={floatBalance} onSuccess={closeModal} />
                            <Button variant="outline" className="w-full mt-2" onClick={() => setModal(null)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

GcashIndex.layout = {
    breadcrumbs: [{ title: 'GCash Monitor', href: '/gcash' }],
};
