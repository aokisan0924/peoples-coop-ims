import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { type BreadcrumbItem } from '@/types';
import { type Supplier } from '@/types/inventory';
import suppliers from '@/routes/suppliers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Suppliers', href: suppliers.index().url },
];

export default function SuppliersIndex({ suppliers: supplierList }: { suppliers: Supplier[] }) {
    function handleDelete(supplier: Supplier) {
        if (confirm(`Remove supplier "${supplier.name}"? This cannot be undone.`)) {
            router.delete(suppliers.destroy(supplier.id).url);
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Suppliers</h1>
                    <Button asChild>
                        <Link href={suppliers.create().url}>+ Add Supplier</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Contact Person</th>
                                <th className="text-left p-3">Phone</th>
                                <th className="text-left p-3">Payment Terms</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierList.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                        No suppliers yet. Add your first one.
                                    </td>
                                </tr>
                            )}
                            {supplierList.map((supplier) => (
                                <tr key={supplier.id} className="border-t">
                                    <td className="p-3 font-medium">{supplier.name}</td>
                                    <td className="p-3">{supplier.contact_person ?? '—'}</td>
                                    <td className="p-3">{supplier.phone ?? '—'}</td>
                                    <td className="p-3">{supplier.payment_terms ?? '—'}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={suppliers.edit(supplier.id).url}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(supplier)}
                                        >
                                            Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}