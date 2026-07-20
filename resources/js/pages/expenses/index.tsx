import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Expense {
    id: number;
    category: string;
    description: string | null;
    amount: string;
    expense_date: string;
    due_date: string | null;
    is_paid: boolean;
    location: { name: string };
    recorded_by: { name: string };
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ExpensesIndex({ expenses }: { expenses: Expense[] }) {
    function handleMarkPaid(expense: Expense) {
        router.post(`/expenses/${expense.id}/mark-paid`);
    }

    function handleDelete(expense: Expense) {
        if (confirm(`Remove this expense record ("${expense.category}" — ${peso(expense.amount)})?`)) {
            router.delete(`/expenses/${expense.id}`);
        }
    }

    const totalUnpaid = expenses.filter((e) => !e.is_paid).reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return (
        <>
            <Head title="Expenses" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Expenses</h1>
                    <Button asChild>
                        <Link href="/expenses/create">+ Add Expense</Link>
                    </Button>
                </div>

                {totalUnpaid > 0 && (
                    <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 mb-4 text-sm">
                        <span className="font-medium">{peso(totalUnpaid)}</span> in unpaid expenses
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Category</th>
                                <th className="text-left p-3">Description</th>
                                <th className="text-left p-3">Branch</th>
                                <th className="text-left p-3">Amount</th>
                                <th className="text-left p-3">Date</th>
                                <th className="text-left p-3">Due</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-4 text-center text-muted-foreground">
                                        No expenses recorded yet.
                                    </td>
                                </tr>
                            )}
                            {expenses.map((e) => (
                                <tr key={e.id} className="border-t">
                                    <td className="p-3 font-medium">{e.category}</td>
                                    <td className="p-3">{e.description ?? '—'}</td>
                                    <td className="p-3">{e.location.name}</td>
                                    <td className="p-3">{peso(e.amount)}</td>
                                    <td className="p-3 text-xs">{e.expense_date}</td>
                                    <td className="p-3 text-xs">{e.due_date ?? '—'}</td>
                                    <td className="p-3">
                                        {e.is_paid ? (
                                            <Badge className="bg-green-600">Paid</Badge>
                                        ) : (
                                            <Badge variant="destructive">Unpaid</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        {!e.is_paid && (
                                            <Button size="sm" onClick={() => handleMarkPaid(e)}>
                                                Mark Paid
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(e)}>
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

ExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Expenses', href: '/expenses' }],
};
