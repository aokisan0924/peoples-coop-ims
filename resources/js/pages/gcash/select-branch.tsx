import { Head, Link } from '@inertiajs/react';
import { Building2, ChevronRight, MapPinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Location {
    id: number;
    name: string;
}

export default function SelectBranch({ locations }: { locations: Location[] }) {
    return (
        <div style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title="Select Branch — GCash Monitor" />

            <div className="mx-auto max-w-[1600px] p-4 sm:p-6">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold tracking-tight">Select a Branch</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        As Owner, choose which branch's GCash float you want to view or manage.
                    </p>
                </div>

                {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <MapPinOff className="size-5" />
                        </div>
                        <p className="text-sm font-medium">No branches available</p>
                        <p className="max-w-xs text-sm text-muted-foreground">
                            Branches will appear here once they're set up.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {locations.map((loc) => (
                            <Button
                                key={loc.id}
                                variant="outline"
                                asChild
                                className="h-auto w-full justify-between gap-3 rounded-xl p-4 text-left hover:border-[var(--pos-teal)] hover:bg-[var(--pos-teal)]/5"
                            >
                                <Link href={`/gcash?location_id=${loc.id}`}>
                                    <span className="flex items-center gap-3">
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                            <Building2 className="size-4" />
                                        </span>
                                        <span className="font-medium">{loc.name}</span>
                                    </span>
                                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                                </Link>
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

SelectBranch.layout = {
    breadcrumbs: [{ title: 'GCash Monitor', href: '/gcash' }],
};
