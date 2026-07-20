import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function CreateExpense({ categories, locations, isOwner }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category: '',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        due_date: '',
        is_paid: false,
        location_id: null as number | null,
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/expenses');
    }

    return (
        <>
            <Head title="Add Expense" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Expense</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <Input id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="e.g. Meralco bill for July" />
                    </div>

                    <div>
                        <Label htmlFor="amount">Amount (₱) *</Label>
                        <Input id="amount" type="number" step="0.01" min="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} />
                        {errors.amount && <p className="text-sm text-red-600 mt-1">{errors.amount}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="expense_date">Expense Date *</Label>
                            <Input id="expense_date" type="date" value={data.expense_date} onChange={(e) => setData('expense_date', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="due_date">Due Date</Label>
                            <Input id="due_date" type="date" value={data.due_date} onChange={(e) => setData('due_date', e.target.value)} />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox id="is_paid" checked={data.is_paid} onCheckedChange={(c) => setData('is_paid', c === true)} />
                        <Label htmlFor="is_paid">Already paid</Label>
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Save Expense</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/expenses">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateExpense.layout = {
    breadcrumbs: [
        { title: 'Expenses', href: '/expenses' },
        { title: 'Add Expense', href: '/expenses/create' },
    ],
};
