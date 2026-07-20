import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Shift {
    id: number;
    starting_cash: string;
    expected_cash: string;
    actual_cash: string;
    variance: string;
    opened_at: string;
    closed_at: string;
    notes: string | null;
    cashier: { name: string };
    location: { name: string };
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ShiftSummary({ shift }: { shift: Shift }) {
    const variance = parseFloat(shift.variance);
    const isBalanced = variance === 0;
    const isShort = variance < 0;

    return (
        <>
            <Head title="Shift Summary" />

            <div className="p-4 flex flex-col items-center">
                <div className="w-full max-w-sm border rounded-lg p-6 text-center">
                    <h1 className="text-xl font-semibold mb-4">Shift Closed</h1>

                    <div className="space-y-2 text-left text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Starting Cash</span>
                            <span>{peso(shift.starting_cash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Expected Cash</span>
                            <span>{peso(shift.expected_cash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Actual Counted</span>
                            <span>{peso(shift.actual_cash)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Variance</span>
                            <span className={isBalanced ? 'text-green-600' : 'text-red-600'}>
                                {variance > 0 ? '+' : ''}{peso(variance)}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        {isBalanced ? (
                            <Badge className="bg-green-600">Balanced ✓</Badge>
                        ) : isShort ? (
                            <Badge variant="destructive">Short by {peso(Math.abs(variance))}</Badge>
                        ) : (
                            <Badge className="bg-amber-500">Over by {peso(variance)}</Badge>
                        )}
                    </div>

                    {shift.notes && (
                        <p className="text-sm text-muted-foreground mt-4 text-left border-t pt-3">
                            {shift.notes}
                        </p>
                    )}
                </div>

                <Button asChild className="mt-4">
                    <Link href="/pos">← Back to POS</Link>
                </Button>
            </div>
        </>
    );
}

ShiftSummary.layout = {
    breadcrumbs: [{ title: 'Shift Summary', href: '#' }],
};
