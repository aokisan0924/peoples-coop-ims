import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UnitFormData {
    name: string;
    abbreviation: string;
}

interface Props {
    data: UnitFormData;
    setData: <K extends keyof UnitFormData>(
        key: K,
        value: UnitFormData[K],
    ) => void;
    errors: Partial<Record<keyof UnitFormData, string>>;
}

export default function UnitFormFields({ data, setData, errors }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Unit Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Piece, Kilogram, Milliliter"
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
            </div>

            <div>
                <Label htmlFor="abbreviation">Abbreviation *</Label>
                <Input
                    id="abbreviation"
                    value={data.abbreviation}
                    onChange={(e) => setData('abbreviation', e.target.value)}
                    placeholder="e.g. pc, kg, mL"
                />
                {errors.abbreviation && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.abbreviation}
                    </p>
                )}
            </div>
        </div>
    );
}
