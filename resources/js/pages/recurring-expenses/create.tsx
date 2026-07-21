import { Head, useForm, Link } from '@inertiajs/react';
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

interface Location {
    id: number;
    name: string;
}

interface Props {
    categories: string[];
    locations: Location[];
    isOwner: boolean;
}

export default function CreateRecurringExpense({ categories, locations, isOwner }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category: '',
        description: '',
        estimated_amount: '',
        day_of_month: 1,
        location_id: null as number | null,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/recurring-expenses');
    }

    return (
        <>
            <Head title="Add Recurring Bill" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Recurring Bill</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isOwner && (
                        <div>
                            <Label htmlFor="location_id">Branch *</Label>
                            <Select value={data.location_id ? String(data.location_id) : ''} onValueChange={(v) => setData('location_id', Number(v))}>
                                <SelectTrigger id="location_id">
                                    <SelectValue placeholder="Select branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((loc) => (
                                        <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.location_id && <p className="text-sm text-red-600 mt-1">{errors.location_id}</p>}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="category">Category *</Label>
                        <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="e.g. Meralco account #123456" />
                    </div>

                    <div>
                        <Label htmlFor="estimated_amount">Estimated Amount (₱) *</Label>
                        <Input id="estimated_amount" type="number" step="0.01" min="0.01" value={data.estimated_amount} onChange={(e) => setData('estimated_amount', e.target.value)} />
                        {errors.estimated_amount && <p className="text-sm text-red-600 mt-1">{errors.estimated_amount}</p>}
                    </div>

                    <div>
                        <Label htmlFor="day_of_month">Due Day of Month (1–31) *</Label>
                        <Input id="day_of_month" type="number" min={1} max={31} value={data.day_of_month} onChange={(e) => setData('day_of_month', Number(e.target.value))} />
                        {errors.day_of_month && <p className="text-sm text-red-600 mt-1">{errors.day_of_month}</p>}
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Save Template</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/recurring-expenses">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateRecurringExpense.layout = {
    breadcrumbs: [
        { title: 'Recurring Bills', href: '/recurring-expenses' },
        { title: 'Add Template', href: '/recurring-expenses/create' },
    ],
};
