import { useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    currentBalance: number;
    onSuccess: () => void;
}

export default function FloatAdjustmentForm({ currentBalance, onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        new_balance: String(currentBalance),
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/gcash/adjust-float', {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Current system float: <span className="font-semibold">₱{currentBalance.toFixed(2)}</span>
            </p>

            <div>
                <Label htmlFor="new_balance">Actual GCash App Balance (₱) *</Label>
                <Input
                    id="new_balance"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.new_balance}
                    onChange={(e) => setData('new_balance', e.target.value)}
                    autoFocus
                />
                {errors.new_balance && <p className="text-sm text-red-600 mt-1">{errors.new_balance}</p>}
            </div>

            <div>
                <Label htmlFor="notes">Reason for Adjustment *</Label>
                <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="e.g. Loaded additional funds, corrected drift from miscount"
                />
                {errors.notes && <p className="text-sm text-red-600 mt-1">{errors.notes}</p>}
            </div>

            <Button type="submit" disabled={processing} className="w-full">
                {processing ? 'Saving...' : 'Confirm Reconciliation'}
            </Button>
        </form>
    );
}
