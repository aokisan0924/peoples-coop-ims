import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Banknote, CalendarClock, Plus, Receipt, Repeat, Smartphone, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Expense {
    id: number;
    category: string;
    description: string | null;
    amount: string;
    expense_date: string;
    due_date: string | null;
    is_paid: boolean;
    payment_method: 'cash' | 'gcash';
    supplier_id: number | null;
    location: { name: string };
    recorded_by: { name: string };
}

interface RecurringTemplate {
    id: number;
    category: string;
    description: string | null;
    estimated_amount: string;
    day_of_month: number;
    location: { name: string };
}

interface Props {
    expenses: Expense[];
    /** Active recurring templates with no Expense generated yet this month —
     *  same list RecurringExpenseController::pendingForUser() returns. */
    pendingThisMonth?: RecurringTemplate[];
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
}

/** RecurringExpenseController only sends day_of_month — the due date and
 *  days-remaining are derived here rather than assuming a backend field. */
function daysUntilDue(dayOfMonth: number): number {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    let due = new Date(today.getFullYear(), today.getMonth(), Math.min(dayOfMonth, daysInMonth));

    if (due < new Date(today.toDateString())) {
        const nextMonthDays = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
        due = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(dayOfMonth, nextMonthDays));
    }

    return Math.round((due.getTime() - new Date(today.toDateString()).getTime()) / 86_400_000);
}

function PaymentBadge({ method }: { method: 'cash' | 'gcash' }) {
    return (
        <Badge
            className={cn(
                'gap-1 border-0 font-normal',
                method === 'gcash' ? 'bg-[var(--pos-teal)]/15 text-[var(--pos-teal)]' : 'bg-muted text-muted-foreground',
            )}
        >
            {method === 'gcash' ? <Smartphone className="size-3" /> : <Banknote className="size-3" />}
            {method === 'gcash' ? 'GCash' : 'Cash'}
        </Badge>
    );
}

export default function ExpensesIndex({ expenses, pendingThisMonth = [] }: Props) {
    function handleMarkPaid(expense: Expense) {
        router.post(`/expenses/${expense.id}/mark-paid`);
    }

    function handleDelete(expense: Expense) {
        if (confirm(`Remove this expense record ("${expense.category}" — ${peso(expense.amount)})?`)) {
            router.delete(`/expenses/${expense.id}`);
        }
    }

    const unpaid = expenses.filter((e) => !e.is_paid);
    const totalUnpaid = unpaid.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const overdueCount = unpaid.filter((e) => isOverdue(e.due_date)).length;
    const isEmpty = expenses.length === 0;

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Expenses" />

            <div className="mx-auto max-w-[1600px] space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold tracking-tight">Expenses</h1>
                        {!isEmpty && (
                            <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                {expenses.length}
                            </Badge>
                        )}
                    </div>
                    <Button asChild className="hidden gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:inline-flex">
                        <Link href="/expenses/create">
                            <Plus className="size-4" />
                            Add Expense
                        </Link>
                    </Button>
                </div>

                {/* Cash-owed summary — the reminder a manager actually needs at a glance */}
                {totalUnpaid > 0 && (
                    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900/50 dark:bg-amber-950/20">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <p className="text-sm">
                                <span className="font-semibold">{peso(totalUnpaid)}</span> in unpaid expenses
                                {overdueCount > 0 && (
                                    <span className="ml-1.5 text-amber-700 dark:text-amber-400">
                                        ({overdueCount} overdue)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                )}

                {/* Recurring bills — this is the "monthly reminder" surface: rent, electricity,
                    water, internet all show their next due date so nothing gets missed. */}
                {pendingThisMonth.length > 0 && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <Repeat className="size-4 text-[var(--pos-teal)]" />
                            Recurring Bills — Not Yet Generated This Month
                        </h2>
                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            {pendingThisMonth.map((t) => {
                                const daysLeft = daysUntilDue(t.day_of_month);
                                return (
                                    <div
                                        key={t.id}
                                        className={cn(
                                            'flex items-center justify-between gap-2 rounded-lg border p-3',
                                            daysLeft <= 3 && 'border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20',
                                        )}
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{t.category}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Due day {t.day_of_month} · {peso(t.estimated_amount)}
                                            </p>
                                        </div>
                                        <Badge variant={daysLeft <= 3 ? 'destructive' : 'secondary'} className="shrink-0 gap-1">
                                            <CalendarClock className="size-3" />
                                            {daysLeft <= 0 ? 'Due today' : `${daysLeft}d`}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <Receipt className="size-7" />
                        </div>
                        <p className="text-sm font-medium">No expenses recorded yet</p>
                        <p className="max-w-xs text-sm text-muted-foreground">Add your first expense to start tracking spend against sales.</p>
                        <Button asChild size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                            <Link href="/expenses/create">
                                <Plus className="size-4" />
                                Add Expense
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Table on larger screens; stacked cards on mobile so an 8-column
                            table doesn't force horizontal scrolling on a phone. */}
                        <div className="hidden overflow-hidden rounded-xl border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Category</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Description</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Branch</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Amount</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Due</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Payment</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((e) => (
                                        <tr key={e.id} className="border-t transition-colors hover:bg-muted/30">
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    {e.category}
                                                    {e.supplier_id && (
                                                        <Badge variant="outline" className="font-normal text-muted-foreground">
                                                            Stock purchase
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">{e.description ?? '—'}</td>
                                            <td className="p-3 text-muted-foreground">{e.location.name}</td>
                                            <td className="p-3 font-mono tabular-nums">{peso(e.amount)}</td>
                                            <td className="p-3 text-xs text-muted-foreground">{e.expense_date}</td>
                                            <td className={cn('p-3 text-xs', isOverdue(e.due_date) && !e.is_paid && 'font-medium text-red-600 dark:text-red-400')}>
                                                {e.due_date ?? '—'}
                                            </td>
                                            <td className="p-3">
                                                <PaymentBadge method={e.payment_method} />
                                            </td>
                                            <td className="p-3">
                                                {e.is_paid ? (
                                                    <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">Paid</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Unpaid</Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5">
                                                    {!e.is_paid && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleMarkPaid(e)}
                                                            className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                                        >
                                                            Mark Paid
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDelete(e)}
                                                        className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                            {expenses.map((e) => (
                                <div key={e.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-medium">{e.category}</p>
                                                {e.is_paid ? (
                                                    <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">Paid</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Unpaid</Badge>
                                                )}
                                            </div>
                                            {e.description && <p className="truncate text-xs text-muted-foreground">{e.description}</p>}
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {e.location.name} · {e.expense_date}
                                                {e.due_date && (
                                                    <span className={cn(isOverdue(e.due_date) && !e.is_paid && 'font-medium text-red-600 dark:text-red-400')}>
                                                        {' '}· due {e.due_date}
                                                    </span>
                                                )}
                                            </p>
                                            <div className="mt-1.5">
                                                <PaymentBadge method={e.payment_method} />
                                            </div>
                                        </div>
                                        <p className="shrink-0 font-mono text-sm font-semibold tabular-nums">{peso(e.amount)}</p>
                                    </div>
                                    <div className="mt-3 flex gap-1.5 border-t pt-2.5">
                                        {!e.is_paid && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleMarkPaid(e)}
                                                className="flex-1 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                            >
                                                Mark Paid
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(e)}
                                            className={cn('gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40', e.is_paid && 'flex-1')}
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {!isEmpty && (
                <Button
                    asChild
                    size="icon"
                    className="fixed right-4 bottom-4 z-20 size-12 rounded-full bg-[var(--pos-teal)] text-white shadow-lg shadow-black/20 hover:bg-[var(--pos-teal)]/90 sm:hidden"
                >
                    <Link href="/expenses/create" aria-label="Add Expense">
                        <Plus className="size-5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Expenses', href: '/expenses' }],
};
