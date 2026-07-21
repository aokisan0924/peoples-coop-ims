import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Banknote, Receipt, Repeat, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Location {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Props {
    categories: string[];
    locations: Location[];
    suppliers: Supplier[];
    isOwner: boolean;
}

const RECURRING_CATEGORIES = ['Rent', 'Electricity', 'Water', 'Internet'];

export default function CreateExpense({ categories, locations, suppliers, isOwner }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        category: '',
        supplier_id: null as number | null,
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        due_date: '',
        is_paid: false,
        payment_method: 'cash' as 'cash' | 'gcash',
        location_id: null as number | null,
        notes: '',
        is_recurring_template: false,
        recurring_day_of_month: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/expenses');
    }

    const suggestsRecurring = RECURRING_CATEGORIES.includes(data.category);

    return (
        <div
            className="mx-auto max-w-4xl p-3 pb-28 sm:p-6 sm:pb-6"
            style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}
        >
            <Head title="Add Expense" />

            <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 gap-1.5 text-muted-foreground">
                <Link href="/expenses">
                    <ArrowLeft className="size-4" />
                    Expenses
                </Link>
            </Button>

            <Card className="animate-in fade-in-0 slide-in-from-bottom-2 shadow-sm duration-300">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                            <Receipt className="size-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Add Expense</CardTitle>
                            <CardDescription>Record a bill or cost against a branch.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid gap-4 md:grid-cols-2">
                            {isOwner && (
                                <div className={cn(!isOwner && 'hidden')}>
                                    <Label htmlFor="location_id">Branch *</Label>
                                    <Select
                                        value={data.location_id ? String(data.location_id) : ''}
                                        onValueChange={(v) => setData('location_id', Number(v))}
                                    >
                                        <SelectTrigger id="location_id" className="mt-1.5 w-full focus:ring-[var(--pos-teal)]">
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
                                    {errors.location_id && <p className="mt-1 text-sm text-red-600">{errors.location_id}</p>}
                                </div>
                            )}

                            <div>
                                <Label htmlFor="category">Category *</Label>
                                <Select value={data.category} onValueChange={(v) => setData('category', v)}>
                                    <SelectTrigger id="category" className="mt-1.5 w-full focus:ring-[var(--pos-teal)]">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                            </div>

                            <div>
                                <Label htmlFor="supplier_id">Supplier (optional)</Label>
                                <Select
                                    value={data.supplier_id ? String(data.supplier_id) : 'none'}
                                    onValueChange={(v) => setData('supplier_id', v === 'none' ? null : Number(v))}
                                >
                                    <SelectTrigger id="supplier_id" className="mt-1.5 w-full focus:ring-[var(--pos-teal)]">
                                        <SelectValue placeholder="No supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No supplier</SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.supplier_id && <p className="mt-1 text-sm text-red-600">{errors.supplier_id}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="e.g. Meralco bill for July"
                                    className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                />
                            </div>

                            <div>
                                <Label htmlFor="amount">Amount (₱) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                />
                                {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
                            </div>

                            <div>
                                <Label htmlFor="payment_method">Payment Method</Label>
                                <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v as 'cash' | 'gcash')}>
                                    <SelectTrigger id="payment_method" className="mt-1.5 w-full focus:ring-[var(--pos-teal)]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            <span className="flex items-center gap-2"><Banknote className="size-3.5" /> Cash</span>
                                        </SelectItem>
                                        <SelectItem value="gcash">
                                            <span className="flex items-center gap-2"><Smartphone className="size-3.5" /> GCash</span>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {data.payment_method === 'gcash' && data.is_paid && (
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Marking this paid will deduct {data.amount ? `₱${data.amount}` : 'the amount'} from the GCash float.
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="expense_date">Expense Date *</Label>
                                <Input
                                    id="expense_date"
                                    type="date"
                                    value={data.expense_date}
                                    onChange={(e) => setData('expense_date', e.target.value)}
                                    className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                />
                            </div>

                            {!data.is_recurring_template && (
                                <div>
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={(e) => setData('due_date', e.target.value)}
                                        className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Recurring bill toggle — nudged into view automatically for the usual
                            monthly categories (rent, electricity, water, internet). */}
                        <div
                            className={cn(
                                'rounded-lg border p-3',
                                data.is_recurring_template && 'border-[var(--pos-teal)]/40 bg-[var(--pos-teal)]/5',
                            )}
                        >
                            <label htmlFor="is_recurring_template" className="flex items-start gap-2.5">
                                <Checkbox
                                    id="is_recurring_template"
                                    checked={data.is_recurring_template}
                                    onCheckedChange={(c) => setData('is_recurring_template', c === true)}
                                    className="mt-0.5 data-[state=checked]:border-[var(--pos-teal)] data-[state=checked]:bg-[var(--pos-teal)]"
                                />
                                <span>
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <Repeat className="size-3.5 text-[var(--pos-teal)]" />
                                        Recurring monthly bill
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        {suggestsRecurring
                                            ? `${data.category} is usually a recurring bill — a reminder will show up on Expenses each month before it's due.`
                                            : "A reminder will show up on Expenses each month before it's due, instead of recording a one-off expense."}
                                    </span>
                                </span>
                            </label>

                            {data.is_recurring_template && (
                                <div className="mt-3 max-w-[200px] pl-7">
                                    <Label htmlFor="recurring_day_of_month">Bills on day of month *</Label>
                                    <Input
                                        id="recurring_day_of_month"
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="e.g. 15"
                                        value={data.recurring_day_of_month}
                                        onChange={(e) => setData('recurring_day_of_month', e.target.value)}
                                        className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                                    />
                                    {errors.recurring_day_of_month && (
                                        <p className="mt-1 text-sm text-red-600">{errors.recurring_day_of_month}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {!data.is_recurring_template && (
                            <label
                                htmlFor="is_paid"
                                className="flex items-center gap-2.5 rounded-lg border p-3 has-[:checked]:border-[var(--pos-teal)]/40 has-[:checked]:bg-[var(--pos-teal)]/5"
                            >
                                <Checkbox
                                    id="is_paid"
                                    checked={data.is_paid}
                                    onCheckedChange={(c) => setData('is_paid', c === true)}
                                    className="data-[state=checked]:border-[var(--pos-teal)] data-[state=checked]:bg-[var(--pos-teal)]"
                                />
                                <span className="text-sm font-medium">Already paid</span>
                            </label>
                        )}

                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1.5 focus-visible:ring-[var(--pos-teal)]"
                            />
                        </div>

                        {/* On mobile, actions pin to the bottom of the viewport so they stay
                            reachable no matter how far the form scrolls; on larger screens
                            they sit inline right after the fields as before. */}
                        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-card/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:static sm:z-auto sm:mt-6 sm:flex-row-reverse sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1"
                            >
                                {processing ? 'Saving…' : data.is_recurring_template ? 'Save Recurring Bill' : 'Save Expense'}
                            </Button>
                            <Button type="button" variant="outline" asChild className="sm:flex-1">
                                <Link href="/expenses">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

CreateExpense.layout = {
    breadcrumbs: [
        { title: 'Expenses', href: '/expenses' },
        { title: 'Add Expense', href: '/expenses/create' },
    ],
};
