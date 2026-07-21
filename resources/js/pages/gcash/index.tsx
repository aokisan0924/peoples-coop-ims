import { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GcashTransactionForm from '@/components/gcash/gcash-transaction-form';
import FloatAdjustmentForm from '@/components/gcash/float-adjustment-form';
import OpenShiftGate from '@/components/pos/open-shift-gate';
import { useAuth } from '@/hooks/use-auth';
import { useCurrentShift } from '@/hooks/use-current-shift';
import { ArrowDownCircle, ArrowUpCircle, Receipt, Receipt as ExpenseIcon, Settings2, Wallet, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
    id: number;
    type: 'cash_in' | 'cash_out' | 'float_adjustment' | 'expense_payment';
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

function timeOnly(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

const TYPE_META = {
    cash_in: { label: 'Cash-In', badgeClass: 'border-0 bg-[var(--pos-teal)] text-white' },
    cash_out: { label: 'Cash-Out', badgeClass: 'border-[var(--pos-teal)]/40 text-[var(--pos-teal)]' },
    float_adjustment: { label: 'Adjustment', badgeClass: '' },
    expense_payment: { label: 'Expense Payment', badgeClass: 'border-0 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' },
} as const;

/** customer_name is always null for expense payments — show the expense
 *  context from notes instead of a blank "—" in that column. */
function secondaryLabel(tx: Transaction): string {
    if (tx.type === 'expense_payment') {
        return tx.notes ?? 'Expense payment';
    }
    return tx.customer_name ?? '—';
}

export default function GcashIndex({ floatBalance, todayStats, recentTransactions }: Props) {
    const { isManager } = useAuth();
    const { shift, refetch: refetchShift } = useCurrentShift();
    const [modal, setModal] = useState<'cash_in' | 'cash_out' | 'adjust' | null>(null);

    function closeModal() {
        setModal(null);
        router.reload({ only: ['floatBalance', 'todayStats', 'recentTransactions'] });
    }

    useEffect(() => {
        if (!modal) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setModal(null);
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [modal]);

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="GCash Monitor" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 sm:space-y-6 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl font-semibold tracking-tight">GCash Monitor</h1>
                    {isManager && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setModal('adjust')}
                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                        >
                            <Settings2 className="size-4" />
                            <span className="hidden sm:inline">Reconcile Float</span>
                            <span className="sm:hidden">Reconcile</span>
                        </Button>
                    )}
                </div>

                {/* Float balance + quick actions share a row on wide screens instead of
                    stacking full-width, so a desktop viewport isn't mostly empty space. */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-br from-[var(--pos-teal)]/10 via-[var(--pos-teal)]/5 to-transparent p-6 text-center sm:p-8">
                        <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-[var(--pos-teal)]/15 text-[var(--pos-teal)]">
                            <Wallet className="size-5" />
                        </div>
                        <p className="text-sm text-muted-foreground">Current GCash Float</p>
                        <p className="mt-1 font-mono text-4xl font-bold tabular-nums sm:text-5xl">{peso(floatBalance)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <Button
                            size="lg"
                            onClick={() => setModal('cash_in')}
                            className="h-full min-h-20 flex-col gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:min-h-24"
                        >
                            <ArrowUpCircle className="size-6" />
                            Cash-In
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setModal('cash_out')}
                            className="h-full min-h-20 flex-col gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)] sm:min-h-24"
                        >
                            <ArrowDownCircle className="size-6" />
                            Cash-Out
                        </Button>
                    </div>
                </div>

                {/* Today's summary */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                    <StatCard label="Cash-In Today" value={peso(todayStats.total_cash_in)} />
                    <StatCard label="Cash-Out Today" value={peso(todayStats.total_cash_out)} />
                    <StatCard label="Fees Earned" value={peso(todayStats.total_fees)} accent="green" />
                    <StatCard label="Transactions" value={String(todayStats.transaction_count)} />
                </div>

                {/* Transaction history — table on larger screens, stacked cards on mobile
                    where a 7-column table would force horizontal scrolling. */}
                <div>
                    <h2 className="mb-2 text-sm font-medium text-muted-foreground">Recent Transactions</h2>

                    {recentTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
                            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Receipt className="size-5" />
                            </div>
                            <p className="text-sm font-medium">No GCash transactions yet</p>
                            <p className="max-w-xs text-sm text-muted-foreground">
                                Cash-in and cash-out activity will show up here as it happens.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-hidden rounded-xl border sm:block">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/60">
                                        <tr>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Time</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Customer / Notes</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Amount</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Fee</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Float After</th>
                                            <th className="p-3 text-left font-medium text-muted-foreground">Cashier</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map((tx) => (
                                            <tr key={tx.id} className="border-t transition-colors hover:bg-muted/30">
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</td>
                                                <td className="p-3">
                                                    <Badge
                                                        className={cn('font-normal', TYPE_META[tx.type].badgeClass)}
                                                        variant={tx.type === 'float_adjustment' ? 'secondary' : tx.type === 'cash_out' ? 'outline' : undefined}
                                                    >
                                                        {tx.type === 'expense_payment' && <ExpenseIcon className="mr-1 size-3" />}
                                                        {TYPE_META[tx.type].label}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 max-w-[240px] truncate" title={secondaryLabel(tx)}>
                                                    {secondaryLabel(tx)}
                                                </td>
                                                <td className="p-3 font-mono tabular-nums">{peso(tx.amount)}</td>
                                                <td className="p-3 font-mono tabular-nums text-[var(--pos-green)]">
                                                    {parseFloat(tx.fee) > 0 ? peso(tx.fee) : '—'}
                                                </td>
                                                <td className="p-3 font-mono tabular-nums">{peso(tx.float_balance_after)}</td>
                                                <td className="p-3">{tx.cashier.name}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-2 sm:hidden">
                                {recentTransactions.map((tx) => (
                                    <div key={tx.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <Badge
                                                    className={cn('font-normal', TYPE_META[tx.type].badgeClass)}
                                                    variant={tx.type === 'float_adjustment' ? 'secondary' : tx.type === 'cash_out' ? 'outline' : undefined}
                                                >
                                                    {tx.type === 'expense_payment' && <ExpenseIcon className="mr-1 size-3" />}
                                                    {TYPE_META[tx.type].label}
                                                </Badge>
                                                <p className="mt-1 truncate text-sm font-medium">{secondaryLabel(tx)}</p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className="font-mono text-sm font-semibold tabular-nums">{peso(tx.amount)}</p>
                                                <p className="text-xs text-muted-foreground">{timeOnly(tx.created_at)}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
                                            <span>{tx.cashier.name}</span>
                                            <span>
                                                Float after <span className="font-mono tabular-nums text-foreground">{peso(tx.float_balance_after)}</span>
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(modal === 'cash_in' || modal === 'cash_out' || modal === 'adjust') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => setModal(null)}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 24 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm rounded-t-2xl border bg-background p-4 shadow-xl sm:rounded-2xl"
                        >
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-medium">
                                    {modal === 'cash_in' && !shift && 'Shift Required'}
                                    {modal === 'cash_in' && shift && 'New Cash-In'}
                                    {modal === 'cash_out' && !shift && 'Shift Required'}
                                    {modal === 'cash_out' && shift && 'New Cash-Out'}
                                    {modal === 'adjust' && 'Reconcile GCash Float'}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setModal(null)}
                                    className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                                    aria-label="Close"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {(modal === 'cash_in' || modal === 'cash_out') && !shift && (
                                <OpenShiftGate onOpened={refetchShift} />
                            )}
                            {(modal === 'cash_in' || modal === 'cash_out') && shift && (
                                <GcashTransactionForm type={modal} onSuccess={closeModal} />
                            )}
                            {modal === 'adjust' && <FloatAdjustmentForm currentBalance={floatBalance} onSuccess={closeModal} />}

                            {!(modal === 'cash_in' || modal === 'cash_out') || shift ? (
                                <Button variant="outline" className="mt-2 w-full" onClick={() => setModal(null)}>
                                    Cancel
                                </Button>
                            ) : null}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: 'green' }) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-1 font-mono text-xl font-bold tabular-nums',
                    accent === 'green' && 'text-[var(--pos-green)]',
                )}
            >
                {value}
            </p>
        </div>
    );
}

GcashIndex.layout = {
    breadcrumbs: [{ title: 'GCash Monitor', href: '/gcash' }],
};
