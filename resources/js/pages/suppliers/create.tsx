import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import SupplierFormFields from '@/components/suppliers/supplier-form-fields';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import suppliers from '@/routes/suppliers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Suppliers', href: suppliers.index().url },
    { title: 'Add Supplier', href: suppliers.create().url },
];

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
        <AppLayout breadcrumbs={breadcrumbs}>
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
        </AppLayout>
    );
}