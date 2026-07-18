import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import locations from '@/routes/locations';

interface Location {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_main: boolean;
    is_active: boolean;
}

export default function LocationsIndex({ locations: locationList }: { locations: Location[] }) {
    function handleDelete(location: Location) {
        if (confirm(`Remove branch "${location.name}"? This cannot be undone.`)) {
            router.delete(locations.destroy(location.id).url);
        }
    }

    return (
        <>
            <Head title="Branches" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Branches</h1>
                    <Button asChild>
                        <Link href={locations.create().url}>+ Add Branch</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Address</th>
                                <th className="text-left p-3">Phone</th>
                                <th className="text-left p-3">Status</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locationList.map((location) => (
                                <tr key={location.id} className="border-t">
                                    <td className="p-3 font-medium">
                                        {location.name}
                                        {location.is_main && <Badge className="ml-2">Main</Badge>}
                                    </td>
                                    <td className="p-3">{location.address ?? '—'}</td>
                                    <td className="p-3">{location.phone ?? '—'}</td>
                                    <td className="p-3">
                                        {location.is_active ? (
                                            <Badge variant="secondary">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Inactive</Badge>
                                        )}
                                    </td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={locations.edit(location.id).url}>Edit</Link>
                                        </Button>
                                        {!location.is_main && (
                                            <Button variant="destructive" size="sm" onClick={() => handleDelete(location)}>
                                                Delete
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

LocationsIndex.layout = {
    breadcrumbs: [{ title: 'Branches', href: locations.index().url }],
};
