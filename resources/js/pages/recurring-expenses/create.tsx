import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Repeat, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Location {
    id: number;
    name: string;
}

interface Props {
    categories: string[];
    locations: Location[];
    isOwner: boolean;
}

export default function CreateRecurringExpense({
    categories,
    locations,
    isOwner,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category: '',
        description: '',
        estimated_amount: '',
        day_of_month: '',
        location_id: null as number | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/recurring-expenses');
    }

    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Add Recurring Bill" />

            <div className="mx-auto max-w-xl p-3 sm:p-6">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-3 -ml-2 gap-1.5 text-muted-foreground"
                >
                    <Link href="/recurring-expenses">
                        <ArrowLeft className="size-4" />
                        Recurring Bills
                    </Link>
                </Button>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Repeat className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">
                                    Add Recurring Bill
                                </CardTitle>
                                <CardDescription>
                                    For bills that repeat every month, like
                                    rent, electricity, water, or internet.
                                    You'll get a reminder each month instead of
                                    re-entering it from scratch.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isOwner && (
                                <div>
                                    <Label htmlFor="location_id">
                                        Branch *
                                    </Label>
                                    <Select
                                        value={
                                            data.location_id
                                                ? String(data.location_id)
                                                : ''
                                        }
                                        onValueChange={(v) =>
                                            setData('location_id', Number(v))
                                        }
                                    >
                                        <SelectTrigger
                                            id="location_id"
                                            className="mt-1.5 w-full"
                                        >
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {locations.map((loc) => (
                                                <SelectItem
                                                    key={loc.id}
                                                    value={String(loc.id)}
                                                >
                                                    {loc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.location_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.location_id}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(v) =>
                                        setData('category', v)
                                    }
                                >
                                    <SelectTrigger
                                        id="category"
                                        className="mt-1.5 w-full"
                                    >
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>
                                                {cat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.category}
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) =>
                                        setData('description', e.target.value)
                                    }
                                    placeholder="e.g. Meralco — main branch meter"
                                    className="mt-1.5"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="estimated_amount">
                                        Estimated Amount (₱) *
                                    </Label>
                                    <Input
                                        id="estimated_amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        inputMode="decimal"
                                        value={data.estimated_amount}
                                        onChange={(e) =>
                                            setData(
                                                'estimated_amount',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1.5 font-mono tabular-nums"
                                    />
                                    {errors.estimated_amount && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.estimated_amount}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="day_of_month">
                                        Due Day *
                                    </Label>
                                    <Input
                                        id="day_of_month"
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={31}
                                        value={data.day_of_month}
                                        onChange={(e) =>
                                            setData(
                                                'day_of_month',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="e.g. 5"
                                        className="mt-1.5 tabular-nums"
                                    />
                                    {errors.day_of_month && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.day_of_month}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="-mt-2 text-xs text-muted-foreground">
                                A typical amount and due day — you can adjust
                                the actual figure each month when you pay it.
                            </p>

                            <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                                >
                                    <Save className="size-4" />
                                    {processing
                                        ? 'Saving…'
                                        : 'Save Recurring Bill'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    className="sm:flex-1"
                                >
                                    <Link href="/recurring-expenses">
                                        Cancel
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

CreateRecurringExpense.layout = {
    breadcrumbs: [
        { title: 'Recurring Bills', href: '/recurring-expenses' },
        { title: 'Add Recurring Bill', href: '/recurring-expenses/create' },
    ],
};
