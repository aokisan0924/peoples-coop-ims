import { Head, useForm, Link } from '@inertiajs/react';
import { ArrowLeft, Ruler, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UnitFormFields from '@/components/units/unit-form-fields';
import units from '@/routes/units';

const EXAMPLES = [
    { name: 'Piece', abbreviation: 'pc' },
    { name: 'Kilogram', abbreviation: 'kg' },
    { name: 'Gram', abbreviation: 'g' },
    { name: 'Liter', abbreviation: 'L' },
    { name: 'Milliliter', abbreviation: 'mL' },
    { name: 'Box', abbreviation: 'box' },
    { name: 'Pack', abbreviation: 'pack' },
    { name: 'Dozen', abbreviation: 'dz' },
];

export default function CreateUnit() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        abbreviation: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(units.store().url);
    }

    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Add Unit" />

            <div className="mx-auto max-w-4xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="size-9 shrink-0">
                        <Link href={units.index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Ruler className="size-4" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight">Add Unit</h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Define a unit of measure for stocking and selling products.</p>
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
                                    {processing ? 'Saving…' : 'Save Unit'}
                                </Button>
                                <Button type="button" variant="outline" asChild disabled={processing}>
                                    <Link href={units.index().url}>Cancel</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Quick-fill examples */}
                        <div className="rounded-xl border p-4 md:col-span-2">
                            <p className="text-sm font-medium">Common units</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">Tap one to fill the form, then adjust if needed.</p>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {EXAMPLES.map((ex) => (
                                    <button
                                        key={ex.abbreviation}
                                        type="button"
                                        onClick={() => {
                                            setData('name', ex.name);
                                            setData('abbreviation', ex.abbreviation);
                                        }}
                                        className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                    >
                                        {ex.name} <span className="text-muted-foreground/70">({ex.abbreviation})</span>
                                    </button>
                                ))}
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
                            {processing ? 'Saving…' : 'Save Unit'}
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

CreateUnit.layout = {
    breadcrumbs: [
        { title: 'Units', href: units.index().url },
        { title: 'Add Unit', href: units.create().url },
    ],
};
