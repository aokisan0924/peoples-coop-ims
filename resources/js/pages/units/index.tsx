import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { type Unit } from '@/types/inventory';
import units from '@/routes/units';
import { Check, Pencil, Plus, Ruler, Search, Trash2, X } from 'lucide-react';

export default function UnitsIndex({ units: unitList }: { units: Unit[] }) {
    const [query, setQuery] = useState('');
    const [adding, setAdding] = useState(false);

    const isEmpty = unitList.length === 0;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return unitList;
        return unitList.filter((u) => u.name.toLowerCase().includes(q) || u.abbreviation.toLowerCase().includes(q));
    }, [unitList, query]);

    const noResults = !isEmpty && filtered.length === 0 && !adding;

    return (
        <div style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}>
            <Head title="Units" />

            <div className="mx-auto max-w-[1600px] space-y-5 p-3 pb-24 sm:p-6 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight">Units of Measure</h1>
                            {!isEmpty && (
                                <Badge className="border-0 bg-[var(--pos-green)]/15 font-normal text-[var(--pos-green)]">{unitList.length}</Badge>
                            )}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">Add, rename, or remove units right here — no separate page needed.</p>
                    </div>
                    <Button
                        onClick={() => setAdding(true)}
                        disabled={adding}
                        className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    >
                        <Plus className="size-4" />
                        Add Unit
                    </Button>
                </div>

                {!isEmpty && unitList.length > 8 && (
                    <div className="relative max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search units…"
                            className="pl-9 focus-visible:ring-[var(--pos-teal)]"
                            aria-label="Search units"
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

                {isEmpty && !adding ? (
                    <EmptyState onAdd={() => setAdding(true)} />
                ) : noResults ? (
                    <NoResults onClear={() => setQuery('')} />
                ) : (
                    // A single flowing multi-column list — reads top-to-bottom within a column, then
                    // wraps to the next, so wide screens show far more units at once than a table would.
                    <div className="sm:columns-2 lg:columns-3 xl:columns-4">
                        {adding && <AddRow onDone={() => setAdding(false)} />}
                        {filtered.map((unit) => (
                            <UnitRow key={unit.id} unit={unit} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function AddRow({ onDone }: { onDone: () => void }) {
    const [name, setName] = useState('');
    const [abbreviation, setAbbreviation] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function save() {
        if (!name.trim() || !abbreviation.trim()) return;
        setSaving(true);
        setError(null);
        router.post(
            units.store().url,
            { name, abbreviation },
            {
                preserveScroll: true,
                onSuccess: () => onDone(),
                onError: (errs) => {
                    setSaving(false);
                    setError(errs.name ?? errs.abbreviation ?? 'Could not save this unit.');
                },
            },
        );
    }

    return (
        <div className="mb-2.5 break-inside-avoid rounded-xl border-2 border-dashed border-[var(--pos-teal)]/40 bg-[var(--pos-teal)]/5 p-3">
            <div className="flex items-center gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    placeholder="Name (e.g. Kilogram)"
                    className="h-8 flex-1 bg-background text-sm"
                    autoFocus
                />
                <Input
                    value={abbreviation}
                    onChange={(e) => setAbbreviation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    placeholder="kg"
                    className="h-8 w-20 bg-background text-sm"
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
            <div className="mt-2 flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={onDone} disabled={saving}>
                    <X className="size-3.5" />
                    Cancel
                </Button>
                <Button
                    size="sm"
                    className="h-7 gap-1 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    onClick={save}
                    disabled={saving || !name.trim() || !abbreviation.trim()}
                >
                    <Check className="size-3.5" />
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </div>
        </div>
    );
}

function UnitRow({ unit }: { unit: Unit }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(unit.name);
    const [abbreviation, setAbbreviation] = useState(unit.abbreviation);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function save() {
        if (!name.trim() || !abbreviation.trim()) return;
        setSaving(true);
        setError(null);
        router.put(
            units.update(unit.id).url,
            { name, abbreviation },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaving(false);
                    setEditing(false);
                },
                onError: (errs) => {
                    setSaving(false);
                    setError(errs.name ?? errs.abbreviation ?? 'Could not save this unit.');
                },
            },
        );
    }

    function cancel() {
        setName(unit.name);
        setAbbreviation(unit.abbreviation);
        setError(null);
        setEditing(false);
    }

    function handleDelete() {
        if (confirm(`Remove unit "${unit.name}"? This cannot be undone.`)) {
            router.delete(units.destroy(unit.id).url, { preserveScroll: true });
        }
    }

    if (editing) {
        return (
            <div className="mb-2.5 break-inside-avoid rounded-xl border bg-card p-3">
                <div className="flex items-center gap-2">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && save()}
                        className="h-8 flex-1 text-sm"
                        autoFocus
                    />
                    <Input
                        value={abbreviation}
                        onChange={(e) => setAbbreviation(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && save()}
                        className="h-8 w-20 text-sm"
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
                <div className="mt-2 flex justify-end gap-1.5">
                    <Button size="icon" variant="ghost" className="size-7" onClick={cancel} disabled={saving} title="Cancel">
                        <X className="size-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        className="size-7 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                        onClick={save}
                        disabled={saving || !name.trim() || !abbreviation.trim()}
                        title="Save"
                    >
                        <Check className="size-3.5" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group mb-2.5 flex break-inside-avoid items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:border-[var(--pos-teal)]/40">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)]">
                <Ruler className="size-4" />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">{unit.name}</p>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-medium">{unit.abbreviation}</span>
            <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditing(true)} title="Edit">
                    <Pencil className="size-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                    title="Delete"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Ruler className="size-7" />
            </div>
            <p className="text-sm font-medium">No units yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Add your first one, e.g. Piece (pc) or Kilogram (kg).</p>
            <Button onClick={onAdd} size="sm" className="mt-2 gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90">
                <Plus className="size-4" />
                Add Unit
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
            <p className="text-sm font-medium">No units match your search</p>
            <p className="max-w-xs text-sm text-muted-foreground">Try a different name or abbreviation.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onClear}>
                Clear search
            </Button>
        </div>
    );
}

UnitsIndex.layout = {
    breadcrumbs: [{ title: 'Units', href: units.index().url }],
};
