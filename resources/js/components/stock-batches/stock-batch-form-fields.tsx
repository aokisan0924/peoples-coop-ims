import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import stockBatches from '@/routes/stock-batches';
import CameraBarcodeScanner from '@/components/shared/camera-barcode-scanner';

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
    received_qty: number;
    cost_price: string;
    received_date: string;
    expiry_date: string;
}

interface Props {
    data: StockBatchFormData;
    setData: <K extends keyof StockBatchFormData>(key: K, value: StockBatchFormData[K]) => void;
    errors: Partial<Record<keyof StockBatchFormData, string>>;
    products: Product[];
    suppliers: Supplier[];
}

export default function StockBatchFormFields({ data, setData, errors, products, suppliers }: Props) {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
    const [lookupError, setLookupError] = useState('');
    const [looking, setLooking] = useState(false);
    const barcodeRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        barcodeRef.current?.focus();
    }, []);

    // Pre-fill selected product's last known cost as a starting point
    useEffect(() => {
        if (data.product_id) {
            const product = products.find((p) => p.id === data.product_id);
            if (product && !data.cost_price) {
                setData('cost_price', product.cost_price);
            }
        }
    }, [data.product_id]);

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
        if (!trimmed) return;

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
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
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
                setLookupError(`No product found for barcode "${trimmed}". Add it as a new product first.`);
            }
        } catch {
            setLookupError('Could not reach the server to look up this barcode. Check your connection.');
        } finally {
            setLooking(false);
            setBarcodeInput('');
        }
    }

    function handleBarcodeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        lookupBarcode(barcodeInput);
    }

    return (
        <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/30">
                <Label htmlFor="barcode_scan">Scan Barcode to Find Product</Label>
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
                    <CameraBarcodeScanner onScan={(barcode) => lookupBarcode(barcode)} />
                </div>
                {looking && <p className="text-sm text-muted-foreground mt-2">Looking up barcode…</p>}
                {matchedProduct && (
                    <p className="text-sm text-green-600 mt-2">
                        ✓ Matched: {matchedProduct.name} ({matchedProduct.sku})
                    </p>
                )}
                {lookupError && <p className="text-sm text-red-600 mt-2">{lookupError}</p>}
            </div>

            <div>
                <Label htmlFor="product_id">Product *</Label>
                <Select
                    value={data.product_id ? String(data.product_id) : ''}
                    onValueChange={(value) => {
                        setData('product_id', Number(value));
                        setMatchedProduct(products.find((p) => p.id === Number(value)) ?? null);
                    }}
                >
                    <SelectTrigger id="product_id">
                        <SelectValue placeholder="Or select manually" />
                    </SelectTrigger>
                    <SelectContent>
                        {products.map((product) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                                {product.name} ({product.sku})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.product_id && <p className="text-sm text-red-600 mt-1">{errors.product_id}</p>}
            </div>

            <div>
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select
                    value={data.supplier_id ? String(data.supplier_id) : 'none'}
                    onValueChange={(value) => setData('supplier_id', value === 'none' ? null : Number(value))}
                >
                    <SelectTrigger id="supplier_id">
                        <SelectValue placeholder="Select supplier (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={String(supplier.id)}>
                                {supplier.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="received_qty">Quantity Received (base units) *</Label>
                    <Input
                        id="received_qty"
                        type="number"
                        min={1}
                        value={data.received_qty}
                        onChange={(e) => setData('received_qty', Number(e.target.value))}
                    />
                    {errors.received_qty && <p className="text-sm text-red-600 mt-1">{errors.received_qty}</p>}
                </div>

                <div>
                    <Label htmlFor="cost_price">Cost Price per Unit (₱) *</Label>
                    <Input
                        id="cost_price"
                        type="number"
                        step="0.01"
                        min={0}
                        value={data.cost_price}
                        onChange={(e) => setData('cost_price', e.target.value)}
                    />
                    {errors.cost_price && <p className="text-sm text-red-600 mt-1">{errors.cost_price}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="received_date">Date Received *</Label>
                    <Input
                        id="received_date"
                        type="date"
                        value={data.received_date}
                        onChange={(e) => setData('received_date', e.target.value)}
                    />
                    {errors.received_date && <p className="text-sm text-red-600 mt-1">{errors.received_date}</p>}
                </div>

                <div>
                    <Label htmlFor="expiry_date">Expiry Date (optional)</Label>
                    <Input
                        id="expiry_date"
                        type="date"
                        value={data.expiry_date}
                        onChange={(e) => setData('expiry_date', e.target.value)}
                    />
                    {errors.expiry_date && <p className="text-sm text-red-600 mt-1">{errors.expiry_date}</p>}
                </div>
            </div>
        </div>
    );
}
