import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Template {
    id: number;
    category: string;
    description: string | null;
    estimated_amount: string;
    day_of_month: number;
    is_active: boolean;
    location: { name: string };
}

function peso(n: string | number): string {
    return `₱${parseFloat(String(n)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RecurringExpensesIndex({ templates, pendingThisMonth }: { templates: Template[]; pendingThisMonth: Template[] }) {
    function handleGenerate() {
        router.post('/recurring-expenses/generate');
    }

    function handleToggle(id: number) {
        router.post(`/recurring-expenses/${id}/toggle`);
    }

    function handleDelete(id: number) {
        if (confirm('Remove this recurring bill template?')) {
            router.delete(`/recurring-expenses/${id}`);
        }
    }

    return (
        <>
            <Head title="Recurring Bills" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Recurring Bills</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleGenerate}>
                            Generate This Month's Bills
                        </Button>
                        <Button asChild>
                            <Link href="/recurring-expenses/create">+ Add Template</Link>
                        </Button>
                    </div>
                </div>

                {pendingThisMonth.length > 0 && (
                    <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 mb-4 text-sm">
                        <span className="font-medium">{pendingThisMonth.length} bill(s)</span> not yet generated for this month — click "Generate This Month's Bills" above.
                    </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Category</th>
                                <th className="text-left p-3">Description</th>
                                <th className="text-left p-3">Branch</th>
                                <th className="text-left p-3">Est. Amount</th>
                                <th className="text-left p-3">Due Day</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                                        No recurring bills set up yet.
                                    </td>
                                </tr>
                            )}
                            {templates.map((t) => (
                                <tr key={t.id} className="border-t">
                                    <td className="p-3 font-medium">{t.category}</td>
                                    <td className="p-3">{t.description ?? '—'}</td>
                                    <td className="p-3">{t.location.name}</td>
                                    <td className="p-3">{peso(t.estimated_amount)}</td>
                                    <td className="p-3">Day {t.day_of_month}</td>
                                    <td className="p-3">
                                        {t.is_active ? (
                                            <Badge className="bg-green-600">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Paused</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => handleToggle(t.id)}>
                                            {t.is_active ? 'Pause' : 'Resume'}
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

RecurringExpensesIndex.layout = {
    breadcrumbs: [{ title: 'Recurring Bills', href: '/recurring-expenses' }],
};
