import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { type Unit } from '@/types/inventory';
import units from '@/routes/units';

export default function UnitsIndex({ units: unitList }: { units: Unit[] }) {
    function handleDelete(unit: Unit) {
        if (confirm(`Remove unit "${unit.name}"? This cannot be undone.`)) {
            router.delete(units.destroy(unit.id).url);
        }
    }

    return (
        <>
            <Head title="Units" />

            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-semibold">Units of Measure</h1>
                    <Button asChild>
                        <Link href={units.create().url}>+ Add Unit</Link>
                    </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Abbreviation</th>
                                <th className="text-right p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unitList.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                        No units yet. Add your first one (e.g. Piece, Kilogram).
                                    </td>
                                </tr>
                            )}
                            {unitList.map((unit) => (
                                <tr key={unit.id} className="border-t">
                                    <td className="p-3 font-medium">{unit.name}</td>
                                    <td className="p-3">{unit.abbreviation}</td>
                                    <td className="p-3 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={units.edit(unit.id).url}>Edit</Link>
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(unit)}
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
        </>
    );
}

UnitsIndex.layout = {
    breadcrumbs: [
        { title: 'Units', href: units.index().url },
    ],
};