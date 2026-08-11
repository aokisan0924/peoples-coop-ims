import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import gcash from '@/routes/gcash';

interface Props {
    type: 'cash_in' | 'cash_out' | 'capital_deposit';
    onSuccess: () => void;
}

const TYPE_LABELS: Record<Props['type'], string> = {
    cash_in: 'Cash-In',
    cash_out: 'Cash-Out',
    capital_deposit: 'Capital Deposit',
};

export default function GcashTransactionForm({ type, onSuccess }: Props) {
    const isDeposit = type === 'capital_deposit';

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
                    {type === 'cash_in' && 'GCash sent to customer'}
                    {type === 'cash_out' && 'GCash received from customer'}
                    {isDeposit && 'Capital deposited into the float'} *
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

            {/* A capital deposit isn't a customer transaction — no service fee applies. */}
            {!isDeposit && (
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
            )}

            <div>
                <Label htmlFor="customer_name">
                    {isDeposit ? 'Source of Funds' : 'Customer Name'}
                </Label>
                <Input
                    id="customer_name"
                    value={data.customer_name}
                    onChange={(e) => setData('customer_name', e.target.value)}
                    placeholder={
                        isDeposit
                            ? 'e.g. Owner deposit, Bank transfer — BDO'
                            : 'Optional'
                    }
                />
            </div>

            <div>
                <Label htmlFor="reference_number">
                    {isDeposit
                        ? 'Bank / Transfer Reference Number'
                        : 'GCash Reference Number'}
                </Label>
                <Input
                    id="reference_number"
                    value={data.reference_number}
                    onChange={(e) =>
                        setData('reference_number', e.target.value)
                    }
                    placeholder={
                        isDeposit ? 'Optional' : 'From the GCash app'
                    }
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
                {processing ? 'Recording...' : `Record ${TYPE_LABELS[type]}`}
            </Button>
        </form>
    );
}
