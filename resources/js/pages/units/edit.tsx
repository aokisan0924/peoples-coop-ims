import { Head, useForm, Link } from '@inertiajs/react';
import UnitFormFields from '@/components/units/unit-form-fields';
import { Button } from '@/components/ui/button';
import { type Unit } from '@/types/inventory';
import units from '@/routes/units';
import { ArrowLeft, Pencil, Ruler, Save } from 'lucide-react';

export default function EditUnit({ unit }: { unit: Unit }) {
    const { data, setData, put, processing, errors } = useForm({
        name: unit.name,
        abbreviation: unit.abbreviation,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(units.update(unit.id).url);
    }

    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Edit Unit" />

            <div className="mx-auto max-w-4xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="size-9 shrink-0">
                        <Link href={units.index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Pencil className="size-4" />
                            </div>
                            <h1 className="truncate text-xl font-semibold tracking-tight">Edit Unit</h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Update details for {unit.name}.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-start">
                        {/* Form card */}
                        <div className="rounded-xl border bg-card p-4 sm:p-5 md:col-span-3">
                            <UnitFormFields data={data} setData={setData} errors={errors} />

                            {/* Desktop actions, inline with the form card */}
                            <div className="mt-6 hidden gap-2 border-t pt-4 sm:flex">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <Save className="size-4" />
                                    {processing ? 'Updating…' : 'Update Unit'}
                                </Button>
                                <Button type="button" variant="outline" asChild disabled={processing}>
                                    <Link href={units.index().url}>Cancel</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Context sidebar */}
                        <div className="rounded-xl border p-4 md:col-span-2">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                    <Ruler className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{unit.name}</p>
                                    <p className="text-xs text-muted-foreground">Unit #{unit.id}</p>
                                </div>
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
                            <Save className="size-4" />
                            {processing ? 'Updating…' : 'Update Unit'}
                        </Button>
                        <Button type="button" variant="outline" asChild disabled={processing} className="flex-1">
                            <Link href={units.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

EditUnit.layout = {
    breadcrumbs: [
        { title: 'Units', href: units.index().url },
        { title: 'Edit Unit', href: '#' },
    ],
};
