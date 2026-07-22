import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { apiPost } from '@/lib/api-post';

interface ParentOption {
    id: number;
    name: string;
}

interface CreatedCategory {
    id: number;
    name: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Existing categories, reused as candidate parents — no separate fetch needed. */
    parentOptions: ParentOption[];
    /** Pre-fills the name field with whatever the user had typed into the combobox search. */
    initialName?: string;
    onCreated: (category: CreatedCategory) => void;
}

export default function CategoryQuickCreateDialog({
    open,
    onOpenChange,
    parentOptions,
    initialName = '',
    onCreated,
}: Props) {
    const [name, setName] = useState(initialName);
    const [parentId, setParentId] = useState<string>('none');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Re-seed the name each time the dialog opens with fresh search text.
    function handleOpenChange(next: boolean) {
        if (next) {
            setName(initialName);
            setParentId('none');
            setError('');
        }

        onOpenChange(next);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!name.trim()) {
            setError('Category name is required.');

            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const category = await apiPost<CreatedCategory>(
                '/categories/quick-create',
                {
                    name: name.trim(),
                    parent_id: parentId === 'none' ? null : Number(parentId),
                },
            );

            onCreated(category);
            onOpenChange(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Could not create category.',
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Category</DialogTitle>
                        <DialogDescription>
                            Creates the category immediately and selects it here
                            — no need to leave this form.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="quick-category-name">
                                Category Name *
                            </Label>
                            <Input
                                id="quick-category-name"
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Grocery, Dairy, Hardware"
                            />
                        </div>

                        <div>
                            <Label htmlFor="quick-category-parent">
                                Parent Category (optional)
                            </Label>
                            <Select
                                value={parentId}
                                onValueChange={setParentId}
                            >
                                <SelectTrigger
                                    id="quick-category-parent"
                                    className="w-full"
                                >
                                    <SelectValue placeholder="None (top-level category)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        None (top-level category)
                                    </SelectItem>
                                    {parentOptions.map((option) => (
                                        <SelectItem
                                            key={option.id}
                                            value={String(option.id)}
                                        >
                                            {option.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Adding…' : 'Add Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
