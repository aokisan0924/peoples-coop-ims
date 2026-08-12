import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, Info } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Location {
    id: number;
    name: string;
}

interface Props {
    locations: Location[];
    isOwner: boolean;
}

function toDateInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

export default function CreateInventoryCount({ locations, isOwner }: Props) {
    const { today, yesterday } = useMemo(() => {
        const now = new Date();

        return {
            today: toDateInput(now),
            yesterday: toDateInput(new Date(now.getTime() - 86400000)),
        };
    }, []);

    const { data, setData, post, processing, errors } = useForm({
        location_id: null as number | null,
        count_date: today,
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/inventory-counts');
    }

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Start Inventory Count" />

            <div className="mx-auto max-w-5xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="size-9 shrink-0">
                        <Link href="/inventory-counts">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <ClipboardCheck className="size-4" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight">Start Inventory Count</h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Physically count what's on the shelf and compare it against system stock.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
                            <div className="space-y-4">
                                {isOwner && (
                                    <div>
                                        <Label htmlFor="location_id">Branch *</Label>
                                        <Select
                                            value={data.location_id ? String(data.location_id) : ''}
                                            onValueChange={(v) => setData('location_id', Number(v))}
                                        >
                                            <SelectTrigger id="location_id">
                                                <SelectValue placeholder="Select branch" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {locations.map((loc) => (
                                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                                        {loc.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.location_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.location_id}</p>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <Label htmlFor="count_date">Count Date *</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="count_date"
                                            type="date"
                                            value={data.count_date}
                                            onChange={(e) => setData('count_date', e.target.value)}
                                            className="max-w-[180px] focus-visible:ring-[var(--pos-teal)]"
                                        />
                                        <div className="flex gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setData('count_date', today)}
                                                className={cn(
                                                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                                    data.count_date === today
                                                        ? 'border-[var(--pos-teal)] bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]'
                                                        : 'text-muted-foreground hover:bg-muted',
                                                )}
                                            >
                                                Today
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('count_date', yesterday)}
                                                className={cn(
                                                    'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                                                    data.count_date === yesterday
                                                        ? 'border-[var(--pos-teal)] bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]'
                                                        : 'text-muted-foreground hover:bg-muted',
                                                )}
                                            >
                                                Yesterday
                                            </button>
                                        </div>
                                    </div>
                                    {errors.count_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.count_date}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="e.g. Monthly count, back stock only, etc."
                                        className="focus-visible:ring-[var(--pos-teal)]"
                                    />
                                </div>
                            </div>

                            {/* Desktop actions, inline with the form card */}
                            <div className="mt-6 hidden gap-2 border-t pt-4 sm:flex">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <ClipboardCheck className="size-4" />
                                    {processing ? 'Starting…' : 'Start Count'}
                                </Button>
                                <Button type="button" variant="outline" asChild disabled={processing}>
                                    <Link href="/inventory-counts">Cancel</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Helper sidebar */}
                        <div className="space-y-3">
                            <div className="rounded-xl border bg-[var(--pos-teal)]/5 p-4">
                                <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                    <Info className="size-4 shrink-0" />
                                    <p className="text-sm font-medium">How counting works</p>
                                </div>
                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                    <li>• You'll add and count products one at a time on the next screen.</li>
                                    <li>
                                        • The system snapshots the expected quantity the moment you count each
                                        product.
                                    </li>
                                    <li>• Nothing in your stock records changes until you finalize the count.</li>
                                    <li>
                                        • Finalizing adjusts stock to match reality and flags any shrinkage as a
                                        variance.
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Mobile sticky action bar */}
                    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 sm:hidden">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                        >
                            <ClipboardCheck className="size-4" />
                            {processing ? 'Starting…' : 'Start Count'}
                        </Button>
                        <Button type="button" variant="outline" asChild disabled={processing} className="flex-1">
                            <Link href="/inventory-counts">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CreateInventoryCount.layout = {
    breadcrumbs: [
        { title: 'Inventory Counts', href: '/inventory-counts' },
        { title: 'Start Count', href: '/inventory-counts/create' },
    ],
};
