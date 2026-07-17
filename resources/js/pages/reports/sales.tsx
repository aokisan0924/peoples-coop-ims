import { Head } from '@inertiajs/react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface PeriodSummary {
    total: number;
    count: number;
}

interface TrendPoint {
    date: string;
    total: number;
    transaction_count: number;
}

interface PaymentBreakdown {
    payment_method: 'cash' | 'gcash';
    total: string;
    count: number;
}

interface CashierBreakdown {
    name: string;
    total: string;
    count: number;
}

interface BestSeller {
    name: string;
    units_sold: number;
    revenue: string;
}

interface Props {
    summary: {
        today: PeriodSummary;
        week: PeriodSummary;
        month: PeriodSummary;
        year: PeriodSummary;
    };
    trend: TrendPoint[];
    paymentBreakdown: PaymentBreakdown[];
    cashierBreakdown: CashierBreakdown[];
    bestSellers: BestSeller[];
}

function peso(n: number | string): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SalesReports({ summary, trend, paymentBreakdown, cashierBreakdown, bestSellers }: Props) {
    return (
        <>
            <Head title="Sales Reports" />

            <div className="p-4 space-y-6">
                <h1 className="text-xl font-semibold">Sales Reports</h1>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard label="Today" data={summary.today} />
                    <SummaryCard label="This Week" data={summary.week} />
                    <SummaryCard label="This Month" data={summary.month} />
                    <SummaryCard label="This Year" data={summary.year} />
                </div>

                {/* Trend chart */}
                <div className="border rounded-lg p-4">
                    <h2 className="text-sm font-medium mb-4">Last 30 Days</h2>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trend}>
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
                            <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Payment method breakdown */}
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">Payment Methods (This Month)</h2>
                        <div className="space-y-2">
                            {paymentBreakdown.length === 0 && (
                                <p className="text-sm text-muted-foreground">No sales yet this month.</p>
                            )}
                            {paymentBreakdown.map((p) => (
                                <div key={p.payment_method} className="flex justify-between text-sm">
                                    <span className="capitalize">{p.payment_method} ({p.count})</span>
                                    <span className="font-medium">{peso(p.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cashier breakdown */}
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">By Cashier (This Month)</h2>
                        <div className="space-y-2">
                            {cashierBreakdown.length === 0 && (
                                <p className="text-sm text-muted-foreground">No sales yet this month.</p>
                            )}
                            {cashierBreakdown.map((c) => (
                                <div key={c.name} className="flex justify-between text-sm">
                                    <span>{c.name} ({c.count})</span>
                                    <span className="font-medium">{peso(c.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Best sellers */}
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">Best Sellers (This Month)</h2>
                        <div className="space-y-2">
                            {bestSellers.length === 0 && (
                                <p className="text-sm text-muted-foreground">No sales yet this month.</p>
                            )}
                            {bestSellers.map((b) => (
                                <div key={b.name} className="flex justify-between text-sm">
                                    <span className="truncate mr-2">{b.name} ({b.units_sold})</span>
                                    <span className="font-medium whitespace-nowrap">{peso(b.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function SummaryCard({ label, data }: { label: string; data: PeriodSummary }) {
    return (
        <div className="border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{peso(data.total)}</p>
            <p className="text-xs text-muted-foreground mt-1">{data.count} transaction{data.count !== 1 ? 's' : ''}</p>
        </div>
    );
}

SalesReports.layout = {
    breadcrumbs: [
        { title: 'Sales Reports', href: '/reports/sales' },
    ],
};