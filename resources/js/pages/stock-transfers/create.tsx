import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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

export default function CreateStockTransfer({ products, sourceBranches, destinationBranches, isOwner }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        product_id: null as number | null,
        from_location_id: null as number | null,
        to_location_id: null as number | null,
        quantity: 1,
        notes: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/stock-transfers');
    }

    return (
        <>
            <Head title="New Stock Transfer" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">New Stock Transfer</h1>
                <p className="text-sm text-muted-foreground mb-4">
                    Stock is deducted from the source branch immediately and marked "in transit" until the receiving branch confirms it arrived.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="product_id">Product *</Label>
                        <Select
                            value={data.product_id ? String(data.product_id) : ''}
                            onValueChange={(v) => setData('product_id', Number(v))}
                        >
                            <SelectTrigger id="product_id">
                                <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
                                        {p.name} ({p.sku})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.product_id && <p className="text-sm text-red-600 mt-1">{errors.product_id}</p>}
                    </div>

                    {isOwner && (
                        <div>
                            <Label htmlFor="from_location_id">Source Branch *</Label>
                            <Select
                                value={data.from_location_id ? String(data.from_location_id) : ''}
                                onValueChange={(v) => setData('from_location_id', Number(v))}
                            >
                                <SelectTrigger id="from_location_id">
                                    <SelectValue placeholder="Select source branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sourceBranches.map((loc) => (
                                        <SelectItem key={loc.id} value={String(loc.id)}>
                                            {loc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.from_location_id && <p className="text-sm text-red-600 mt-1">{errors.from_location_id}</p>}
                        </div>
                    )}

                    <div>
                        <Label htmlFor="to_location_id">Destination Branch *</Label>
                        <Select
                            value={data.to_location_id ? String(data.to_location_id) : ''}
                            onValueChange={(v) => setData('to_location_id', Number(v))}
                        >
                            <SelectTrigger id="to_location_id">
                                <SelectValue placeholder="Select destination branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {destinationBranches.map((loc) => (
                                    <SelectItem key={loc.id} value={String(loc.id)}>
                                        {loc.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.to_location_id && <p className="text-sm text-red-600 mt-1">{errors.to_location_id}</p>}
                    </div>

                    <div>
                        <Label htmlFor="quantity">Quantity (base units) *</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min={1}
                            value={data.quantity}
                            onChange={(e) => setData('quantity', Number(e.target.value))}
                        />
                        {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
                    </div>

                    <div>
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={data.notes} onChange={(e) => setData('notes', e.target.value)} />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Initiate Transfer</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href="/stock-transfers">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateStockTransfer.layout = {
    breadcrumbs: [
        { title: 'Stock Transfers', href: '/stock-transfers' },
        { title: 'New Transfer', href: '/stock-transfers/create' },
    ],
};
