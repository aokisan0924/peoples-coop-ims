import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Location {
    id: number;
    name: string;
}

interface Reconciliation {
    revenue: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
    gross_margin_pct: number;
    net_margin_pct: number;
    beginning_inventory: number | null;
    beginning_inventory_date: string | null;
    ending_inventory: number | null;
    ending_inventory_date: string | null;
    purchases: number | null;
    implied_cogs: number | null;
    shrinkage_variance: number | null;
    reconciliation_complete: boolean;
}

interface Props {
    reconciliation: Reconciliation;
    startDate: string;
    endDate: string;
    isOwner: boolean;
    locations: Location[];
    selectedLocationId: number | null;
}

function peso(n: number | null): string {
    if (n === null || n === undefined) {
return '—';
}

    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Reconciliation({
    reconciliation,
    startDate,
    endDate,
    isOwner,
    locations,
    selectedLocationId,
}: Props) {
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);
    const [locationId, setLocationId] = useState<number | null>(selectedLocationId);

    function applyFilters() {
        router.get('/reports/reconciliation', {
            start_date: start,
            end_date: end,
            ...(isOwner && locationId ? { location_id: locationId } : {}),
        });
    }

    const r = reconciliation;
    const hasVariance = r.shrinkage_variance !== null && Math.abs(r.shrinkage_variance) >= 1;

    return (
        <>
            <Head title="Inventory Reconciliation" />

            <div className="p-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Inventory Reconciliation</h1>
                    <Button variant="outline" asChild>
                        <Link href="/reports/profit-loss">View Profit &amp; Loss</Link>
                    </Button>
                </div>

                <div className="flex flex-wrap items-end gap-3 border rounded-lg p-3">
                    <div>
                        <Label htmlFor="start_date">From</Label>
                        <Input id="start_date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                    </div>
                    <div>
                        <Label htmlFor="end_date">To</Label>
                        <Input id="end_date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                    </div>
                    {isOwner && (
                        <div>
                            <Label htmlFor="location_id">Branch</Label>
                            <Select
                                value={locationId ? String(locationId) : 'all'}
                                onValueChange={(v) => setLocationId(v === 'all' ? null : Number(v))}
                            >
                                <SelectTrigger id="location_id" className="w-48">
                                    <SelectValue placeholder="All branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All branches</SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={String(loc.id)}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button onClick={applyFilters}>Apply</Button>
                </div>

                {!r.reconciliation_complete && (
                    <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 text-sm">
                        <p className="font-medium mb-1">Reconciliation incomplete</p>
                        <p className="text-muted-foreground">
                            This needs a finalized physical inventory count before {start}, and another
                            on or before {end}, to establish Beginning and Ending Inventory values. The
                            figures below for Revenue, actual COGS, and Expenses are still accurate on
                            their own — only the periodic cross-check and shrinkage variance need both counts.
                        </p>
                        <Button size="sm" className="mt-3" asChild>
                            <Link href="/inventory-counts/create">Start an Inventory Count</Link>
                        </Button>
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Beginning Inventory</p>
                        <p className="text-lg font-semibold">{peso(r.beginning_inventory)}</p>
                        {r.beginning_inventory_date && (
                            <p className="text-xs text-muted-foreground mt-1">as of {r.beginning_inventory_date}</p>
                        )}
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Purchases</p>
                        <p className="text-lg font-semibold">{peso(r.purchases)}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Ending Inventory</p>
                        <p className="text-lg font-semibold">{peso(r.ending_inventory)}</p>
                        {r.ending_inventory_date && (
                            <p className="text-xs text-muted-foreground mt-1">as of {r.ending_inventory_date}</p>
                        )}
                    </div>
                    <div className="border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground">Implied COGS (periodic)</p>
                        <p className="text-lg font-semibold">{peso(r.implied_cogs)}</p>
                    </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <tbody>
                            <tr className="border-b">
                                <td className="p-3">Revenue</td>
                                <td className="p-3 text-right font-medium">{peso(r.revenue)}</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-3">COGS (actual, from sales)</td>
                                <td className="p-3 text-right font-medium">{peso(r.cogs)}</td>
                            </tr>
                            <tr className="border-b bg-muted/40">
                                <td className="p-3">Gross Profit</td>
                                <td className="p-3 text-right font-medium">
                                    {peso(r.gross_profit)} ({r.gross_margin_pct}%)
                                </td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-3">Expenses</td>
                                <td className="p-3 text-right font-medium">{peso(r.expenses)}</td>
                            </tr>
                            {hasVariance && (
                                <tr className="border-b">
                                    <td className="p-3">
                                        Shrinkage variance
                                        <Badge variant="destructive" className="ml-2">Unexplained loss</Badge>
                                    </td>
                                    <td className="p-3 text-right font-medium text-red-600">
                                        {peso(r.shrinkage_variance)}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-muted/60">
                                <td className="p-3 font-semibold">Net Profit</td>
                                <td className="p-3 text-right font-semibold">
                                    {peso(r.net_profit)} ({r.net_margin_pct}%)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {hasVariance && (
                    <p className="text-xs text-muted-foreground">
                        The shrinkage variance is the gap between what the periodic formula (Beginning +
                        Purchases − Ending) implies should have left inventory, and what your sales actually
                        recorded as COGS. A positive number means more inventory disappeared than sales
                        account for — likely theft, damage, spoilage, or a miscount. It is not yet folded into
                        Net Profit above; investigate it, then record it as an Expense once confirmed so future
                        reports reflect it.
                    </p>
                )}
            </div>
        </>
    );
}

Reconciliation.layout = {
    breadcrumbs: [
        { title: 'Reports', href: '/reports/profit-loss' },
        { title: 'Inventory Reconciliation', href: '/reports/reconciliation' },
    ],
};
