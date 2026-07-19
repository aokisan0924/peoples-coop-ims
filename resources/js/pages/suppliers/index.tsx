import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { type Supplier } from '@/types/inventory';
import suppliers from '@/routes/suppliers';
import { CreditCard, Mail, Pencil, Phone, Search, Trash2, Truck, User, X } from 'lucide-react';

export default function SuppliersIndex({ suppliers: supplierList }: { suppliers: Supplier[] }) {
    const [query, setQuery] = useState('');

    function handleDelete(supplier: Supplier) {
        if (confirm(`Remove supplier "${supplier.name}"? This cannot be undone.`)) {
            router.delete(suppliers.destroy(supplier.id).url);
        }
    }

    const isEmpty = supplierList.length === 0;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return supplierList;
        return supplierList.filter((s) => [s.name, s.contact_person, s.phone, s.email].some((f) => f?.toLowerCase().includes(q)));
    }, [supplierList, query]);

    const noResults = !isEmpty && filtered.length === 0;

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Suppliers" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Suppliers</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">{supplierList.length}</Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Manage the vendors you receive stock from.</p>
                    </div>
                    <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                        <Link href={suppliers.create().url}>
                            <Truck className="size-4" />
                            Add Supplier
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <div className="relative max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, contact, phone, or email…"
                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                            aria-label="Search suppliers"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-4" />
                            </button>
                        )}
                    </div>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults onClear={() => setQuery('')} />
                ) : (
                    <>
                        {/* Table on larger screens, cards on mobile */}
                        <div className="hidden overflow-hidden rounded-xl border lg:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Supplier</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Contact Person</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Phone</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Email</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Payment Terms</th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((supplier) => (
                                        <tr key={supplier.id} className="group border-t transition-colors hover:bg-muted/30">
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <Truck className="size-4" />
                                                    </div>
                                                    <span className="truncate">{supplier.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {supplier.contact_person ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <User className="size-3.5 shrink-0" />
                                                        {supplier.contact_person}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {supplier.phone ? (
                                                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                                        <Phone className="size-3.5 shrink-0" />
                                                        {supplier.phone}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {supplier.email ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Mail className="size-3.5 shrink-0" />
                                                        <span className="truncate">{supplier.email}</span>
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{supplier.payment_terms ?? '—'}</td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="size-8 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                        title="Edit supplier"
                                                    >
                                                        <Link href={suppliers.edit(supplier.id).url}>
                                                            <Pencil className="size-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleDelete(supplier)}
                                                        className="size-8 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                        title="Delete supplier"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:hidden">
                            {filtered.map((supplier) => (
                                <div key={supplier.id} className="rounded-xl border bg-card p-3 shadow-sm">
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                            <Truck className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{supplier.name}</p>
                                            {supplier.contact_person && (
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <User className="size-3 shrink-0" />
                                                    {supplier.contact_person}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                                        {supplier.phone && (
                                            <p className="flex items-center gap-1.5">
                                                <Phone className="size-3 shrink-0" />
                                                {supplier.phone}
                                            </p>
                                        )}
                                        {supplier.email && (
                                            <p className="flex items-center gap-1.5">
                                                <Mail className="size-3 shrink-0" />
                                                <span className="truncate">{supplier.email}</span>
                                            </p>
                                        )}
                                        {supplier.payment_terms && (
                                            <p className="flex items-center gap-1.5">
                                                <CreditCard className="size-3 shrink-0" />
                                                {supplier.payment_terms}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-1.5 border-t pt-2.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <Link href={suppliers.edit(supplier.id).url}>
                                                <Pencil className="size-3.5" />
                                                Edit
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(supplier)}
                                            className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                        >
                                            <Trash2 className="size-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Truck className="size-7" />
            </div>
            <p className="text-sm font-medium">No suppliers yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Add your first supplier to start receiving stock from them.</p>
            <Button asChild size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                <Link href={suppliers.create().url}>
                    <Truck className="size-4" />
                    Add Supplier
                </Link>
            </Button>
        </div>
    );
}

function NoResults({ onClear }: { onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">No suppliers match your search</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different name, contact, phone, or email.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                Clear search
            </Button>
        </div>
    );
}

SuppliersIndex.layout = {
    breadcrumbs: [{ title: 'Suppliers', href: suppliers.index().url }],
};
