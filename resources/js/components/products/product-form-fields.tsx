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
    pack_barcode: string;
    category_id: number | null;
    base_unit_id: number | null;
    pack_unit_id: number | null;
    pack_conversion_factor: number | null;
    cost_price: string;
    markup_percentage: string;
    member_piece_price_override: string;
    member_pack_price_override: string;
    low_stock_threshold: number;
    reorder_target_qty: number | null;
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
    const [showPriceOverrides, setShowPriceOverrides] = useState(
        Boolean(
            data.member_piece_price_override || data.member_pack_price_override,
        ),
    );

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

    // Live pricing preview — recalculates as cost/markup change, but a manual
    // member-price override (if set) always wins, same as the server-side
    // model logic. Non-member is always derived from member price + VAT.
    const preview = useMemo(() => {
        const cost = parseFloat(data.cost_price) || 0;
        const markup = parseFloat(data.markup_percentage) || 0;
        const vatRate = 12; // matches config('pricing.vat_rate') default; server is source of truth

        const memberPieceOverride = parseFloat(
            data.member_piece_price_override,
        );
        const memberPackOverride = parseFloat(data.member_pack_price_override);

        const memberPieceFormula = cost * (1 + markup / 100);
        const memberPiece = Number.isFinite(memberPieceOverride)
            ? memberPieceOverride
            : memberPieceFormula;
        const nonMemberPiece = memberPiece * (1 + vatRate / 100);

        let memberPack: number | null = null;
        let nonMemberPack: number | null = null;

        if (data.pack_conversion_factor && data.pack_conversion_factor >= 2) {
            const packCost = cost * data.pack_conversion_factor;
            const memberPackFormula = packCost * (1 + markup / 100);
            memberPack = Number.isFinite(memberPackOverride)
                ? memberPackOverride
                : memberPackFormula;
            nonMemberPack = memberPack * (1 + vatRate / 100);
        }

        return {
            memberPiece: memberPiece.toFixed(2),
            nonMemberPiece: nonMemberPiece.toFixed(2),
            memberPack: memberPack !== null ? memberPack.toFixed(2) : null,
            nonMemberPack:
                nonMemberPack !== null ? nonMemberPack.toFixed(2) : null,
            memberPieceIsOverridden: Number.isFinite(memberPieceOverride),
            memberPackIsOverridden: Number.isFinite(memberPackOverride),
        };
    }, [
        data.cost_price,
        data.markup_percentage,
        data.pack_conversion_factor,
        data.member_piece_price_override,
        data.member_pack_price_override,
    ]);

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

                {data.pack_unit_id && (
                    <div>
                        <Label htmlFor="pack_barcode">Pack Barcode</Label>
                        <Input
                            id="pack_barcode"
                            value={data.pack_barcode}
                            onChange={(e) =>
                                setData('pack_barcode', e.target.value)
                            }
                            placeholder="Scan the barcode printed on the box/pack, if different"
                            autoComplete="off"
                        />
                        <div className="mt-2">
                            <CameraBarcodeScanner
                                onScan={(barcode) =>
                                    setData('pack_barcode', barcode)
                                }
                                buttonLabel="Scan Pack Barcode"
                            />
                        </div>
                        {errors.pack_barcode && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.pack_barcode}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                            Many products print a different barcode on the box
                            than on the individual piece (e.g. Jack &lsquo;n
                            Jill Presto). Leave blank if this product&rsquo;s
                            pack uses the same barcode, or has none.
                        </p>
                    </div>
                )}
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
                        {preview.memberPieceIsOverridden && (
                            <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                manual
                            </span>
                        )}
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
                                {preview.memberPackIsOverridden && (
                                    <span className="ml-1.5 rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                        manual
                                    </span>
                                )}
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

            {/* Manual price override — optional. The markup formula above doesn't always
                match how an item is actually priced (e.g. a ₱4-cost item that's sold at a
                flat ₱9 for change-making reasons); this lets you type the real price instead. */}
            <div className="rounded-lg border p-4">
                <button
                    type="button"
                    onClick={() => setShowPriceOverrides((v) => !v)}
                    className="flex w-full items-center justify-between text-left text-sm font-medium"
                >
                    <span>Set exact prices manually (optional)</span>
                    <span className="text-xs font-normal text-[#00a79b]">
                        {showPriceOverrides ? 'Hide' : 'Show'}
                    </span>
                </button>

                {showPriceOverrides && (
                    <div className="mt-3 space-y-3">
                        <p className="text-xs text-muted-foreground">
                            Leave blank to keep using the automatic markup
                            calculation above. Fill in a price to charge that
                            exact amount instead — the non-member price is still
                            always calculated automatically as this price + 12%
                            VAT, it&rsquo;s never set separately.
                        </p>

                        <div
                            className={
                                data.pack_conversion_factor &&
                                data.pack_conversion_factor >= 2
                                    ? 'grid grid-cols-2 gap-4'
                                    : ''
                            }
                        >
                            <div>
                                <Label htmlFor="member_piece_price_override">
                                    Piece Price (₱)
                                </Label>
                                <Input
                                    id="member_piece_price_override"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    value={data.member_piece_price_override}
                                    onChange={(e) =>
                                        setData(
                                            'member_piece_price_override',
                                            e.target.value,
                                        )
                                    }
                                    placeholder={`Auto: ₱${(
                                        (parseFloat(data.cost_price) || 0) *
                                        (1 +
                                            (parseFloat(
                                                data.markup_percentage,
                                            ) || 0) /
                                                100)
                                    ).toFixed(2)}`}
                                />
                                {errors.member_piece_price_override && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.member_piece_price_override}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Non-member: ₱{preview.nonMemberPiece} (auto)
                                </p>
                            </div>

                            {data.pack_conversion_factor &&
                                data.pack_conversion_factor >= 2 && (
                                    <div>
                                        <Label htmlFor="member_pack_price_override">
                                            Pack Price (₱)
                                        </Label>
                                        <Input
                                            id="member_pack_price_override"
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={
                                                data.member_pack_price_override
                                            }
                                            onChange={(e) =>
                                                setData(
                                                    'member_pack_price_override',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={
                                                preview.memberPack
                                                    ? `Auto: ₱${preview.memberPack}`
                                                    : undefined
                                            }
                                        />
                                        {errors.member_pack_price_override && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {
                                                    errors.member_pack_price_override
                                                }
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Non-member: ₱
                                            {preview.nonMemberPack ?? '—'}{' '}
                                            (auto)
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <p className="mt-1 text-xs text-muted-foreground">
                        Flags this product as low once stock drops to this level.
                    </p>
                </div>
                <div>
                    <Label htmlFor="reorder_target_qty">
                        Restock Up To (base units)
                    </Label>
                    <Input
                        id="reorder_target_qty"
                        type="number"
                        min={data.low_stock_threshold}
                        value={data.reorder_target_qty ?? ''}
                        onChange={(e) =>
                            setData(
                                'reorder_target_qty',
                                e.target.value === '' ? null : Number(e.target.value),
                            )
                        }
                        placeholder={`Auto: ${data.low_stock_threshold * 3}`}
                    />
                    {errors.reorder_target_qty && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.reorder_target_qty}
                        </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                        When low, this is the level to restock back up to. Leave
                        blank to default to 3&times; the threshold above.
                    </p>
                </div>
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
