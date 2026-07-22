import { Head, Link, router } from '@inertiajs/react';
import {
    Banknote,
    CheckCircle2,
    Eye,
    Receipt,
    Search,
    Smartphone,
    Users,
    X,
    XCircle
    
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

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

const QUICK_REASONS = ['Customer complaint', 'Wrong item scanned', 'Duplicate transaction', 'Price error'];

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesIndex({ sales }: { sales: PaginatedSales }) {
    const { isManager } = useAuth();

    const [voidingId, setVoidingId] = useState<number | null>(null);
    const [reason, setReason] = useState('');
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState<'all' | 'completed' | 'voided'>('all');
    const [payment, setPayment] = useState<'all' | 'cash' | 'gcash'>('all');

    const isEmpty = sales.data.length === 0;
    const voidedCount = useMemo(() => sales.data.filter((s) => s.voided_at).length, [sales.data]);
    const completedCount = sales.data.length - voidedCount;
    const cashCount = useMemo(() => sales.data.filter((s) => s.payment_method === 'cash').length, [sales.data]);
    const gcashCount = sales.data.length - cashCount;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return sales.data.filter((sale) => {
            const matchesQuery = !q || sale.receipt_number.toLowerCase().includes(q) || sale.cashier.name.toLowerCase().includes(q);
            const matchesStatus = status === 'all' || (status === 'voided' ? !!sale.voided_at : !sale.voided_at);
            const matchesPayment = payment === 'all' || sale.payment_method === payment;

            return matchesQuery && matchesStatus && matchesPayment;
        });
    }, [sales.data, query, status, payment]);

    const noResults = !isEmpty && filtered.length === 0;
    const hasFilters = query.trim() !== '' || status !== 'all' || payment !== 'all';
    const voidingSale = sales.data.find((s) => s.id === voidingId);

    function clearFilters() {
        setQuery('');
        setStatus('all');
        setPayment('all');
    }

    function closeVoidModal() {
        setVoidingId(null);
        setReason('');
    }

    function handleVoidSubmit(saleId: number) {
        if (!reason.trim()) {
return;
}

        router.post(
            `/sales/${saleId}/void`,
            { void_reason: reason },
            { onSuccess: () => closeVoidModal() },
        );
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Sales History" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Sales History</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">{sales.data.length}</Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Browse transactions, review payments, and void sales when needed.</p>
                    </div>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2.5 sm:max-w-2xl sm:grid-cols-4 sm:gap-3">
                            <StatCard icon={CheckCircle2} label="Completed" value={completedCount} accent="teal" />
                            <StatCard icon={XCircle} label="Voided" value={voidedCount} accent="red" />
                            <StatCard icon={Banknote} label="Cash" value={cashCount} accent="green" />
                            <StatCard icon={Smartphone} label="GCash" value={gcashCount} accent="teal" />
                        </div>

                        {/* Search + filters */}
                        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                            <div className="relative max-w-sm flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by receipt # or cashier…"
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
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                aria-label="Filter by status"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-[var(--pos-teal)] focus-visible:outline-none sm:w-40"
                            >
                                <option value="all">All statuses</option>
                                <option value="completed">Completed</option>
                                <option value="voided">Voided</option>
                            </select>
                            <select
                                value={payment}
                                onChange={(e) => setPayment(e.target.value as typeof payment)}
                                aria-label="Filter by payment method"
                                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:ring-1 focus-visible:ring-[var(--pos-teal)] focus-visible:outline-none sm:w-40"
                            >
                                <option value="all">All payments</option>
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                            </select>
                        </div>
                    </>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults onClear={clearFilters} hasFilters={hasFilters} />
                ) : (
                    <>
                        {/* Table on larger screens, cards on mobile */}
                        <div className="hidden overflow-hidden rounded-xl border lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Receipt</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Cashier</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Type</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Payment</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Total</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((sale) => (
                                        <tr key={sale.id} className="group border-t transition-colors hover:bg-muted/30">
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <Receipt className="size-4" />
                                                    </div>
                                                    <span className="truncate font-mono text-xs">{sale.receipt_number}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 whitespace-nowrap text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleString('en-PH', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short',
                                                })}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{sale.cashier.name}</td>
                                            <td className="p-3">
                                                {sale.is_member ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--pos-teal)]">
                                                        <Users className="size-3" />
                                                        Member
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Non-Member</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <PaymentBadge method={sale.payment_method} />
                                            </td>
                                            <td className="p-3 font-semibold tabular-nums">{peso(sale.total)}</td>
                                            <td className="p-3">
                                                {sale.voided_at ? (
                                                    <Badge
                                                        title={sale.void_reason ?? undefined}
                                                        className="border-0 bg-red-100 font-normal text-red-700 dark:bg-red-950/50 dark:text-red-400"
                                                    >
                                                        Voided
                                                    </Badge>
                                                ) : (
                                                    <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                                        Completed
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title="View receipt"
                                                    >
                                                        <Link href={`/sales/${sale.id}/receipt`}>
                                                            <Eye className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    {isManager && !sale.voided_at && (
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => setVoidingId(sale.id)}
                                                            className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                            title="Void sale"
                                                        >
                                                            <XCircle className="size-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((sale) => (
                                <div key={sale.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex min-w-0 items-start gap-2.5">
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                <Receipt className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <p className="truncate font-mono text-xs font-medium">{sale.receipt_number}</p>
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
                                                    {new Date(sale.created_at).toLocaleString('en-PH', {
                                                        dateStyle: 'medium',
                                                        timeStyle: 'short',
                                                    })}
                                                </p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">{sale.cashier.name}</p>
                                                {sale.voided_at && sale.void_reason && (
                                                    <p className="mt-1 line-clamp-2 text-xs text-red-600 dark:text-red-400">
                                                        Reason: {sale.void_reason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="shrink-0 text-sm font-semibold tabular-nums">{peso(sale.total)}</p>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-2 text-xs">
                                        <PaymentBadge method={sale.payment_method} />
                                        {sale.is_member ? (
                                            <span className="inline-flex items-center gap-1 text-[var(--pos-teal)]">
                                                <Users className="size-3" />
                                                Member
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">Non-Member</span>
                                        )}
                                    </div>

                                    <div className={cn('mt-3 grid gap-1.5 border-t pt-2.5', isManager && !sale.voided_at ? 'grid-cols-2' : 'grid-cols-1')}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <Link href={`/sales/${sale.id}/receipt`}>
                                                <Eye className="size-3.5" />
                                                View
                                            </Link>
                                        </Button>
                                        {isManager && !sale.voided_at && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setVoidingId(sale.id)}
                                                className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                            >
                                                <XCircle className="size-3.5" />
                                                Void
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination links={sales.links} />
                    </>
                )}
            </div>

            {/* Void modal */}
            {voidingId && voidingSale && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
                    onClick={closeVoidModal}
                >
                    <div
                        className="w-full max-w-sm rounded-xl border bg-background p-4 shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                <XCircle className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-medium">Void Sale</h2>
                                <p className="truncate font-mono text-xs text-muted-foreground">{voidingSale.receipt_number}</p>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">A reason is required and will be recorded with this sale.</p>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g. Customer complaint, wrong item scanned"
                            className="mt-2 focus-visible:ring-red-500"
                            autoFocus
                        />

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {QUICK_REASONS.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setReason(r)}
                                    className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-red-300 hover:text-red-600 dark:hover:border-red-900 dark:hover:text-red-400"
                                >
                                    {r}
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleVoidSubmit(voidingSale.id)}
                                disabled={!reason.trim()}
                            >
                                Confirm Void
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={closeVoidModal}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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

function StatCard({ icon: Icon, label, value, accent }: { icon: LucideIcon; label: string; value: number; accent: 'teal' | 'green' | 'red' }) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
            <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', styles)}>
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{label}</p>
            </div>
        </div>
    );
}

function Pagination({ links }: { links: PaginatedSales['links'] }) {
    if (links.length <= 3) {
return null;
}

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
            {links.map((link, i) => {
                const label = link.label.replace('&laquo;', '←').replace('&raquo;', '→');

                if (!link.url) {
                    return (
                        <span key={i} className="cursor-not-allowed rounded-md px-3 py-1.5 text-sm text-muted-foreground/40">
                            {label}
                        </span>
                    );
                }

                return (
                    <Link
                        key={i}
                        href={link.url}
                        preserveScroll
                        className={cn(
                            'rounded-md px-3 py-1.5 text-sm transition-colors',
                            link.active ? 'bg-[var(--pos-teal)] text-white' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        {label}
                    </Link>
                );
            })}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Receipt className="size-7" />
            </div>
            <p className="text-sm font-medium">No sales yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Transactions will show up here once sales are recorded at the register.</p>
        </div>
    );
}

function NoResults({ onClear, hasFilters }: { onClear: () => void; hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">No sales match your filters</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different search term, status, or payment method.</p>
            {hasFilters && (
                <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                    Clear filters
                </Button>
            )}
        </div>
    );
}

SalesIndex.layout = {
    breadcrumbs: [{ title: 'Sales History', href: '/sales' }],
};
