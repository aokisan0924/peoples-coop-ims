import { Head, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Summary {
    revenue: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
}

interface BranchRow extends Summary {
    id: number;
    name: string;
}

interface Location {
    id: number;
    name: string;
}

interface Props {
    summary: Summary;
    startDate: string;
    endDate: string;
    isOwner: boolean;
    locations: Location[];
    selectedLocationId: number | null;
    branchBreakdown: BranchRow[] | null;
}

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ProfitLoss({ summary, startDate, endDate, isOwner, locations, selectedLocationId, branchBreakdown }: Props) {
    function updateFilters(updates: Record<string, string>) {
        router.get('/reports/profit-loss', {
            start_date: startDate,
            end_date: endDate,
            location_id: selectedLocationId ?? '',
            ...updates,
        }, { preserveState: true });
    }

    return (
        <>
            <Head title="Profit & Loss" />

            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <h1 className="text-xl font-semibold">Profit &amp; Loss</h1>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div>
                            <Label htmlFor="start_date" className="sr-only">Start</Label>
                            <Input id="start_date" type="date" value={startDate} onChange={(e) => updateFilters({ start_date: e.target.value })} />
                        </div>
                        <span className="text-sm text-muted-foreground">to</span>
                        <div>
                            <Label htmlFor="end_date" className="sr-only">End</Label>
                            <Input id="end_date" type="date" value={endDate} onChange={(e) => updateFilters({ end_date: e.target.value })} />
                        </div>

                        {isOwner && (
                            <Select
                                value={selectedLocationId ? String(selectedLocationId) : 'all'}
                                onValueChange={(v) => updateFilters({ location_id: v === 'all' ? '' : v })}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Summary */}
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody>
                            <Row label="Revenue" value={summary.revenue} />
                            <Row label="Cost of Goods Sold (COGS)" value={-summary.cogs} isDeduction />
                            <Row label="Gross Profit" value={summary.gross_profit} isBold subtitle={`${summary.gross_margin_pct}% margin`} />
                            <Row label="Expenses" value={-summary.expenses} isDeduction />
                            <Row label="Net Profit" value={summary.net_profit} isBold isFinal subtitle={`${summary.net_margin_pct}% margin`} />
                        </tbody>
                    </table>
                </div>

                {/* Branch comparison — Owner viewing "All Branches" */}
                {isOwner && branchBreakdown && (
                    <div className="border rounded-lg p-4">
                        <h2 className="text-sm font-medium mb-3">By Branch</h2>
                        <table className="w-full text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="text-left p-2">Branch</th>
                                    <th className="text-left p-2">Revenue</th>
                                    <th className="text-left p-2">COGS</th>
                                    <th className="text-left p-2">Expenses</th>
                                    <th className="text-left p-2">Net Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branchBreakdown.map((b) => (
                                    <tr key={b.id} className="border-t">
                                        <td className="p-2 font-medium">{b.name}</td>
                                        <td className="p-2">{peso(b.revenue)}</td>
                                        <td className="p-2">{peso(b.cogs)}</td>
                                        <td className="p-2">{peso(b.expenses)}</td>
                                        <td className={`p-2 font-medium ${b.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {peso(b.net_profit)}
                                        </td>
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

function Row({ label, value, isBold, isFinal, isDeduction, subtitle }: { label: string; value: number; isBold?: boolean; isFinal?: boolean; isDeduction?: boolean; subtitle?: string }) {
    return (
        <tr className={`border-t ${isFinal ? 'bg-muted/50' : ''}`}>
            <td className={`p-3 ${isBold ? 'font-semibold' : ''}`}>
                {label}
                {subtitle && <span className="text-xs text-muted-foreground ml-2">({subtitle})</span>}
            </td>
            <td className={`p-3 text-right ${isBold ? 'font-semibold' : ''} ${isDeduction ? 'text-red-600' : value < 0 ? 'text-red-600' : ''}`}>
                {peso(value)}
            </td>
        </tr>
    );
}

ProfitLoss.layout = {
    breadcrumbs: [{ title: 'Profit & Loss', href: '/reports/profit-loss' }],
};
