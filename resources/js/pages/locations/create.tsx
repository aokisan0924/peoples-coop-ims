import { Head, useForm, Link } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import locations from '@/routes/locations';

export default function CreateLocation() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        address: '',
        phone: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(locations.store().url);
    }

    return (
        <>
            <Head title="Add Branch" />

            <div className="max-w-xl p-4">
                <h1 className="text-xl font-semibold mb-4">Add Branch</h1>

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

                    <div className="flex gap-2">
                        <Button type="submit" disabled={processing}>Save Branch</Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={locations.index().url}>Cancel</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateLocation.layout = {
    breadcrumbs: [
        { title: 'Branches', href: locations.index().url },
        { title: 'Add Branch', href: locations.create().url },
    ],
};
