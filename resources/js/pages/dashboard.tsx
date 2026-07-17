import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, PackagePlus, PlusCircle, AlertTriangle, LineChart } from 'lucide-react';
import { dashboard } from '@/routes';
import products from '@/routes/products';
import stockBatches from '@/routes/stock-batches';
import reports from '@/routes/reports';
import { useAuth } from '@/hooks/use-auth';

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

interface Props {
    todaySales: PeriodStat;
    monthSales: PeriodStat;
    activeProductsCount: number;
    lowStockCount: number;
    lowStockProducts: LowStockProduct[];
    expiringSoon: ExpiringBatch[];
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
}: Props) {
    const { isManager } = useAuth();

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
                    {isManager && (
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

                {/* Summary cards — today's snapshot at a glance; deeper history lives in Reports */}
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
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                        <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-red-600' : ''}`}>
                            {lowStockCount}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {lowStockCount > 0 ? 'Needs attention' : 'All good'}
                        </p>
                    </div>
                </div>

                {/* Alerts — things that need action today */}
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
                                            {isManager && (
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

                {/* Trend charts, payment mix, cashier & best-seller breakdowns all live in
                    Reports now — the dashboard stays focused on "what needs attention today". */}
                {isManager && (
                    <Link
                        href={reports.sales().url}
                        className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted transition-colors text-sm"
                    >
                        <span className="flex items-center gap-2 font-medium">
                            <LineChart className="size-4" />
                            View full sales report
                        </span>
                        <span className="text-muted-foreground">Trends, payment mix, top sellers →</span>
                    </Link>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard().url }],
};
