import { Head, useForm, Link } from '@inertiajs/react';
import SupplierFormFields from '@/components/suppliers/supplier-form-fields';
import { Button } from '@/components/ui/button';
import suppliers from '@/routes/suppliers';
import { ArrowLeft, Info, Save, Truck } from 'lucide-react';

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
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Add Supplier" />

            <div className="mx-auto max-w-5xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" asChild className="size-9 shrink-0">
                        <Link href={suppliers.index().url}>
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <Truck className="size-4" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight">Add Supplier</h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Add a vendor you receive stock from.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                        {/* Form card */}
                        <div className="rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
                            <SupplierFormFields data={data} setData={setData} errors={errors} />

                            {/* Desktop actions, inline with the form card */}
                            <div className="mt-6 hidden gap-2 border-t pt-4 sm:flex">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <Save className="size-4" />
                                    {processing ? 'Saving…' : 'Save Supplier'}
                                </Button>
                                <Button type="button" variant="outline" asChild disabled={processing}>
                                    <Link href={suppliers.index().url}>Cancel</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Helper sidebar */}
                        <div className="space-y-3">
                            <div className="rounded-xl border bg-[var(--pos-teal)]/5 p-4">
                                <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                    <Info className="size-4 shrink-0" />
                                    <p className="text-sm font-medium">Why add suppliers</p>
                                </div>
                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                    <li>• Link received stock batches to where they came from.</li>
                                    <li>• Keep a contact on file for reorders and follow-ups.</li>
                                    <li>• Payment terms help you track what's owed and when.</li>
                                </ul>
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
                            {processing ? 'Saving…' : 'Save Supplier'}
                        </Button>
                        <Button type="button" variant="outline" asChild disabled={processing} className="flex-1">
                            <Link href={suppliers.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CreateSupplier.layout = {
    breadcrumbs: [
        { title: 'Suppliers', href: suppliers.index().url },
        { title: 'Add Supplier', href: suppliers.create().url },
    ],
};
