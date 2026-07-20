import { useMemo, useState } from 'react';
import CategoryQuickCreateDialog from '@/components/categories/category-quick-create-dialog';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryFormData {
    name: string;
    parent_id: number | null;
}

interface ParentOption {
    id: number;
    name: string;
}

interface Props {
    data: CategoryFormData;
    setData: <K extends keyof CategoryFormData>(key: K, value: CategoryFormData[K]) => void;
    errors: Partial<Record<keyof CategoryFormData, string>>;
    parentOptions: ParentOption[];
}

export default function CategoryFormFields({ data, setData, errors, parentOptions }: Props) {
    const [localParentOptions, setLocalParentOptions] = useState(parentOptions);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [search, setSearch] = useState('');

    const options = useMemo(
        () => [
            { value: 'none', label: 'None (top-level category)' },
            ...localParentOptions.map((option) => ({ value: String(option.id), label: option.name })),
        ],
        [localParentOptions],
    );

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Grocery, Dairy, Hardware"
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
                <Label htmlFor="parent_id">Parent Category (optional)</Label>
                <Combobox
                    id="parent_id"
                    options={options}
                    value={data.parent_id ? String(data.parent_id) : 'none'}
                    onChange={(value) => setData('parent_id', value === 'none' ? null : Number(value))}
                    placeholder="None (top-level category)"
                    searchPlaceholder="Search categories…"
                    emptyText="No matching categories."
                    onSearchChange={setSearch}
                    createAction={{
                        label: '+ Add Category',
                        onSelect: () => setDialogOpen(true),
                    }}
                />
                {errors.parent_id && <p className="text-sm text-red-600 mt-1">{errors.parent_id}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                    Leave blank for a top-level category (e.g. "Grocery"). Select a parent to make this a subcategory (e.g. "Dairy" under "Grocery").
                </p>
            </div>

            <CategoryQuickCreateDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                parentOptions={localParentOptions}
                initialName={search}
                onCreated={(category) => {
                    setLocalParentOptions((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)));
                    setData('parent_id', category.id);
                }}
            />
        </div>
    );
}
