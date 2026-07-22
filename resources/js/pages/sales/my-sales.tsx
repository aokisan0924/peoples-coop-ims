import { Head, router, Link } from '@inertiajs/react';
import {
    Banknote,
    Calendar,
    Eye,
    Receipt,
    Search,
    Smartphone,
    Users,
    Wallet,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

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

export default function MySales({
    sales,
    summary,
    selectedDate,
}: {
    sales: Sale[];
    summary: Summary;
    selectedDate: string;
}) {
    const [query, setQuery] = useState('');

    function handleDateChange(date: string) {
        router.get('/my-sales', { date }, { preserveState: true });
    }

    const isEmpty = sales.length === 0;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return sales;
        }

        return sales.filter((sale) =>
            sale.receipt_number.toLowerCase().includes(q),
        );
    }, [sales, query]);

    const noResults = !isEmpty && filtered.length === 0;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="My Sales" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold tracking-tight">
                            My Sales
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Track your shift's transactions for cash drawer
                            reconciliation.
                        </p>
                    </div>
                    <div className="relative">
                        <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Label htmlFor="date" className="sr-only">
                            Date
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full pl-9 focus-visible:ring-[var(--pos-teal)] sm:w-44"
                        />
                    </div>
                </div>

                {/* Shift summary */}
                <div className="grid grid-cols-2 gap-2.5 sm:max-w-2xl sm:grid-cols-4 sm:gap-3">
                    <StatCard
                        icon={Wallet}
                        label="Total Sales"
                        value={peso(summary.total_sales)}
                        sub={`${summary.transaction_count} transactions`}
                        accent="teal"
                    />
                    <StatCard
                        icon={Banknote}
                        label="Cash"
                        value={peso(summary.cash_total)}
                        accent="green"
                    />
                    <StatCard
                        icon={Smartphone}
                        label="GCash"
                        value={peso(summary.gcash_total)}
                        accent="teal"
                    />
                    <StatCard
                        icon={XCircle}
                        label="Voided"
                        value={String(summary.voided_count)}
                        accent="red"
                    />
                </div>

                {!isEmpty && (
                    <div className="relative max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by receipt #…"
                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                            aria-label="Search sales"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults query={query} onClear={() => setQuery('')} />
                ) : (
                    <>
                        {/* Table on larger screens, cards on mobile */}
                        <div className="hidden overflow-hidden rounded-xl border lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Time
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Receipt #
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Type
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Payment
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Total
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((sale) => (
                                        <tr
                                            key={sale.id}
                                            className="group border-t transition-colors hover:bg-muted/30"
                                        >
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                {new Date(
                                                    sale.created_at,
                                                ).toLocaleTimeString('en-PH', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <Receipt className="size-4" />
                                                    </div>
                                                    <span className="truncate font-mono text-xs">
                                                        {sale.receipt_number}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {sale.is_member ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--pos-teal)]">
                                                        <Users className="size-3" />
                                                        Member
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        Non-Member
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <PaymentBadge
                                                    method={sale.payment_method}
                                                />
                                            </td>
                                            <td className="p-3 font-semibold tabular-nums">
                                                {peso(sale.total)}
                                            </td>
                                            <td className="p-3">
                                                {sale.voided_at ? (
                                                    <Badge className="border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                                        Voided
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                                        Completed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <Link
                                                    href={`/sales/${sale.id}/receipt`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--pos-teal)] opacity-80 transition-opacity group-hover:opacity-100 hover:underline"
                                                >
                                                    <Eye className="size-3.5" />
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="rounded-xl border bg-card p-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-start gap-2.5">
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                <Receipt className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="truncate font-mono text-xs font-medium">
                                                        {sale.receipt_number}
                                                    </p>
                                                    {sale.voided_at ? (
                                                        <Badge className="border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400">
                                                            Voided
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                                            Completed
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {new Date(
                                                        sale.created_at,
                                                    ).toLocaleTimeString(
                                                        'en-PH',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                                            {peso(sale.total)}
                                        </p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-2 text-xs">
                                        <PaymentBadge
                                            method={sale.payment_method}
                                        />
                                        {sale.is_member ? (
                                            <span className="inline-flex items-center gap-1 text-[var(--pos-teal)]">
                                                <Users className="size-3" />
                                                Member
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Non-Member
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 border-t pt-2.5">
                                        <Link
                                            href={`/sales/${sale.id}/receipt`}
                                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--pos-teal)] hover:underline"
                                        >
                                            <Eye className="size-3.5" />
                                            View Receipt
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function PaymentBadge({ method }: { method: 'cash' | 'gcash' }) {
    if (method === 'cash') {
        return (
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--pos-green)]/15 px-2 py-0.5 text-xs font-medium text-[var(--pos-green)]">
                <Banknote className="size-3" />
                Cash
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-md bg-[var(--pos-teal)]/15 px-2 py-0.5 text-xs font-medium text-[var(--pos-teal)]">
            <Smartphone className="size-3" />
            GCash
        </span>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    accent,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    sub?: string;
    accent: 'teal' | 'green' | 'red';
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <div className="rounded-xl border bg-card p-3">
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-lg',
                        styles,
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {label}
                </p>
            </div>
            <p className="mt-2 truncate text-xl leading-none font-bold sm:text-2xl">
                {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-7" />
            </div>
            <p className="text-sm font-medium">
                No sales recorded for this date
            </p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Pick a different date, or check back after your next shift.
            </p>
        </div>
    );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">No sales match "{query}"</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Try a different receipt number.
            </p>
            <button
                type="button"
                onClick={onClear}
                className="mt-2 text-sm font-medium text-[var(--pos-teal)] hover:underline"
            >
                Clear search
            </button>
        </div>
    );
}

MySales.layout = {
    breadcrumbs: [{ title: 'My Sales', href: '/my-sales' }],
};
