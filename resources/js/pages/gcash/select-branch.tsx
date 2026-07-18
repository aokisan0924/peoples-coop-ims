import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface Location {
    id: number;
    name: string;
}

export default function SelectBranch({ locations }: { locations: Location[] }) {
    return (
        <>
            <Head title="Select Branch — GCash Monitor" />

            <div className="p-4 max-w-md">
                <h1 className="text-xl font-semibold mb-4">Select a Branch</h1>
                <p className="text-sm text-muted-foreground mb-4">
                    As Owner, choose which branch's GCash float you want to view or manage.
                </p>
                <div className="space-y-2">
                    {locations.map((loc) => (
                        <Button key={loc.id} variant="outline" className="w-full justify-start" asChild>
                            <Link href={`/gcash?location_id=${loc.id}`}>{loc.name}</Link>
                        </Button>
                    ))}
                </div>
            </div>
        </>
    );
}

SelectBranch.layout = {
    breadcrumbs: [{ title: 'GCash Monitor', href: '/gcash' }],
};
