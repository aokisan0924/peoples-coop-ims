import { useEffect, useMemo, useRef, useState } from 'react';
import CategoryQuickCreateDialog from '@/components/categories/category-quick-create-dialog';
import CameraBarcodeScanner from '@/components/shared/camera-barcode-scanner';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductFormData {
    name: string;
    barcode: string;
    category_id: number | null;
    base_unit_id: number | null;
    pack_unit_id: number | null;
    pack_conversion_factor: number | null;
    cost_price: string;
    markup_percentage: string;
    low_stock_threshold: number;
    is_active: boolean;
}

interface Option {
    id: number;
    name: string;
    abbreviation?: string;
}

interface Props {
    data: ProductFormData;
    setData: <K extends keyof ProductFormData>(
        key: K,
        value: ProductFormData[K],
    ) => void;
    errors: Partial<Record<keyof ProductFormData, string>>;
    categories: Option[];
    units: Option[];
    isEdit?: boolean;
}

export default function ProductFormFields({
    data,
    setData,
    errors,
    categories,
    units,
    isEdit,
}: Props) {
    const barcodeRef = useRef<HTMLInputElement>(null);

    // Local, appendable copy so a newly quick-created category shows up and
    // gets selected immediately, without waiting on an Inertia round-trip.
    const [localCategories, setLocalCategories] = useState(categories);
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');

    useEffect(() => {
        // Auto-focus barcode field so a USB scanner can scan immediately on page load
        barcodeRef.current?.focus();
    }, []);

    const categoryOptions = useMemo(
        () =>
            localCategories.map((cat) => ({
                value: String(cat.id),
                label: cat.name,
            })),
        [localCategories],
    );

    const unitOptions = useMemo(
        () =>
            units.map((unit) => ({
                value: String(unit.id),
                label: `${unit.name} (${unit.abbreviation})`,
            })),
        [units],
    );

    const packUnitOptions = useMemo(
        () => [{ value: 'none', label: 'None' }, ...unitOptions],
        [unitOptions],
    );

    // Live pricing preview — recalculates as cost/markup change
    const preview = useMemo(() => {
        const cost = parseFloat(data.cost_price) || 0;
        const markup = parseFloat(data.markup_percentage) || 0;
        const vatRate = 12; // matches config('pricing.vat_rate') default; server is source of truth

        const memberPiece = cost * (1 + markup / 100);
        const nonMemberPiece = memberPiece * (1 + vatRate / 100);

        let memberPack: number | null = null;
        let nonMemberPack: number | null = null;

        if (data.pack_conversion_factor && data.pack_conversion_factor >= 2) {
            const packCost = cost * data.pack_conversion_factor;
            memberPack = packCost * (1 + markup / 100);
            nonMemberPack = memberPack * (1 + vatRate / 100);
        }

        return {
            memberPiece: memberPiece.toFixed(2),
            nonMemberPiece: nonMemberPiece.toFixed(2),
            memberPack: memberPack?.toFixed(2) ?? null,
            nonMemberPack: nonMemberPack?.toFixed(2) ?? null,
        };
    }, [data.cost_price, data.markup_percentage, data.pack_conversion_factor]);

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    placeholder="e.g. Oreo Original 133g"
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
            </div>

            <div>
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                    id="barcode"
                    ref={barcodeRef}
                    value={data.barcode}
                    onChange={(e) => setData('barcode', e.target.value)}
                    placeholder="Scan with barcode reader, or leave blank to auto-generate"
                    autoComplete="off"
                />
                <div className="mt-2">
                    <CameraBarcodeScanner
                        onScan={(barcode) => setData('barcode', barcode)}
                        buttonLabel="Scan Manufacturer Barcode"
                    />
                </div>
                {errors.barcode && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.barcode}
                    </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                    Leave blank if this product has no manufacturer barcode —
                    the system will generate one you can print as a label.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="category_id">Category *</Label>
                    <Combobox
                        id="category_id"
                        options={categoryOptions}
                        value={
                            data.category_id ? String(data.category_id) : null
                        }
                        onChange={(value) =>
                            setData('category_id', Number(value))
                        }
                        placeholder="Select category"
                        searchPlaceholder="Search categories…"
                        emptyText="No matching categories."
                        onSearchChange={setCategorySearch}
                        createAction={{
                            label: '+ Add Category',
                            onSelect: () => setCategoryDialogOpen(true),
                        }}
                    />
                    {errors.category_id && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.category_id}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="base_unit_id">Base Selling Unit *</Label>
                    <Combobox
                        id="base_unit_id"
                        options={unitOptions}
                        value={
                            data.base_unit_id ? String(data.base_unit_id) : null
                        }
                        onChange={(value) =>
                            setData('base_unit_id', Number(value))
                        }
                        placeholder="e.g. Piece, Kilogram"
                        searchPlaceholder="Search units…"
                        emptyText="No matching units."
                    />
                    {errors.base_unit_id && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.base_unit_id}
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">
                    Pack Selling Option (optional)
                </p>
                <p className="-mt-2 text-xs text-muted-foreground">
                    Only fill this in if the product can also be sold by
                    pack/box (e.g. Oreo sold per piece OR per pack of 10).
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="pack_unit_id">Pack Unit</Label>
                        <Combobox
                            id="pack_unit_id"
                            options={packUnitOptions}
                            value={
                                data.pack_unit_id
                                    ? String(data.pack_unit_id)
                                    : 'none'
                            }
                            onChange={(value) =>
                                setData(
                                    'pack_unit_id',
                                    value === 'none' ? null : Number(value),
                                )
                            }
                            placeholder="e.g. Pack, Box"
                            searchPlaceholder="Search units…"
                            emptyText="No matching units."
                        />
                    </div>

                    <div>
                        <Label htmlFor="pack_conversion_factor">
                            Pieces per Pack
                        </Label>
                        <Input
                            id="pack_conversion_factor"
                            type="number"
                            min={2}
                            value={data.pack_conversion_factor ?? ''}
                            onChange={(e) =>
                                setData(
                                    'pack_conversion_factor',
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            placeholder="e.g. 10"
                        />
                        {errors.pack_conversion_factor && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.pack_conversion_factor}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="cost_price">Cost Price (₱) *</Label>
                    <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        min={0}
                        value={data.cost_price}
                        onChange={(e) => setData('cost_price', e.target.value)}
                        placeholder="How much you paid, per base unit"
                    />
                    {errors.cost_price && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.cost_price}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="markup_percentage">Markup % *</Label>
                    <Input
                        id="markup_percentage"
                        type="number"
                        step="0.01"
                        min={0}
                        value={data.markup_percentage}
                        onChange={(e) =>
                            setData('markup_percentage', e.target.value)
                        }
                    />
                    {errors.markup_percentage && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.markup_percentage}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                        Default: 18% (coop member markup)
                    </p>
                </div>
            </div>

            {/* Live pricing preview */}
            <div className="space-y-1 rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="mb-2 text-sm font-medium">Price Preview</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">
                            Member (piece):{' '}
                        </span>
                        <span className="font-medium">
                            ₱{preview.memberPiece}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">
                            Non-member (piece):{' '}
                        </span>
                        <span className="font-medium">
                            ₱{preview.nonMemberPiece}
                        </span>
                    </div>
                    {preview.memberPack && (
                        <>
                            <div>
                                <span className="text-muted-foreground">
                                    Member (pack):{' '}
                                </span>
                                <span className="font-medium">
                                    ₱{preview.memberPack}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">
                                    Non-member (pack):{' '}
                                </span>
                                <span className="font-medium">
                                    ₱{preview.nonMemberPack}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Non-member price includes 12% VAT on top of member price.
                    Final prices are calculated server-side at checkout.
                </p>
            </div>

            <div>
                <Label htmlFor="low_stock_threshold">
                    Low Stock Alert Threshold (base units) *
                </Label>
                <Input
                    id="low_stock_threshold"
                    type="number"
                    min={0}
                    value={data.low_stock_threshold}
                    onChange={(e) =>
                        setData('low_stock_threshold', Number(e.target.value))
                    }
                />
                {errors.low_stock_threshold && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.low_stock_threshold}
                    </p>
                )}
            </div>

            {isEdit && (
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="is_active"
                        checked={data.is_active}
                        onCheckedChange={(checked) =>
                            setData('is_active', checked === true)
                        }
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                        Active (visible in POS)
                    </Label>
                </div>
            )}

            <CategoryQuickCreateDialog
                open={categoryDialogOpen}
                onOpenChange={setCategoryDialogOpen}
                parentOptions={localCategories}
                initialName={categorySearch}
                onCreated={(category) => {
                    setLocalCategories((prev) =>
                        [...prev, category].sort((a, b) =>
                            a.name.localeCompare(b.name),
                        ),
                    );
                    setData('category_id', category.id);
                }}
            />
        </div>
    );
}
