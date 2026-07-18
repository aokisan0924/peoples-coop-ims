import { Head, router, Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Sale {
    id: number;
    receipt_number: string;
    is_member: boolean;
    total: string;
    payment_method: 'cash' | 'gcash';
    voided_at: string | null;
    created_at: string;
}

interface Summary {
    total_sales: number;
    cash_total: number;
    gcash_total: number;
    transaction_count: number;
    voided_count: number;
}

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MySales({ sales, summary, selectedDate }: { sales: Sale[]; summary: Summary; selectedDate: string }) {
    function handleDateChange(date: string) {
        router.get('/my-sales', { date }, { preserveState: true });
    }

    return (
        <>
            <Head title="My Sales" />

            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">My Sales</h1>
                    <div>
                        <Label htmlFor="date" className="sr-only">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Shift summary — useful for cash drawer reconciliation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Total Sales</p>
                        <p className="text-2xl font-bold mt-1">{peso(summary.total_sales)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{summary.transaction_count} transactions</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Cash</p>
                        <p className="text-2xl font-bold mt-1">{peso(summary.cash_total)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">GCash</p>
                        <p className="text-2xl font-bold mt-1">{peso(summary.gcash_total)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Voided</p>
                        <p className="text-2xl font-bold mt-1 text-red-600">{summary.voided_count}</p>
                    </div>
                </div>

                {/* Transaction list */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Time</th>
                                <th className="text-left p-3">Receipt #</th>
                                <th className="text-left p-3">Type</th>
                                <th className="text-left p-3">Payment</th>
                                <th className="text-left p-3">Total</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                                        No sales recorded for this date.
                                    </td>
                                </tr>
                            )}
                            {sales.map((sale) => (
                                <tr key={sale.id} className="border-t">
                                    <td className="p-3 text-xs">
                                        {new Date(sale.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-3 font-mono text-xs">{sale.receipt_number}</td>
                                    <td className="p-3">{sale.is_member ? 'Member' : 'Non-Member'}</td>
                                    <td className="p-3 capitalize">{sale.payment_method}</td>
                                    <td className="p-3">{peso(sale.total)}</td>
                                    <td className="p-3">
                                        {sale.voided_at ? (
                                            <Badge variant="destructive">Voided</Badge>
                                        ) : (
                                            <Badge variant="secondary">Completed</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right">
                                        <Link href={`/sales/${sale.id}/receipt`} className="text-sm text-blue-600 hover:underline">
                                            View Receipt
                                        </Link>
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

MySales.layout = {
    breadcrumbs: [{ title: 'My Sales', href: '/my-sales' }],
};
