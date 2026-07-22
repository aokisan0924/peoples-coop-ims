import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OpenShiftGate({ onOpened }: { onOpened: () => void }) {
    const [startingCash, setStartingCash] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        setError('');

        router.post(
            '/shift/open',
            { starting_cash: startingCash },
            {
                onSuccess: () => {
                    onOpened();
                },
                onError: (errors) => {
                    setError(
                        (Object.values(errors)[0] as string) ??
                            'Failed to open shift.',
                    );
                    setProcessing(false);
                },
            },
        );
    }

    return (
        <div className="flex h-full items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg border p-6 text-center">
                <h1 className="mb-2 text-xl font-semibold">Start Your Shift</h1>
                <p className="mb-6 text-sm text-muted-foreground">
                    Count the cash currently in your drawer before you begin
                    selling.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                    <div>
                        <Label htmlFor="starting_cash">Starting Cash (₱)</Label>
                        <Input
                            id="starting_cash"
                            type="number"
                            step="0.01"
                            min="0"
                            value={startingCash}
                            onChange={(e) => setStartingCash(e.target.value)}
                            autoFocus
                            placeholder="0.00"
                        />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing || !startingCash}
                    >
                        {processing ? 'Starting...' : 'Start Shift'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
