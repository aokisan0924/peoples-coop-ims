import { Head, useForm, Link } from '@inertiajs/react';
import UnitFormFields from '@/components/units/unit-form-fields';
import { Button } from '@/components/ui/button';
import { type Unit } from '@/types/inventory';
import units from '@/routes/units';

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
        <>
            <Head title="Edit Unit" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Edit Unit</h1>

                <form onSubmit={handleSubmit}>
                    <UnitFormFields data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Update Unit
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={units.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditUnit.layout = {
    breadcrumbs: [
        { title: 'Units', href: units.index().url },
        { title: 'Edit Unit', href: '#' },
    ],
};