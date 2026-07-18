import { Head, useForm, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import locations from '@/routes/locations';

interface Location {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_active: boolean;
}

export default function EditLocation({ location }: { location: Location }) {
    const { data, setData, put, processing, errors } = useForm({
        name: location.name,
        address: location.address ?? '',
        phone: location.phone ?? '',
        is_active: location.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(locations.update(location.id).url);
    }

    return (
        <>
            <Head title="Edit Branch" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Edit Branch</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Branch Name *</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
                    </div>

                    <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked === true)}
                        />
                        <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Update Branch</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={locations.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EditLocation.layout = {
    breadcrumbs: [
        { title: 'Branches', href: locations.index().url },
        { title: 'Edit Branch', href: '#' },
    ],
};
