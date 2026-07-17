import { Head, useForm, Link } from '@inertiajs/react';
import SupplierFormFields from '@/components/suppliers/supplier-form-fields';
import { Button } from '@/components/ui/button';
import suppliers from '@/routes/suppliers';

export default function CreateSupplier() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        payment_terms: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(suppliers.store().url);
    }

    return (
        <>
            <Head title="Add Supplier" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Supplier</h1>

                <form onSubmit={handleSubmit}>
                    <SupplierFormFields data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Save Supplier
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={suppliers.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateSupplier.layout = {
    breadcrumbs: [
        { title: 'Suppliers', href: suppliers.index().url },
        { title: 'Add Supplier', href: suppliers.create().url },
    ],
};