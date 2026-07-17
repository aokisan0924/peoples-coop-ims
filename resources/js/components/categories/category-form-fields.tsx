import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
                <Select
                    value={data.parent_id ? String(data.parent_id) : 'none'}
                    onValueChange={(value) => setData('parent_id', value === 'none' ? null : Number(value))}
                >
                    <SelectTrigger id="parent_id">
                        <SelectValue placeholder="None (top-level category)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None (top-level category)</SelectItem>
                        {parentOptions.map((option) => (
                            <SelectItem key={option.id} value={String(option.id)}>
                                {option.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.parent_id && <p className="text-sm text-red-600 mt-1">{errors.parent_id}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                    Leave blank for a top-level category (e.g. "Grocery"). Select a parent to make this a subcategory (e.g. "Dairy" under "Grocery").
                </p>
            </div>
        </div>
    );
}