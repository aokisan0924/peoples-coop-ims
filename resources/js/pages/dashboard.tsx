import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle, Banknote, Clock, DollarSign, PackagePlus, PlusCircle,
    ShoppingCart, Smartphone, Trophy, Users, Wallet, Truck, UserCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import products from '@/routes/products';
import stockBatches from '@/routes/stock-batches';

interface PeriodStat { total: number; count: number }
interface LowStockProduct { id: number; name: string; total_stock: number; low_stock_threshold: number; location_name: string | null }
interface ExpiringBatch { id: number; product_name: string; remaining_qty: number; expiry_date: string; days_left: number }
interface TrendPoint { date: string; total: number }
interface PaymentBreakdown { payment_method: 'cash' | 'gcash'; total: string; count: number }
interface CashierBreakdown { name: string; total: string; count: number }
interface BestSeller { name: string; units_sold: number; revenue: string }
interface ProfitLossSummary {
    revenue: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
}
interface BranchStat extends ProfitLossSummary {
    id: number;
    name: string;
}
interface GcashOverviewRow {
    location_id: number;
    location_name: string;
    balance: number;
    today_cash_in: number;
    today_cash_out: number;
}
interface PayableRow {
    id: number;
    supplier_name: string;
    amount: number;
    due_date: string | null;
    is_overdue: boolean;
}
interface PayablesSummary {
    total_unpaid: number;
    unpaid_count: number;
    overdue_count: number;
    upcoming: PayableRow[];
}
interface OpenShift {
    id: number;
    cashier_name: string;
    location_name: string;
    starting_cash: number;
    opened_at: string;
}

interface Props {
    todaySales: PeriodStat;
    weekSales: PeriodStat;
    monthSales: PeriodStat;
    yearSales: PeriodStat;
    activeProductsCount: number;
    lowStockProducts: LowStockProduct[];
    expiringSoon: ExpiringBatch[];
    trend: TrendPoint[] | null;
    paymentBreakdown: PaymentBreakdown[] | null;
    cashierBreakdown: CashierBreakdown[] | null;
    bestSellers: BestSeller[] | null;
    monthProfitLoss: ProfitLossSummary | null;
    isOwner: boolean;
    branchBreakdown: BranchStat[] | null;
    gcashOverview: GcashOverviewRow[] | null;
    payablesSummary: PayablesSummary | null;
    openShifts: OpenShift[] | null;
}

const TREND_RANGES = [7, 30, 90] as const;

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

    if (minutes < 60) {
return `${minutes}m ago`;
}

    const hours = Math.floor(minutes / 60);

    return `${hours}h ${minutes % 60}m ago`;
}

export default function Dashboard({
    todaySales, weekSales, monthSales, yearSales,
    activeProductsCount, lowStockProducts, expiringSoon,
    trend, paymentBreakdown, cashierBreakdown, bestSellers,
    monthProfitLoss, isOwner, branchBreakdown,
    gcashOverview, payablesSummary, openShifts,
}: Props) {
    const { isManager } = useAuth();
    const canManage = isManager || isOwner;
    const [trendDays, setTrendDays] = useState<(typeof TREND_RANGES)[number]>(30);

    const trendSlice = useMemo(
        () => (trend ?? []).slice(-trendDays),
        [trend, trendDays],
    );

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 sm:space-y-6 sm:p-6">
                {/* Quick actions — only show links to pages the current role can actually open.
                    Owner doesn't run the register day-to-day, so "New Sale" is Cashier/Manager only. */}
                <div className="flex flex-wrap gap-2">
                    {!isOwner && (
                        <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                            <Link href="/pos">
                                <ShoppingCart className="size-4" />
                                New Sale
                            </Link>
                        </Button>
                    )}
                    {canManage && (
                        <>
                            <Button variant="outline" asChild className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]">
                                <Link href={stockBatches.create().url}>
                                    <PackagePlus className="size-4" />
                                    Receive Stock
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]">
                                <Link href={products.create().url}>
                                    <PlusCircle className="size-4" />
                                    Add Product
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    <StatCard label="Today" data={todaySales} highlight />
                    <StatCard label="This Week" data={weekSales} />
                    <StatCard label="This Month" data={monthSales} />
                    <StatCard label="This Year" data={yearSales} />
                </div>

                {/* Profit & Loss snapshot — Manager sees their own branch, Owner sees
                    the company-wide total (per-branch split is in the table below) */}
                {canManage && monthProfitLoss && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-sm font-medium">
                                <DollarSign className="size-4 text-[var(--pos-teal)]" />
                                Profit &amp; Loss (This Month){!isOwner && ' — Your Branch'}
                            </h2>
                            <Link href="/reports/profit-loss" className="text-xs font-medium text-[var(--pos-teal)] hover:underline">
                                Full report &rarr;
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                            <PlStat label="Revenue" value={monthProfitLoss.revenue} />
                            <PlStat label="COGS" value={monthProfitLoss.cogs} negative />
                            <PlStat label="Expenses" value={monthProfitLoss.expenses} negative />
                            <PlStat label="Gross Profit" value={monthProfitLoss.gross_profit} sub={`${monthProfitLoss.gross_margin_pct}% margin`} />
                            <PlStat
                                label="Net Profit"
                                value={monthProfitLoss.net_profit}
                                sub={`${monthProfitLoss.net_margin_pct}% margin`}
                                emphasize
                            />
                        </div>
                    </div>
                )}

                {/* On wide screens, the trend chart and the two alert panels share a row
                    instead of stacking full-width one after another — the chart is the
                    widest, most space-hungry element, so it anchors the row and the
                    compact alert lists fill the remaining column. */}
                <div className={cn('grid grid-cols-1 gap-3 sm:gap-4', canManage && 'lg:grid-cols-3')}>
                    {canManage && (
                        <div className="rounded-xl border bg-card p-4 shadow-sm lg:col-span-2">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-sm font-medium">Sales Trend</h2>
                                <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                                    {TREND_RANGES.map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            onClick={() => setTrendDays(days)}
                                            className={cn(
                                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                                                trendDays === days
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground',
                                            )}
                                        >
                                            {days}d
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={trendSlice}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                        fontSize={12}
                                    />
                                    <YAxis fontSize={12} tickFormatter={(v) => `₱${v}`} />
                                    <Tooltip
                                        labelFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        formatter={(value) => [peso(Number(value ?? 0)), 'Sales']}
                                    />
                                    <Line type="monotone" dataKey="total" stroke="var(--pos-teal)" strokeWidth={2.5} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className={cn('grid grid-cols-1 gap-3 sm:gap-4', !canManage && 'sm:grid-cols-2')}>
                        {canManage && (
                            <div className="sm:col-span-2">
                                <Link
                                    href="/stock-batches/by-branch"
                                    className="text-xs font-medium text-[var(--pos-teal)] hover:underline"
                                >
                                    View stock by branch &rarr;
                                </Link>
                            </div>
                        )}
                        <AlertPanel
                            icon={<AlertTriangle className="size-4 text-red-500" />}
                            title={`Low Stock (${lowStockProducts.length} of ${activeProductsCount} active products)`}
                            emptyLabel="Nothing is low on stock right now."
                            isEmpty={lowStockProducts.length === 0}
                        >
                            {lowStockProducts.map((p) => (
                                <div key={`${p.id}-${p.location_name ?? 'own'}`} className="flex items-center justify-between text-sm">
                                    <span className="mr-2 truncate">
                                        {p.name}
                                        {p.location_name && (
                                            <span className="ml-1.5 text-xs text-muted-foreground">
                                                &middot; {p.location_name}
                                            </span>
                                        )}
                                    </span>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Badge variant="destructive">{p.total_stock} left</Badge>
                                        {canManage && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                asChild
                                                className="hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                            >
                                                <Link href={stockBatches.create().url}>Restock</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </AlertPanel>

                        <AlertPanel
                            icon={<Clock className="size-4 text-amber-500" />}
                            title="Expiring Soon (14 days)"
                            emptyLabel="Nothing expiring soon."
                            isEmpty={expiringSoon.length === 0}
                        >
                            {expiringSoon.map((b) => (
                                <div key={b.id} className="flex items-center justify-between text-sm">
                                    <span className="mr-2 truncate">{b.product_name}</span>
                                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                        <span>{b.remaining_qty} units</span>
                                        <Badge variant={b.days_left <= 3 ? 'destructive' : 'secondary'}>
                                            {b.days_left <= 0 ? 'Expired' : `${b.days_left}d left`}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </AlertPanel>
                    </div>
                </div>

                {/* Breakdowns — Manager-only */}
                {canManage && (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                        <BreakdownPanel icon={<Banknote className="size-4 text-[var(--pos-teal)]" />} title="Payment Methods (This Month)" isEmpty={(paymentBreakdown ?? []).length === 0}>
                            {(paymentBreakdown ?? []).map((p) => (
                                <div key={p.payment_method} className="mb-1 flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-1.5 capitalize">
                                        {p.payment_method === 'gcash' ? (
                                            <Smartphone className="size-3.5 text-[var(--pos-teal)]" />
                                        ) : (
                                            <Banknote className="size-3.5 text-muted-foreground" />
                                        )}
                                        {p.payment_method} ({p.count})
                                    </span>
                                    <span className="font-mono font-medium tabular-nums">{peso(p.total)}</span>
                                </div>
                            ))}
                        </BreakdownPanel>

                        <BreakdownPanel icon={<Users className="size-4 text-[var(--pos-teal)]" />} title="By Cashier (This Month)" isEmpty={(cashierBreakdown ?? []).length === 0}>
                            {(cashierBreakdown ?? []).map((c) => (
                                <div key={c.name} className="mb-1 flex justify-between text-sm">
                                    <span className="truncate">{c.name} ({c.count})</span>
                                    <span className="font-mono font-medium tabular-nums">{peso(c.total)}</span>
                                </div>
                            ))}
                        </BreakdownPanel>

                        <BreakdownPanel icon={<Trophy className="size-4 text-[var(--pos-green)]" />} title="Best Sellers (This Month)" isEmpty={(bestSellers ?? []).length === 0}>
                            {(bestSellers ?? []).map((b) => (
                                <div key={b.name} className="mb-1 flex justify-between text-sm">
                                    <span className="mr-2 truncate">{b.name} ({b.units_sold})</span>
                                    <span className="font-mono font-medium whitespace-nowrap tabular-nums">{peso(b.revenue)}</span>
                                </div>
                            ))}
                        </BreakdownPanel>
                    </div>
                )}

                {/* Financial oversight — Manager/Owner only */}
                {canManage && (gcashOverview || payablesSummary || openShifts) && (
                    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                        <BreakdownPanel
                            icon={<Wallet className="size-4 text-[var(--pos-teal)]" />}
                            title="GCash Float"
                            isEmpty={(gcashOverview ?? []).length === 0}
                        >
                            {(gcashOverview ?? []).map((g) => (
                                <div key={g.location_id} className="mb-2 border-b pb-2 last:mb-0 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="truncate font-medium">{g.location_name}</span>
                                        <span className="font-mono font-medium tabular-nums">{peso(g.balance)}</span>
                                    </div>
                                    <div className="mt-0.5 flex justify-between text-xs text-muted-foreground">
                                        <span>Today: +{peso(g.today_cash_in)} in</span>
                                        <span>−{peso(g.today_cash_out)} out</span>
                                    </div>
                                </div>
                            ))}
                        </BreakdownPanel>

                        <BreakdownPanel
                            icon={<Truck className="size-4 text-amber-500" />}
                            title="Accounts Payable"
                            isEmpty={!payablesSummary || payablesSummary.unpaid_count === 0}
                        >
                            {payablesSummary && (
                                <>
                                    <div className="mb-3 flex items-baseline justify-between">
                                        <span className="font-mono text-lg font-bold tabular-nums">{peso(payablesSummary.total_unpaid)}</span>
                                        <span className="text-xs text-muted-foreground">{payablesSummary.unpaid_count} unpaid</span>
                                    </div>
                                    {payablesSummary.overdue_count > 0 && (
                                        <Badge variant="destructive" className="mb-2">
                                            {payablesSummary.overdue_count} overdue
                                        </Badge>
                                    )}
                                    {payablesSummary.upcoming.map((p) => (
                                        <div key={p.id} className="mb-1 flex items-center justify-between text-sm">
                                            <span className="mr-2 truncate">{p.supplier_name}</span>
                                            <div className="flex shrink-0 items-center gap-1.5">
                                                <span className="font-mono tabular-nums">{peso(p.amount)}</span>
                                                {p.is_overdue && <Badge variant="destructive" className="px-1.5 text-[10px]">Overdue</Badge>}
                                            </div>
                                        </div>
                                    ))}
                                    <Link href="/accounts-payable" className="mt-2 block text-xs font-medium text-[var(--pos-teal)] hover:underline">
                                        View all &rarr;
                                    </Link>
                                </>
                            )}
                        </BreakdownPanel>

                        <BreakdownPanel
                            icon={<UserCheck className="size-4 text-[var(--pos-green)]" />}
                            title={`Open Shifts Right Now (${(openShifts ?? []).length})`}
                            isEmpty={(openShifts ?? []).length === 0}
                        >
                            {(openShifts ?? []).map((s) => (
                                <div key={s.id} className="mb-1.5 flex items-center justify-between text-sm">
                                    <span className="mr-2 truncate">
                                        {s.cashier_name}
                                        <span className="ml-1.5 text-xs text-muted-foreground">&middot; {s.location_name}</span>
                                    </span>
                                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(s.opened_at)}</span>
                                </div>
                            ))}
                        </BreakdownPanel>
                    </div>
                )}

                {/* Branch comparison — Owner-only, now a full P&L per branch */}
                {isOwner && branchBreakdown && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 text-sm font-medium">Branch Comparison — Profit &amp; Loss (This Month)</h2>
                        <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">Branch</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">Revenue</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">COGS</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">Expenses</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">Net Profit</th>
                                        <th className="p-2.5 text-right font-medium text-muted-foreground">Margin</th>
                                        <th className="p-2.5"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchBreakdown.map((b) => (
                                        <tr key={b.id} className="border-t transition-colors hover:bg-muted/30">
                                            <td className="p-2.5 font-medium whitespace-nowrap">{b.name}</td>
                                            <td className="p-2.5 text-right font-mono tabular-nums">{peso(b.revenue)}</td>
                                            <td className="p-2.5 text-right font-mono tabular-nums text-muted-foreground">{peso(b.cogs)}</td>
                                            <td className="p-2.5 text-right font-mono tabular-nums text-muted-foreground">{peso(b.expenses)}</td>
                                            <td className={cn(
                                                'p-2.5 text-right font-mono font-medium tabular-nums',
                                                b.net_profit >= 0 ? 'text-[var(--pos-green)]' : 'text-red-600',
                                            )}>
                                                {peso(b.net_profit)}
                                            </td>
                                            <td className="p-2.5 text-right text-muted-foreground">{b.net_margin_pct}%</td>
                                            <td className="p-2.5 text-right whitespace-nowrap">
                                                <Link
                                                    href={`/reports/profit-loss?location_id=${b.id}`}
                                                    className="text-xs font-medium text-[var(--pos-teal)] hover:underline"
                                                >
                                                    Details &rarr;
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PlStat({
    label,
    value,
    sub,
    negative = false,
    emphasize = false,
}: {
    label: string;
    value: number;
    sub?: string;
    negative?: boolean;
    emphasize?: boolean;
}) {
    const isNegativeValue = emphasize && value < 0;

    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p
                className={cn(
                    'mt-0.5 font-mono text-lg font-bold tabular-nums',
                    emphasize && (isNegativeValue ? 'text-red-600' : 'text-[var(--pos-green)]'),
                )}
            >
                {negative && value > 0 ? '−' : ''}{peso(value)}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
        </div>
    );
}

function StatCard({ label, data, highlight = false }: { label: string; data: PeriodStat; highlight?: boolean }) {
    return (
        <div
            className={cn(
                'rounded-xl border p-4 shadow-sm',
                highlight ? 'bg-gradient-to-br from-[var(--pos-teal)]/10 via-[var(--pos-teal)]/5 to-transparent' : 'bg-card',
            )}
        >
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">{peso(data.total)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
        </div>
    );
}

function AlertPanel({
    icon,
    title,
    emptyLabel,
    isEmpty,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    emptyLabel: string;
    isEmpty: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                {icon}
                {title}
            </h2>
            {isEmpty ? <p className="text-sm text-muted-foreground">{emptyLabel}</p> : <div className="space-y-2">{children}</div>}
        </div>
    );
}

function BreakdownPanel({
    icon,
    title,
    isEmpty,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    isEmpty: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                {icon}
                {title}
            </h2>
            {isEmpty ? <p className="text-sm text-muted-foreground">No sales yet.</p> : children}
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard().url }],
};
