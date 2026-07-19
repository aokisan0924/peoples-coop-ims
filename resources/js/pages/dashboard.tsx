import { Head, Link } from '@inertiajs/react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, PackagePlus, PlusCircle, AlertTriangle } from 'lucide-react';
import { dashboard } from '@/routes';
import products from '@/routes/products';
import stockBatches from '@/routes/stock-batches';
import { useAuth } from '@/hooks/use-auth';

interface PeriodStat { total: number; count: number }
interface LowStockProduct { id: number; name: string; total_stock: number; low_stock_threshold: number }
interface ExpiringBatch { id: number; product_name: string; remaining_qty: number; expiry_date: string; days_left: number }
interface TrendPoint { date: string; total: number }
interface PaymentBreakdown { payment_method: 'cash' | 'gcash'; total: string; count: number }
interface CashierBreakdown { name: string; total: string; count: number }
interface BestSeller { name: string; units_sold: number; revenue: string }
interface BranchStat {
    id: number;
    name: string;
    total_sales: number;
    transaction_count: number;
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
    isOwner: boolean;
    branchBreakdown: BranchStat[] | null;
}

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard({
    todaySales, weekSales, monthSales, yearSales,
    activeProductsCount, lowStockProducts, expiringSoon,
    trend, paymentBreakdown, cashierBreakdown, bestSellers,
    isOwner, branchBreakdown,
}: Props) {
    const { isManager } = useAuth();
    const canManage = isManager || isOwner;
    return (
        <>
            <Head title="Dashboard" />

            <div className="p-4 space-y-6">
                {/* Quick actions — only show links to pages the current role can actually open */}
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/pos">
                            <ShoppingCart className="size-4" />
                            New Sale
                        </Link>
                    </Button>
                    {canManage && (
                        <>
                            <Button variant="outline" asChild>
                                <Link href={stockBatches.create().url}>
                                    <PackagePlus className="size-4" />
                                    Receive Stock
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={products.create().url}>
                                    <PlusCircle className="size-4" />
                                    Add Product
                                </Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Today" data={todaySales} />
                    <StatCard label="This Week" data={weekSales} />
                    <StatCard label="This Month" data={monthSales} />
                    <StatCard label="This Year" data={yearSales} />
                </div>

                {/* Alerts — things that need action today */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-red-500" />
                            Low Stock ({lowStockProducts.length})
                        </h2>
                        {lowStockProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nothing is low on stock right now.</p>
                        ) : (
                            <div className="space-y-2">
                                {lowStockProducts.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate mr-2">{p.name}</span>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Badge variant="destructive">{p.total_stock} left</Badge>
                                            {canManage && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={stockBatches.create().url}>Restock</Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-amber-500" />
                            Expiring Soon (14 days)
                        </h2>
                        {expiringSoon.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nothing expiring soon.</p>
                        ) : (
                            <div className="space-y-2">
                                {expiringSoon.map((b) => (
                                    <div key={b.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate mr-2">{b.product_name}</span>
                                        <div className="flex items-center gap-2 shrink-0 text-xs text-muted-foreground">
                                            <span>{b.remaining_qty} units</span>
                                            <Badge variant={b.days_left <= 3 ? 'destructive' : 'secondary'}>
                                                {b.days_left <= 0 ? 'Expired' : `${b.days_left}d left`}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Trend chart — Manager-only, since it's financial detail beyond a cashier's needs */}
                {canManage && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-4">Last 30 Days</h2>
                        <ResponsiveContainer width="100%" height={260}>
                            <LineChart data={trend ?? []}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} fontSize={12} />
                                <YAxis fontSize={12} tickFormatter={(v) => `₱${v}`} />
                                <Tooltip
                                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    formatter={(value) => [peso(Number(value ?? 0)), 'Sales']}
                                />
                                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Breakdowns — Manager-only */}
                {canManage && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                            <h2 className="text-sm font-medium mb-3">Payment Methods (This Month)</h2>
                            {(paymentBreakdown ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sales yet.</p>
                            ) : (paymentBreakdown ?? []).map((p) => (
                                <div key={p.payment_method} className="flex justify-between text-sm mb-1">
                                    <span className="capitalize">{p.payment_method} ({p.count})</span>
                                    <span className="font-medium">{peso(p.total)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border rounded-lg p-4">
                            <h2 className="text-sm font-medium mb-3">By Cashier (This Month)</h2>
                            {(cashierBreakdown ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sales yet.</p>
                            ) : (cashierBreakdown ?? []).map((c) => (
                                <div key={c.name} className="flex justify-between text-sm mb-1">
                                    <span>{c.name} ({c.count})</span>
                                    <span className="font-medium">{peso(c.total)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border rounded-lg p-4">
                            <h2 className="text-sm font-medium mb-3">Best Sellers (This Month)</h2>
                            {(bestSellers ?? []).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sales yet.</p>
                            ) : (bestSellers ?? []).map((b) => (
                                <div key={b.name} className="flex justify-between text-sm mb-1">
                                    <span className="truncate mr-2">{b.name} ({b.units_sold})</span>
                                    <span className="font-medium whitespace-nowrap">{peso(b.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Branch comparison — Owner-only, now correctly inside the padded/spaced container */}
                {isOwner && branchBreakdown && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">Branch Comparison (This Month)</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-2">Branch</th>
                                    <th className="text-left p-2">Sales</th>
                                    <th className="text-left p-2">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchBreakdown.map((b) => (
                                    <tr key={b.id} className="border-t">
                                        <td className="p-2 font-medium">{b.name}</td>
                                        <td className="p-2">{peso(b.total_sales)}</td>
                                        <td className="p-2">{b.transaction_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function StatCard({ label, data }: { label: string; data: PeriodStat }) {
    return (
        <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{peso(data.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
        </div>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard().url }],
};
