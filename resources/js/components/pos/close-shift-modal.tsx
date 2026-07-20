import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ShiftSession } from '@/hooks/use-current-shift';

interface Props {
    shift: ShiftSession;
    onClose: () => void;
    onClosed: () => void;
}

export default function CloseShiftModal({ shift, onClose, onClosed }: Props) {
    const [actualCash, setActualCash] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setError('');

        router.post(
            `/shift/${shift.id}/close`,
            { actual_cash: actualCash, notes },
            {
                onSuccess: () => {
                    onClosed();
                },
                onError: (errors) => {
                    setError(Object.values(errors)[0] as string ?? 'Failed to close shift.');
                    setProcessing(false);
                },
            }
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border rounded-lg p-6 w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-2">Close Shift</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Count all cash in your drawer now, including your starting float.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="actual_cash">Actual Cash Counted (₱) *</Label>
                        <Input
                            id="actual_cash"
                            type="number"
                            step="0.01"
                            min="0"
                            value={actualCash}
                            onChange={(e) => setActualCash(e.target.value)}
                            autoFocus
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Explanation for any shortage/overage"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing || !actualCash}>
                            {processing ? 'Closing...' : 'Close Shift'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
