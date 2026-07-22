import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CalendarClock,
    Pause,
    Play,
    Plus,
    Repeat,
    Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Template {
    id: number;
    category: string;
    description: string | null;
    estimated_amount: string;
    day_of_month: number;
    is_active: boolean;
    location: { name: string };
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ordinal(n: number): string {
    if (n >= 11 && n <= 13) {
        return `${n}th`;
    }

    switch (n % 10) {
        case 1:
            return `${n}st`;
        case 2:
            return `${n}nd`;
        case 3:
            return `${n}rd`;
        default:
            return `${n}th`;
    }
}

export default function RecurringExpensesIndex({
    templates,
    pendingThisMonth,
}: {
    templates: Template[];
    pendingThisMonth: Template[];
}) {
    function toggle(template: Template) {
        router.post(
            `/recurring-expenses/${template.id}/toggle`,
            {},
            { preserveScroll: true },
        );
    }

    function remove(template: Template) {
        if (
            confirm(
                `Stop tracking "${template.category}" as a recurring bill? Past bills already logged from it are unaffected.`,
            )
        ) {
            router.delete(`/recurring-expenses/${template.id}`, {
                preserveScroll: true,
            });
        }
    }

    function generateNow() {
        router.post(
            '/recurring-expenses/generate',
            {},
            { preserveScroll: true },
        );
    }

    const isEmpty = templates.length === 0;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Recurring Bills" />

            <div className="mx-auto max-w-[1600px] space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                            <Repeat className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                Recurring Bills
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Rent, electricity, water, internet — set once,
                                get reminded every month.
                            </p>
                        </div>
                    </div>
                    <Button
                        asChild
                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    >
                        <Link href="/recurring-expenses/create">
                            <Plus className="size-4" />
                            Add Recurring Bill
                        </Link>
                    </Button>
                </div>

                {/* Pending this month */}
                {pendingThisMonth.length > 0 && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 sm:p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                                    {pendingThisMonth.length} bill
                                    {pendingThisMonth.length > 1 ? 's' : ''} not
                                    logged yet this month
                                </p>
                                <ul className="mt-1.5 space-y-1 text-sm text-amber-800 dark:text-amber-400/90">
                                    {pendingThisMonth.map((t) => (
                                        <li
                                            key={t.id}
                                            className="flex flex-wrap items-baseline gap-x-1.5"
                                        >
                                            <span className="font-medium">
                                                {t.category}
                                            </span>
                                            <span className="font-mono tabular-nums">
                                                {peso(t.estimated_amount)}
                                            </span>
                                            <span>
                                                · due the{' '}
                                                {ordinal(t.day_of_month)} ·{' '}
                                                {t.location.name}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    size="sm"
                                    onClick={generateNow}
                                    className="mt-3 bg-amber-600 text-white hover:bg-amber-700"
                                >
                                    Generate this month's bills
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Templates */}
                {isEmpty ? (
                    <EmptyState />
                ) : (
                    <>
                        {/* Table on larger screens; stacked cards on mobile — seven columns
                            of financial data don't survive being squeezed onto a phone. */}
                        <div className="hidden overflow-hidden rounded-xl border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Category
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Description
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Branch
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Est. Amount
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Due Day
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
                                    {templates.map((t) => (
                                        <tr
                                            key={t.id}
                                            className={cn(
                                                'border-t transition-colors hover:bg-muted/30',
                                                !t.is_active && 'opacity-60',
                                            )}
                                        >
                                            <td className="p-3 font-medium">
                                                {t.category}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {t.description ?? '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="size-3.5" />
                                                    {t.location.name}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono tabular-nums">
                                                {peso(t.estimated_amount)}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {ordinal(t.day_of_month)} of the
                                                month
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge
                                                    active={t.is_active}
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            toggle(t)
                                                        }
                                                        className="gap-1.5"
                                                    >
                                                        {t.is_active ? (
                                                            <Pause className="size-3.5" />
                                                        ) : (
                                                            <Play className="size-3.5" />
                                                        )}
                                                        {t.is_active
                                                            ? 'Pause'
                                                            : 'Resume'}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            remove(t)
                                                        }
                                                        className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                        aria-label={`Remove ${t.category}`}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                            {templates.map((t) => (
                                <div
                                    key={t.id}
                                    className={cn(
                                        'rounded-xl border bg-card p-3 shadow-sm',
                                        !t.is_active && 'opacity-60',
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {t.category}
                                            </p>
                                            {t.description && (
                                                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                                    {t.description}
                                                </p>
                                            )}
                                        </div>
                                        <StatusBadge active={t.is_active} />
                                    </div>

                                    <div className="mt-2.5 space-y-1 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-1.5">
                                            <Building2 className="size-3.5 shrink-0" />
                                            {t.location.name}
                                        </p>
                                        <p className="flex items-center gap-1.5">
                                            <CalendarClock className="size-3.5 shrink-0" />
                                            Due the {ordinal(t.day_of_month)} ·{' '}
                                            <span className="font-mono tabular-nums">
                                                {peso(t.estimated_amount)}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="mt-3 flex gap-2 border-t pt-2.5">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggle(t)}
                                            className="flex-1 gap-1.5"
                                        >
                                            {t.is_active ? (
                                                <Pause className="size-3.5" />
                                            ) : (
                                                <Play className="size-3.5" />
                                            )}
                                            {t.is_active ? 'Pause' : 'Resume'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => remove(t)}
                                            className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                            aria-label={`Remove ${t.category}`}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {!isEmpty && (
                <Button
                    asChild
                    size="icon"
                    className="fixed right-4 bottom-4 z-20 size-12 rounded-full bg-[var(--pos-teal)] text-white shadow-lg shadow-black/20 hover:bg-[var(--pos-teal)]/90 sm:hidden"
                >
                    <Link
                        href="/recurring-expenses/create"
                        aria-label="Add Recurring Bill"
                    >
                        <Plus className="size-5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
            Active
        </Badge>
    ) : (
        <Badge variant="secondary" className="font-normal">
            Paused
        </Badge>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Repeat className="size-7" />
            </div>
            <p className="text-sm font-medium">No recurring bills yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Set up rent, utilities, or anything else that bills you monthly
                — you'll get a reminder instead of re-entering it from scratch.
            </p>
            <Button
                asChild
                size="sm"
                className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
            >
                <Link href="/recurring-expenses/create">
                    <Plus className="size-4" />
                    Add Recurring Bill
                </Link>
            </Button>
        </div>
    );
}

RecurringExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Recurring Bills', href: '/recurring-expenses' }],
};
