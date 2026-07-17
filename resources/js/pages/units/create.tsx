import { Head, useForm, Link } from '@inertiajs/react';
import UnitFormFields from '@/components/units/unit-form-fields';
import { Button } from '@/components/ui/button';
import units from '@/routes/units';

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
        <>
            <Head title="Add Unit" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Unit</h1>

                <form onSubmit={handleSubmit}>
                    <UnitFormFields data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Unit
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

CreateUnit.layout = {
    breadcrumbs: [
        { title: 'Units', href: units.index().url },
        { title: 'Add Unit', href: units.create().url },
    ],
};