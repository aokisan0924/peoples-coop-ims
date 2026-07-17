import { Head, Link } from '@inertiajs/react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, PackagePlus, PlusCircle, AlertTriangle } from 'lucide-react';
import { dashboard } from '@/routes';
import products from '@/routes/products';
import stockBatches from '@/routes/stock-batches';

interface PeriodStat {
    total: number;
    count: number;
}

interface LowStockProduct {
    id: number;
    name: string;
    total_stock: number;
    low_stock_threshold: number;
}

interface ExpiringBatch {
    id: number;
    product_name: string;
    remaining_qty: number;
    expiry_date: string;
    days_left: number;
}

interface TrendPoint {
    date: string;
    total: number;
}

interface Props {
    todaySales: PeriodStat;
    monthSales: PeriodStat;
    activeProductsCount: number;
    lowStockCount: number;
    lowStockProducts: LowStockProduct[];
    expiringSoon: ExpiringBatch[];
    trend: TrendPoint[];
}

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Dashboard({
    todaySales,
    monthSales,
    activeProductsCount,
    lowStockCount,
    lowStockProducts,
    expiringSoon,
    trend,
}: Props) {
    return (
        <>
            <Head title="Dashboard" />

            <div className="p-4 space-y-6">
                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                    <Button asChild>
                        <Link href="/pos">
                            <ShoppingCart className="size-4" />
                            New Sale
                        </Link>
                    </Button>
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
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Today's Sales</p>
                        <p className="text-2xl font-bold mt-1">{peso(todaySales.total)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{todaySales.count} transactions</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold mt-1">{peso(monthSales.total)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{monthSales.count} transactions</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Active Products</p>
                        <p className="text-2xl font-bold mt-1">{activeProductsCount}</p>
                    </div>
                    <Link href={products.index().url} className="border rounded-lg p-4 hover:bg-muted transition-colors">
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                        <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : ''}`}>
                            {lowStockCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {lowStockCount > 0 ? 'Needs attention' : 'All good'}
                        </p>
                    </Link>
                </div>

                {/* Alerts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Low stock table */}
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="size-4 text-red-500" />
                            Low Stock Products
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
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={stockBatches.create().url}>Restock</Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Expiring soon */}
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

                {/* 7-day trend */}
                <div className="border rounded-lg p-4">
                    <h2 className="text-sm font-medium mb-4">Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trend}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short' })}
                                fontSize={12}
                            />
                            <YAxis fontSize={12} tickFormatter={(v) => `₱${v}`} />
                            <Tooltip
                                labelFormatter={(d) => new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}
                                formatter={(value) => [peso(Number(value ?? 0)), 'Sales']}
                            />
                            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard().url },
    ],
};
