import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle2,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Search,
    Store,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import locations from '@/routes/locations';

interface Location {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    is_main: boolean;
    is_active: boolean;
}

export default function LocationsIndex({
    locations: locationList,
}: {
    locations: Location[];
}) {
    const [query, setQuery] = useState('');

    function handleDelete(location: Location) {
        if (
            confirm(`Remove branch "${location.name}"? This cannot be undone.`)
        ) {
            router.delete(locations.destroy(location.id).url);
        }
    }

    const isEmpty = locationList.length === 0;

    const activeCount = useMemo(
        () => locationList.filter((l) => l.is_active).length,
        [locationList],
    );
    const inactiveCount = locationList.length - activeCount;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return locationList;
        }

        return locationList.filter((l) =>
            [l.name, l.address, l.phone].some((field) =>
                field?.toLowerCase().includes(q),
            ),
        );
    }, [locationList, query]);

    const noResults = !isEmpty && filtered.length === 0;

    return (
        <div
            style={
                {
                    '--pos-teal': '#00a79b',
                    '--pos-green': '#8dc645',
                } as React.CSSProperties
            }
        >
            <Head title="Branches" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">
                                Branches
                            </h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">
                                    {locationList.length}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Manage your store locations and their availability.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="hidden gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:inline-flex"
                    >
                        <Link href={locations.create().url}>
                            <Plus className="size-4" />
                            Add Branch
                        </Link>
                    </Button>
                </div>

                {!isEmpty && (
                    <>
                        {/* Stats — surfaces the shape of the data at a glance and fills the
                            wide header row that used to sit mostly empty on large screens. */}
                        <div className="grid grid-cols-3 gap-2.5 sm:max-w-xl sm:gap-3">
                            <StatCard
                                icon={Building2}
                                label="Total"
                                value={locationList.length}
                                accent="teal"
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Active"
                                value={activeCount}
                                accent="green"
                            />
                            <StatCard
                                icon={XCircle}
                                label="Inactive"
                                value={inactiveCount}
                                accent="red"
                            />
                        </div>

                        {/* Search */}
                        <div className="relative max-w-sm">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name, address, or phone…"
                                className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                                aria-label="Search branches"
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
                    </>
                )}

                {isEmpty ? (
                    <EmptyState />
                ) : noResults ? (
                    <NoResults query={query} onClear={() => setQuery('')} />
                ) : (
                    <>
                        {/* Table on larger screens — a 5-column table is comfortable there.
                            Cards on mobile, where that same table would force horizontal scroll. */}
                        <div className="hidden overflow-hidden rounded-xl border sm:block">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/60">
                                    <tr>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Name
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Address
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Phone
                                        </th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="p-3 text-right font-medium text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((location) => (
                                        <tr
                                            key={location.id}
                                            className="group border-t transition-colors hover:bg-muted/30"
                                        >
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                        <Building2 className="size-4" />
                                                    </div>
                                                    <span className="truncate">
                                                        {location.name}
                                                    </span>
                                                    {location.is_main && (
                                                        <Badge className="border-0 bg-[var(--pos-teal)] font-normal text-white">
                                                            Main
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="max-w-xs truncate p-3 text-muted-foreground">
                                                {location.address ?? '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground tabular-nums">
                                                {location.phone ?? '—'}
                                            </td>
                                            <td className="p-3">
                                                <StatusBadge
                                                    active={location.is_active}
                                                />
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="inline-flex gap-1.5 opacity-80 transition-opacity group-hover:opacity-100">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                        className="gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                                    >
                                                        <Link
                                                            href={
                                                                locations.edit(
                                                                    location.id,
                                                                ).url
                                                            }
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </Link>
                                                    </Button>
                                                    {!location.is_main && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    location,
                                                                )
                                                            }
                                                            className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                            {filtered.map((location) => (
                                <div
                                    key={location.id}
                                    className="rounded-xl border bg-card p-3 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5">
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                                                <Building2 className="size-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-medium">
                                                        {location.name}
                                                    </p>
                                                    {location.is_main && (
                                                        <Badge className="border-0 bg-[var(--pos-teal)] font-normal text-white">
                                                            Main
                                                        </Badge>
                                                    )}
                                                </div>
                                                {location.address && (
                                                    <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
                                                        <MapPin className="mt-0.5 size-3 shrink-0" />
                                                        <span className="line-clamp-2">
                                                            {location.address}
                                                        </span>
                                                    </p>
                                                )}
                                                {location.phone && (
                                                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Phone className="size-3 shrink-0" />
                                                        {location.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <StatusBadge
                                            active={location.is_active}
                                        />
                                    </div>
                                    <div className="mt-3 flex gap-1.5 border-t pt-2.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            className="flex-1 gap-1.5 hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                        >
                                            <Link
                                                href={
                                                    locations.edit(location.id)
                                                        .url
                                                }
                                            >
                                                <Pencil className="size-3.5" />
                                                Edit
                                            </Link>
                                        </Button>
                                        {!location.is_main && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    handleDelete(location)
                                                }
                                                className="flex-1 gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Floating action button — mirrors the categories/POS pattern for reachable
                primary actions on mobile, where the header button is hidden for space. */}
            {!isEmpty && (
                <Button
                    asChild
                    size="icon"
                    className="fixed right-4 bottom-4 z-20 size-12 rounded-full bg-[var(--pos-teal)] text-white shadow-lg shadow-black/20 hover:bg-[var(--pos-teal)]/90 sm:hidden"
                >
                    <Link href={locations.create().url} aria-label="Add Branch">
                        <Plus className="size-5" />
                    </Link>
                </Button>
            )}
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    accent: 'teal' | 'green' | 'red';
}) {
    const styles = {
        teal: 'bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]',
        green: 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]',
        red: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
    }[accent];

    return (
        <div className="flex items-center gap-2.5 rounded-xl border bg-card p-3">
            <div
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    styles,
                )}
            >
                <Icon className="size-4" />
            </div>
            <div className="min-w-0">
                <p className="text-lg leading-none font-semibold">{value}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                    {label}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <Badge
            className={cn(
                'gap-1.5 border-0 font-normal',
                active
                    ? 'bg-[var(--pos-green)]/15 text-[var(--pos-green)]'
                    : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
            )}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full',
                    active ? 'bg-[var(--pos-green)]' : 'bg-red-500',
                )}
            />
            {active ? 'Active' : 'Inactive'}
        </Badge>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Store className="size-7" />
            </div>
            <p className="text-sm font-medium">No branches yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Add your first branch to start managing its inventory and staff.
            </p>
            <Button
                asChild
                size="sm"
                className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
            >
                <Link href={locations.create().url}>
                    <Plus className="size-4" />
                    Add Branch
                </Link>
            </Button>
        </div>
    );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-7" />
            </div>
            <p className="text-sm font-medium">No branches match "{query}"</p>
            <p className="max-w-xs text-sm text-muted-foreground">
                Try a different name, address, or phone number.
            </p>
            <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onClear}
            >
                Clear search
            </Button>
        </div>
    );
}

LocationsIndex.layout = {
    breadcrumbs: [{ title: 'Branches', href: locations.index().url }],
};
