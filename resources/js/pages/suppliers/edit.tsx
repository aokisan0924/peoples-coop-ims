import { Head, useForm, Link } from '@inertiajs/react';
import SupplierFormFields from '@/components/suppliers/supplier-form-fields';
import { Button } from '@/components/ui/button';
import { type Supplier } from '@/types/inventory';
import suppliers from '@/routes/suppliers';

export default function EditSupplier({ supplier }: { supplier: Supplier }) {
    const { data, setData, put, processing, errors } = useForm({
        name: supplier.name,
        contact_person: supplier.contact_person ?? '',
        phone: supplier.phone ?? '',
        email: supplier.email ?? '',
        address: supplier.address ?? '',
        payment_terms: supplier.payment_terms ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(suppliers.update(supplier.id).url);
    }

    return (
        <>
            <Head title="Edit Supplier" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Edit Supplier</h1>

                <form onSubmit={handleSubmit}>
                    <SupplierFormFields data={data} setData={setData} errors={errors} />

                    <div className="flex gap-2 mt-6">
                        <Button type="submit" disabled={processing}>
                            Update Supplier
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

EditSupplier.layout = {
    breadcrumbs: [
        { title: 'Suppliers', href: suppliers.index().url },
        { title: 'Edit Supplier', href: '#' },
    ],
};