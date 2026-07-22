import { Head, router } from '@inertiajs/react';
import {
    Banknote,
    Building2,
    Receipt,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

export default function ProfitLoss({
    summary,
    startDate,
    endDate,
    isOwner,
    locations,
    selectedLocationId,
    branchBreakdown,
}: Props) {
    function updateFilters(updates: Record<string, string>) {
        router.get(
            '/reports/profit-loss',
            {
                start_date: startDate,
                end_date: endDate,
                location_id: selectedLocationId ?? '',
                ...updates,
            },
            { preserveState: true },
        );
    }

    const isProfitable = summary.net_profit >= 0;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Profit & Loss" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 sm:space-y-6 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <h1 className="text-xl font-semibold tracking-tight">
                        Profit &amp; Loss
                    </h1>

                    <div className="flex flex-wrap items-center gap-2">
                        <div>
                            <Label htmlFor="start_date" className="sr-only">
                                Start
                            </Label>
                            <Input
                                id="start_date"
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    updateFilters({
                                        start_date: e.target.value,
                                    })
                                }
                                className="focus-visible:ring-[var(--pos-teal)]"
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            to
                        </span>
                        <div>
                            <Label htmlFor="end_date" className="sr-only">
                                End
                            </Label>
                            <Input
                                id="end_date"
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    updateFilters({ end_date: e.target.value })
                                }
                                className="focus-visible:ring-[var(--pos-teal)]"
                            />
                        </div>

                        {isOwner && (
                            <Select
                                value={
                                    selectedLocationId
                                        ? String(selectedLocationId)
                                        : 'all'
                                }
                                onValueChange={(v) =>
                                    updateFilters({
                                        location_id: v === 'all' ? '' : v,
                                    })
                                }
                            >
                                <SelectTrigger className="w-[160px] focus:ring-[var(--pos-teal)]">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Branches
                                    </SelectItem>
                                    {locations.map((loc) => (
                                        <SelectItem
                                            key={loc.id}
                                            value={String(loc.id)}
                                        >
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>

                {/* Headline numbers — the three figures anyone opening this report
                    actually wants first, before the line-by-line breakdown. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                    <HeroStat
                        icon={<Banknote className="size-4" />}
                        label="Revenue"
                        value={summary.revenue}
                    />
                    <HeroStat
                        icon={<Receipt className="size-4" />}
                        label="Gross Profit"
                        value={summary.gross_profit}
                        subtitle={`${summary.gross_margin_pct}% margin`}
                    />
                    <HeroStat
                        icon={
                            isProfitable ? (
                                <TrendingUp className="size-4" />
                            ) : (
                                <TrendingDown className="size-4" />
                            )
                        }
                        label="Net Profit"
                        value={summary.net_profit}
                        subtitle={`${summary.net_margin_pct}% margin`}
                        tone={isProfitable ? 'positive' : 'negative'}
                        highlight
                    />
                </div>

                {/* Line-by-line breakdown */}
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <tbody>
                            <Row label="Revenue" value={summary.revenue} />
                            <Row
                                label="Cost of Goods Sold (COGS)"
                                value={-summary.cogs}
                                isDeduction
                            />
                            <Row
                                label="Gross Profit"
                                value={summary.gross_profit}
                                isBold
                                subtitle={`${summary.gross_margin_pct}% margin`}
                            />
                            <Row
                                label="Expenses"
                                value={-summary.expenses}
                                isDeduction
                            />
                            <Row
                                label="Net Profit"
                                value={summary.net_profit}
                                isBold
                                isFinal
                                subtitle={`${summary.net_margin_pct}% margin`}
                            />
                        </tbody>
                    </table>
                </div>

                {/* Branch comparison — Owner viewing "All Branches" */}
                {isOwner && branchBreakdown && (
                    <div className="rounded-xl border bg-card p-4 shadow-sm">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
                            <Building2 className="size-4 text-[var(--pos-teal)]" />
                            By Branch
                        </h2>

                        <div className="hidden overflow-hidden rounded-lg border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">
                                            Branch
                                        </th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">
                                            Revenue
                                        </th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">
                                            COGS
                                        </th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">
                                            Expenses
                                        </th>
                                        <th className="p-2.5 text-left font-medium text-muted-foreground">
                                            Net Profit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {branchBreakdown.map((b) => (
                                        <tr
                                            key={b.id}
                                            className="border-t transition-colors hover:bg-muted/30"
                                        >
                                            <td className="p-2.5 font-medium">
                                                {b.name}
                                            </td>
                                            <td className="p-2.5 font-mono tabular-nums">
                                                {peso(b.revenue)}
                                            </td>
                                            <td className="p-2.5 font-mono text-muted-foreground tabular-nums">
                                                {peso(b.cogs)}
                                            </td>
                                            <td className="p-2.5 font-mono text-muted-foreground tabular-nums">
                                                {peso(b.expenses)}
                                            </td>
                                            <td
                                                className={cn(
                                                    'p-2.5 font-mono font-medium tabular-nums',
                                                    b.net_profit >= 0
                                                        ? 'text-[var(--pos-green)]'
                                                        : 'text-red-600 dark:text-red-400',
                                                )}
                                            >
                                                {peso(b.net_profit)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                            {branchBreakdown.map((b) => (
                                <div
                                    key={b.id}
                                    className="rounded-lg border p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{b.name}</p>
                                        <p
                                            className={cn(
                                                'font-mono text-sm font-semibold tabular-nums',
                                                b.net_profit >= 0
                                                    ? 'text-[var(--pos-green)]'
                                                    : 'text-red-600 dark:text-red-400',
                                            )}
                                        >
                                            {peso(b.net_profit)}
                                        </p>
                                    </div>
                                    <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                                        <span>Revenue {peso(b.revenue)}</span>
                                        <span>COGS {peso(b.cogs)}</span>
                                        <span>Exp {peso(b.expenses)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function HeroStat({
    icon,
    label,
    value,
    subtitle,
    tone,
    highlight = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    subtitle?: string;
    tone?: 'positive' | 'negative';
    highlight?: boolean;
}) {
    return (
        <div
            className={cn(
                'rounded-xl border p-4 shadow-sm',
                highlight &&
                    tone === 'positive' &&
                    'bg-gradient-to-br from-[var(--pos-green)]/10 via-[var(--pos-green)]/5 to-transparent',
                highlight &&
                    tone === 'negative' &&
                    'bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent',
                !highlight && 'bg-card',
            )}
        >
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {icon}
                {label}
            </p>
            <p
                className={cn(
                    'mt-1 font-mono text-2xl font-bold tabular-nums',
                    tone === 'positive' && 'text-[var(--pos-green)]',
                    tone === 'negative' && 'text-red-600 dark:text-red-400',
                )}
            >
                {peso(value)}
            </p>
            {subtitle && (
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
        </div>
    );
}

function Row({
    label,
    value,
    isBold,
    isFinal,
    isDeduction,
    subtitle,
}: {
    label: string;
    value: number;
    isBold?: boolean;
    isFinal?: boolean;
    isDeduction?: boolean;
    subtitle?: string;
}) {
    return (
        <tr
            className={cn(
                'border-t first:border-t-0',
                isFinal && 'bg-muted/50',
            )}
        >
            <td className={cn('p-3', isBold && 'font-semibold')}>
                {label}
                {subtitle && (
                    <span className="ml-2 text-xs text-muted-foreground">
                        ({subtitle})
                    </span>
                )}
            </td>
            <td
                className={cn(
                    'p-3 text-right font-mono tabular-nums',
                    isBold && 'font-semibold',
                    (isDeduction || value < 0) &&
                        'text-red-600 dark:text-red-400',
                )}
            >
                {peso(value)}
            </td>
        </tr>
    );
}

ProfitLoss.layout = {
    breadcrumbs: [{ title: 'Profit & Loss', href: '/reports/profit-loss' }],
};
