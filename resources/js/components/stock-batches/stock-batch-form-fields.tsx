import { Building2, CreditCard } from 'lucide-react';
import { useRef, useState, useEffect, useMemo } from 'react';
import CameraBarcodeScanner from '@/components/shared/camera-barcode-scanner';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import stockBatches from '@/routes/stock-batches';

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    cost_price: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface StockBatchFormData {
    product_id: number | null;
    supplier_id: number | null;
    location_id: number | null;
    received_qty: number;
    cost_price: string;
    received_date: string;
    expiry_date: string;
    paid_on_delivery: boolean;
    payable_due_date: string;
}

interface Props {
    data: StockBatchFormData;
    setData: <K extends keyof StockBatchFormData>(
        key: K,
        value: StockBatchFormData[K],
    ) => void;
    errors: Partial<Record<keyof StockBatchFormData, string>>;
    products: Product[];
    suppliers: Supplier[];
    locations: { id: number; name: string }[] | null;
    userLocationName: string | null;
}

export default function StockBatchFormFields({
    data,
    setData,
    errors,
    products,
    suppliers,
    locations,
    userLocationName,
}: Props) {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [looking, setLooking] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    // Read via ref rather than as a reactive dependency below — this effect
    // should only re-run when product_id changes, not whenever the products
    // array reference changes (e.g. an unrelated parent re-render).
    const productsRef = useRef(products);
    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        barcodeRef.current?.focus();
    }, []);

    // Pre-fill selected product's last known cost as a starting point.
    // Deliberately scoped to product_id only — including data.cost_price would
    // re-run this effect every time it changes, including when the user clears
    // the field to type their own value, immediately overwriting their edit
    // with the product's default cost.
    useEffect(() => {
        if (data.product_id) {
            const product = productsRef.current.find(
                (p) => p.id === data.product_id,
            );

            if (product && !data.cost_price) {
                setData('cost_price', product.cost_price);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.product_id, setData]);

    const locationOptions = useMemo(
        () =>
            (locations ?? []).map((location) => ({
                value: String(location.id),
                label: location.name,
            })),
        [locations],
    );

    const productOptions = useMemo(
        () =>
            products.map((product) => ({
                value: String(product.id),
                label: product.name,
                description: product.sku,
            })),
        [products],
    );

    const supplierOptions = useMemo(
        () => [
            { value: 'none', label: 'None' },
            ...suppliers.map((supplier) => ({
                value: String(supplier.id),
                label: supplier.name,
            })),
        ],
        [suppliers],
    );

    /**
     * Shared by both the keyboard/hardware-scanner path and the camera scanner —
     * checks the already-loaded product list first (instant), then falls back to
     * a server lookup in case the list is stale or incomplete. Previously the
     * camera scanner had no fallback at all (scanning an item not in the local
     * list just did nothing), and the keyboard path's fallback used Inertia's
     * router.post against an endpoint that returns plain JSON — Inertia doesn't
     * parse that as page props, so it silently failed too.
     */
    async function lookupBarcode(code: string) {
        const trimmed = code.trim();

        if (!trimmed) {
            return;
        }

        const localMatch = products.find((p) => p.barcode === trimmed);

        if (localMatch) {
            setData('product_id', localMatch.id);
            setMatchedProduct(localMatch);
            setLookupError('');
            setBarcodeInput('');

            return;
        }

        setLooking(true);
        setLookupError('');

        try {
            const response = await fetch(stockBatches.lookupBarcode().url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector<HTMLMetaElement>(
                            'meta[name="csrf-token"]',
                        )?.content ?? '',
                },
                body: JSON.stringify({ barcode: trimmed }),
            });

            const result = await response.json();

            if (result.found) {
                setData('product_id', result.product.id);
                setMatchedProduct(result.product);
                setLookupError('');
            } else {
                setMatchedProduct(null);
                setLookupError(
                    `No product found for barcode "${trimmed}". Add it as a new product first.`,
                );
            }
        } catch {
            setLookupError(
                'Could not reach the server to look up this barcode. Check your connection.',
            );
        } finally {
            setLooking(false);
            setBarcodeInput('');
        }
    }

    function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') {
            return;
        }

        e.preventDefault();
        lookupBarcode(barcodeInput);
    }

    return (
        <div className="space-y-4">
            {locations ? (
                <div>
                    <Label htmlFor="location_id">Receiving Branch *</Label>
                    <Combobox
                        id="location_id"
                        options={locationOptions}
                        value={
                            data.location_id ? String(data.location_id) : null
                        }
                        onChange={(value) =>
                            setData('location_id', Number(value))
                        }
                        placeholder="Select which branch is receiving this stock"
                        searchPlaceholder="Search branches…"
                        emptyText="No matching branches."
                    />
                    {errors.location_id && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.location_id}
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                    <Building2 className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">
                        Receiving into
                    </span>
                    <span className="font-medium">
                        {userLocationName ?? 'your assigned branch'}
                    </span>
                </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-4">
                <Label htmlFor="barcode_scan">
                    Scan Barcode to Find Product
                </Label>
                <Input
                    id="barcode_scan"
                    ref={barcodeRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleBarcodeKeyDown}
                    placeholder="Scan or type barcode, then press Enter"
                    autoComplete="off"
                />

                <div className="mt-2">
                    <CameraBarcodeScanner
                        onScan={(barcode) => lookupBarcode(barcode)}
                    />
                </div>
                {looking && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        Looking up barcode…
                    </p>
                )}
                {matchedProduct && (
                    <p className="mt-2 text-sm text-green-600">
                        ✓ Matched: {matchedProduct.name} ({matchedProduct.sku})
                    </p>
                )}
                {lookupError && (
                    <p className="mt-2 text-sm text-red-600">{lookupError}</p>
                )}
            </div>

            <div>
                <Label htmlFor="product_id">Product *</Label>
                <Combobox
                    id="product_id"
                    options={productOptions}
                    value={data.product_id ? String(data.product_id) : null}
                    onChange={(value) => {
                        setData('product_id', Number(value));
                        setMatchedProduct(
                            products.find((p) => p.id === Number(value)) ??
                                null,
                        );
                    }}
                    placeholder="Or select manually"
                    searchPlaceholder="Search by name or SKU…"
                    emptyText="No matching products."
                    createAction={{
                        label: '+ Add New Product (opens in a new tab)',
                        onSelect: () =>
                            window.open('/products/create', '_blank'),
                    }}
                />
                {errors.product_id && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.product_id}
                    </p>
                )}
            </div>

            <div>
                <Label htmlFor="supplier_id">Supplier</Label>
                <Combobox
                    id="supplier_id"
                    options={supplierOptions}
                    value={data.supplier_id ? String(data.supplier_id) : 'none'}
                    onChange={(value) => {
                        const supplierId =
                            value === 'none' ? null : Number(value);
                        setData('supplier_id', supplierId);

                        if (!supplierId) {
                            setData('paid_on_delivery', true);
                            setData('payable_due_date', '');
                        }
                    }}
                    placeholder="Select supplier (optional)"
                    searchPlaceholder="Search suppliers…"
                    emptyText="No matching suppliers."
                />
                {errors.supplier_id && (
                    <p className="mt-1 text-sm text-red-600">
                        {errors.supplier_id}
                    </p>
                )}
            </div>

            {data.supplier_id && (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                    <label
                        htmlFor="paid_on_delivery"
                        className="flex cursor-pointer items-start gap-2.5"
                    >
                        <Checkbox
                            id="paid_on_delivery"
                            checked={data.paid_on_delivery}
                            onCheckedChange={(checked) =>
                                setData('paid_on_delivery', checked === true)
                            }
                            className="mt-0.5"
                        />
                        <span>
                            <span className="flex items-center gap-1.5 text-sm font-medium">
                                <CreditCard className="size-3.5 text-muted-foreground" />
                                Paid on delivery
                            </span>
                            <span className="block text-xs text-muted-foreground">
                                {data.paid_on_delivery
                                    ? 'This supplier was paid in full for this delivery — nothing will be added to Accounts Payable.'
                                    : 'This delivery is on credit — the full batch cost will be recorded as unpaid in Accounts Payable.'}
                            </span>
                        </span>
                    </label>

                    {!data.paid_on_delivery && (
                        <div className="max-w-[220px] pl-7">
                            <Label htmlFor="payable_due_date">
                                Payment Due Date (optional)
                            </Label>
                            <Input
                                id="payable_due_date"
                                type="date"
                                value={data.payable_due_date}
                                onChange={(e) =>
                                    setData('payable_due_date', e.target.value)
                                }
                            />
                            {errors.payable_due_date && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.payable_due_date}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="received_qty">
                        Quantity Received (base units) *
                    </Label>
                    <Input
                        id="received_qty"
                        type="number"
                        min={1}
                        value={data.received_qty}
                        onChange={(e) =>
                            setData('received_qty', Number(e.target.value))
                        }
                    />
                    {errors.received_qty && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.received_qty}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="cost_price">
                        Cost Price per Unit (₱) *
                    </Label>
                    <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        min={0}
                        value={data.cost_price}
                        onChange={(e) => setData('cost_price', e.target.value)}
                    />
                    {errors.cost_price && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.cost_price}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="received_date">Date Received *</Label>
                    <Input
                        id="received_date"
                        type="date"
                        value={data.received_date}
                        onChange={(e) =>
                            setData('received_date', e.target.value)
                        }
                    />
                    {errors.received_date && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.received_date}
                        </p>
                    )}
                </div>

                <div>
                    <Label htmlFor="expiry_date">Expiry Date (optional)</Label>
                    <Input
                        id="expiry_date"
                        type="date"
                        value={data.expiry_date}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                    />
                    {errors.expiry_date && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.expiry_date}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
