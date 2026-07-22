import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import gcash from '@/routes/gcash';

interface Props {
    type: 'cash_in' | 'cash_out';
    onSuccess: () => void;
}

export default function GcashTransactionForm({ type, onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type,
        amount: '',
        fee: '',
        customer_name: '',
        reference_number: '',
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(gcash.store().url, {
            onSuccess: () => {
                reset();
                onSuccess();
            },
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {(errors as Record<string, string>).shift && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                    {(errors as Record<string, string>).shift}
                </p>
            )}

            <div>
                <Label htmlFor="amount">
                    Amount (₱) —{' '}
                    {type === 'cash_in'
                        ? 'GCash sent to customer'
                        : 'GCash received from customer'}{' '}
                    *
                </Label>
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    autoFocus
                />
                {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
            </div>

            <div>
                <Label htmlFor="fee">Service Fee Collected (₱)</Label>
                <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.fee}
                    onChange={(e) => setData('fee', e.target.value)}
                    placeholder="0.00"
                />
                {errors.fee && (
                    <p className="mt-1 text-sm text-red-600">{errors.fee}</p>
                )}
            </div>

            <div>
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                    id="customer_name"
                    value={data.customer_name}
                    onChange={(e) => setData('customer_name', e.target.value)}
                    placeholder="Optional"
                />
            </div>

            <div>
                <Label htmlFor="reference_number">GCash Reference Number</Label>
                <Input
                    id="reference_number"
                    value={data.reference_number}
                    onChange={(e) =>
                        setData('reference_number', e.target.value)
                    }
                    placeholder="From the GCash app"
                />
            </div>

            <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                    id="notes"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Optional"
                />
            </div>

            {errors.amount === undefined && (errors as any).message && (
                <p className="text-sm text-red-600">
                    {(errors as any).message}
                </p>
            )}

            <Button type="submit" disabled={processing} className="w-full">
                {processing
                    ? 'Recording...'
                    : `Record ${type === 'cash_in' ? 'Cash-In' : 'Cash-Out'}`}
            </Button>
        </form>
    );
}
