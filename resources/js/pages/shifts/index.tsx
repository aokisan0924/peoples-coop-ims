import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';

interface Shift {
    id: number;
    starting_cash: string;
    expected_cash: string | null;
    actual_cash: string | null;
    variance: string | null;
    status: 'open' | 'closed';
    opened_at: string;
    closed_at: string | null;
    cashier: { name: string };
    location: { name: string };
}

function peso(n: string | number | null): string {
    if (n === null) {
        return '—';
    }

    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShiftsIndex({ shifts }: { shifts: Shift[] }) {
    return (
        <>
            <Head title="Shift History" />

            <div className="p-4">
                <h1 className="mb-4 text-xl font-semibold">Shift History</h1>

                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-3 text-left">Cashier</th>
                                <th className="p-3 text-left">Branch</th>
                                <th className="p-3 text-left">Opened</th>
                                <th className="p-3 text-left">Closed</th>
                                <th className="p-3 text-left">Expected</th>
                                <th className="p-3 text-left">Actual</th>
                                <th className="p-3 text-left">Variance</th>
                                <th className="p-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shifts.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="p-4 text-center text-muted-foreground"
                                    >
                                        No shifts recorded yet.
                                    </td>
                                </tr>
                            )}
                            {shifts.map((s) => {
                                const variance = s.variance
                                    ? parseFloat(s.variance)
                                    : null;

                                return (
                                    <tr key={s.id} className="border-t">
                                        <td className="p-3">
                                            {s.cashier.name}
                                        </td>
                                        <td className="p-3">
                                            {s.location.name}
                                        </td>
                                        <td className="p-3 text-xs">
                                            {new Date(
                                                s.opened_at,
                                            ).toLocaleString()}
                                        </td>
                                        <td className="p-3 text-xs">
                                            {s.closed_at
                                                ? new Date(
                                                      s.closed_at,
                                                  ).toLocaleString()
                                                : '—'}
                                        </td>
                                        <td className="p-3">
                                            {peso(s.expected_cash)}
                                        </td>
                                        <td className="p-3">
                                            {peso(s.actual_cash)}
                                        </td>
                                        <td className="p-3">
                                            {variance === null ? (
                                                '—'
                                            ) : (
                                                <span
                                                    className={
                                                        variance === 0
                                                            ? 'text-green-600'
                                                            : variance < 0
                                                              ? 'text-red-600'
                                                              : 'text-amber-500'
                                                    }
                                                >
                                                    {variance > 0 ? '+' : ''}
                                                    {peso(variance)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {s.status === 'open' ? (
                                                <Badge variant="secondary">
                                                    Open
                                                </Badge>
                                            ) : variance === 0 ? (
                                                <Badge className="bg-green-600">
                                                    Balanced
                                                </Badge>
                                            ) : (
                                                <Badge variant="destructive">
                                                    Discrepancy
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

ShiftsIndex.layout = {
    breadcrumbs: [{ title: 'Shift History', href: '/shifts' }],
};
