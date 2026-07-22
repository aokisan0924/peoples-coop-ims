import { Head, useForm, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowRightLeft,
    Hash,
    Info,
    MapPin,
    Package,
    StickyNote,
} from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Product {
    id: number;
    name: string;
    sku: string;
}

interface Location {
    id: number;
    name: string;
}

interface Props {
    products: Product[];
    sourceBranches: Location[];
    destinationBranches: Location[];
    isOwner: boolean;
}

export default function CreateStockTransfer({
    products,
    sourceBranches,
    destinationBranches,
    isOwner,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_id: null as number | null,
        from_location_id: null as number | null,
        to_location_id: null as number | null,
        quantity: 1,
        notes: '',
    });

    const productOptions = useMemo(
        () =>
            products.map((p) => ({
                value: String(p.id),
                label: p.name,
                description: p.sku,
            })),
        [products],
    );
    const sourceBranchOptions = useMemo(
        () =>
            sourceBranches.map((loc) => ({
                value: String(loc.id),
                label: loc.name,
            })),
        [sourceBranches],
    );
    const destinationBranchOptions = useMemo(
        () =>
            destinationBranches.map((loc) => ({
                value: String(loc.id),
                label: loc.name,
            })),
        [destinationBranches],
    );

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/stock-transfers');
    }

    const selectedProduct = products.find((p) => p.id === data.product_id);
    const fromName = isOwner
        ? sourceBranches.find((l) => l.id === data.from_location_id)?.name
        : 'Your branch';
    const toName = destinationBranches.find(
        (l) => l.id === data.to_location_id,
    )?.name;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="New Stock Transfer" />

            <div className="mx-auto max-w-5xl space-y-4 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="size-9 shrink-0"
                    >
                        <Link href="/stock-transfers">
                            <ArrowLeft className="size-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                <ArrowRightLeft className="size-4" />
                            </div>
                            <h1 className="text-xl font-semibold tracking-tight">
                                New Stock Transfer
                            </h1>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Move stock from one branch to another.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
                        {/* Form card */}
                        <div className="space-y-5 rounded-xl border bg-card p-4 sm:p-5 lg:col-span-2">
                            <div className="grid gap-2">
                                <Label htmlFor="product_id">Product *</Label>
                                <div className="relative">
                                    <Package className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Combobox
                                        id="product_id"
                                        options={productOptions}
                                        value={
                                            data.product_id
                                                ? String(data.product_id)
                                                : null
                                        }
                                        onChange={(v) =>
                                            setData('product_id', Number(v))
                                        }
                                        placeholder="Select product"
                                        searchPlaceholder="Search by name or SKU…"
                                        emptyText="No matching products."
                                        className="pl-9"
                                        createAction={{
                                            label: '+ Add New Product (opens in a new tab)',
                                            onSelect: () =>
                                                window.open(
                                                    '/products/create',
                                                    '_blank',
                                                ),
                                        }}
                                    />
                                </div>
                                {errors.product_id && (
                                    <p className="text-sm text-red-600">
                                        {errors.product_id}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                {isOwner && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="from_location_id">
                                            Source Branch *
                                        </Label>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <Combobox
                                                id="from_location_id"
                                                options={sourceBranchOptions}
                                                value={
                                                    data.from_location_id
                                                        ? String(
                                                              data.from_location_id,
                                                          )
                                                        : null
                                                }
                                                onChange={(v) =>
                                                    setData(
                                                        'from_location_id',
                                                        Number(v),
                                                    )
                                                }
                                                placeholder="Select source branch"
                                                searchPlaceholder="Search branches…"
                                                emptyText="No matching branches."
                                                className="pl-9"
                                            />
                                        </div>
                                        {errors.from_location_id && (
                                            <p className="text-sm text-red-600">
                                                {errors.from_location_id}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="to_location_id">
                                        Destination Branch *
                                    </Label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <Combobox
                                            id="to_location_id"
                                            options={destinationBranchOptions}
                                            value={
                                                data.to_location_id
                                                    ? String(
                                                          data.to_location_id,
                                                      )
                                                    : null
                                            }
                                            onChange={(v) =>
                                                setData(
                                                    'to_location_id',
                                                    Number(v),
                                                )
                                            }
                                            placeholder="Select destination branch"
                                            searchPlaceholder="Search branches…"
                                            emptyText="No matching branches."
                                            className="pl-9"
                                        />
                                    </div>
                                    {errors.to_location_id && (
                                        <p className="text-sm text-red-600">
                                            {errors.to_location_id}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Route preview */}
                            {(fromName || toName) && (
                                <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
                                    <span className="min-w-0 truncate font-medium">
                                        {fromName ?? '—'}
                                    </span>
                                    <ArrowRight className="size-4 shrink-0 text-[var(--pos-teal)]" />
                                    <span className="min-w-0 truncate font-medium">
                                        {toName ?? '—'}
                                    </span>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="quantity">
                                    Quantity (base units) *
                                </Label>
                                <div className="relative max-w-[10rem]">
                                    <Hash className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min={1}
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData(
                                                'quantity',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                {errors.quantity && (
                                    <p className="text-sm text-red-600">
                                        {errors.quantity}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes</Label>
                                <div className="relative">
                                    <StickyNote className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData('notes', e.target.value)
                                        }
                                        className="min-h-24 pl-9"
                                        placeholder="Optional context for this transfer…"
                                    />
                                </div>
                            </div>

                            {/* Desktop actions, inline with the form card */}
                            <div className="hidden gap-2 border-t pt-4 sm:flex">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                                >
                                    <ArrowRightLeft className="size-4" />
                                    {processing
                                        ? 'Initiating…'
                                        : 'Initiate Transfer'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                    disabled={processing}
                                >
                                    <Link href="/stock-transfers">Cancel</Link>
                                </Button>
                            </div>
                        </div>

                        {/* Helper sidebar */}
                        <div className="space-y-3">
                            <div className="rounded-xl border bg-[var(--pos-teal)]/5 p-4">
                                <div className="flex items-center gap-2 text-[var(--pos-teal)]">
                                    <Info className="size-4 shrink-0" />
                                    <p className="text-sm font-medium">
                                        How transfers work
                                    </p>
                                </div>
                                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                                    <li>
                                        • Stock is deducted from the source
                                        branch immediately.
                                    </li>
                                    <li>
                                        • The transfer is marked "in transit"
                                        until confirmed.
                                    </li>
                                    <li>
                                        • The destination branch (or an owner)
                                        confirms receipt to add it to their
                                        stock.
                                    </li>
                                    <li>
                                        • A pending transfer can be cancelled to
                                        restore stock to the source branch.
                                    </li>
                                </ul>
                            </div>

                            {selectedProduct && (
                                <div className="rounded-xl border p-4 text-xs text-muted-foreground">
                                    <p className="font-medium text-foreground">
                                        {selectedProduct.name}
                                    </p>
                                    <p className="mt-0.5 font-mono">
                                        {selectedProduct.sku}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile sticky action bar */}
                    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t bg-background p-3 sm:hidden">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="flex-1 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                        >
                            <ArrowRightLeft className="size-4" />
                            {processing ? 'Initiating…' : 'Initiate Transfer'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                            disabled={processing}
                            className="flex-1"
                        >
                            <Link href="/stock-transfers">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CreateStockTransfer.layout = {
    breadcrumbs: [
        { title: 'Stock Transfers', href: '/stock-transfers' },
        { title: 'New Transfer', href: '/stock-transfers/create' },
    ],
};
