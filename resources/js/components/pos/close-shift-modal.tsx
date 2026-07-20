import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ShiftSession } from '@/hooks/use-current-shift';
import { cn } from '@/lib/utils';

interface Props {
    shift: ShiftSession;
    onClose: () => void;
    onClosed: () => void;
}

// ₱20 covers both the bill and the coin currently in circulation — they share
// a face value, so one counting row for both is simpler and just as accurate.
const DENOMINATIONS = [
    { value: 1000, kind: 'bill' as const },
    { value: 500, kind: 'bill' as const },
    { value: 200, kind: 'bill' as const },
    { value: 100, kind: 'bill' as const },
    { value: 50, kind: 'bill' as const },
    { value: 20, kind: 'bill/coin' as const },
    { value: 10, kind: 'coin' as const },
    { value: 5, kind: 'coin' as const },
    { value: 1, kind: 'coin' as const },
];

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CloseShiftModal({ shift, onClose, onClosed }: Props) {
    // Keyed by denomination value, stored as raw text so the field can be
    // freely cleared/edited without a controlled-input fight over "0".
    const [counts, setCounts] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    function countFor(value: number): number {
        const n = parseInt(counts[value] ?? '', 10);
        return Number.isFinite(n) && n > 0 ? n : 0;
    }

    const breakdown = useMemo(
        () => DENOMINATIONS.map((d) => ({ denomination: d.value, count: countFor(d.value) })),
        [counts],
    );

    const totalCounted = useMemo(
        () => breakdown.reduce((sum, row) => sum + row.denomination * row.count, 0),
        [breakdown],
    );

    const hasAnyCount = breakdown.some((row) => row.count > 0);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setError('');

        router.post(
            `/shift/${shift.id}/close`,
            { breakdown, notes },
            {
                onSuccess: () => {
                    onClosed();
                },
                onError: (errors) => {
                    setError((Object.values(errors)[0] as string) ?? 'Failed to close shift.');
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg border bg-background">
                <div className="border-b p-4 sm:p-6 sm:pb-4">
                    <h2 className="text-lg font-semibold">Close Shift</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Count each denomination separately — the total is added up for you, so a miscount
                        shows up in the right row instead of hiding inside one typed number.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 space-y-1 overflow-y-auto p-4 sm:p-6 sm:py-4">
                        {DENOMINATIONS.map((d) => {
                            const count = countFor(d.value);
                            const subtotal = d.value * count;
                            return (
                                <div key={d.value} className="flex items-center gap-3 py-1.5">
                                    <span className="w-16 shrink-0 font-mono text-sm font-medium tabular-nums">
                                        ₱{d.value}
                                    </span>
                                    <span className="w-8 shrink-0 text-center text-muted-foreground">×</span>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min="0"
                                        step="1"
                                        value={counts[d.value] ?? ''}
                                        onChange={(e) =>
                                            setCounts((prev) => ({ ...prev, [d.value]: e.target.value }))
                                        }
                                        placeholder="0"
                                        className="w-16 shrink-0 rounded-md border bg-background px-2 py-1.5 text-center text-sm tabular-nums"
                                    />
                                    <span className="flex-1 text-right font-mono text-sm tabular-nums text-muted-foreground">
                                        {subtotal > 0 ? peso(subtotal) : '—'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t p-4 sm:p-6 sm:pt-4">
                        <div className="mb-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
                            <span className="text-sm font-medium">Total Counted</span>
                            <span className="font-mono text-xl font-bold tabular-nums">{peso(totalCounted)}</span>
                        </div>

                        <div className="mb-3">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Explanation for any shortage/overage"
                                rows={2}
                            />
                        </div>

                        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                disabled={processing || !hasAnyCount}
                                className={cn('flex-1')}
                            >
                                {processing ? 'Closing…' : `Close Shift · ${peso(totalCounted)}`}
                            </Button>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
