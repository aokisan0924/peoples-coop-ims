import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import ProductSearchBar from '@/components/products/product-search-bar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Trash2 } from 'lucide-react';
import { Switch } from '@radix-ui/react-switch';
import { Users, UserCheck } from 'lucide-react';

export default function PosIndex() {
    const cart = usePosCart();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [gcashReference, setGcashReference] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const change = paymentMethod === 'cash' && amountTendered
        ? Math.max(0, parseFloat(amountTendered) - cart.subtotal)
        : 0;

    async function handleCheckout() {
        setError('');

        if (cart.items.length === 0) {
            setError('Cart is empty.');
            return;
        }

        if (paymentMethod === 'cash' && parseFloat(amountTendered || '0') < cart.subtotal) {
            setError('Amount tendered is less than the total.');
            return;
        }

        if (paymentMethod === 'gcash' && !gcashReference.trim()) {
            setError('GCash reference number is required.');
            return;
        }

        setProcessing(true);

        try {
            const response = await fetch('/sales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
                },
                body: JSON.stringify({
                    is_member: cart.isMember,
                    payment_method: paymentMethod,
                    amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : null,
                    gcash_reference: paymentMethod === 'gcash' ? gcashReference : null,
                    items: cart.items.map((item) => ({
                        product_id: item.product_id,
                        unit_type: item.unit_type,
                        quantity: item.quantity,
                    })),
                }),
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.message ?? 'Checkout failed.');
                setProcessing(false);
                return;
            }

            // Navigate to the receipt page, which auto-prints
            router.visit(`/sales/${data.sale.id}/receipt`);
        } catch (e) {
            setError('Network error — check your connection and try again.');
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Point of Sale" />

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Left: Search + results feed into cart */}
                <div className="flex-1 p-4 border-r overflow-y-auto">
                    <ProductSearchBar
                        autoFocus
                        placeholder="Search product or scan barcode..."
                        onSelect={(product) => cart.addProduct(product as any, 'piece')}
                    />

                    <p className="text-sm text-muted-foreground mt-4">
                        Search or scan a product above to add it to the cart.
                    </p>
                </div>

                {/* Right: Cart + checkout */}
                <div className="w-[420px] flex flex-col p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Cart</h2>
                        <div className="flex flex-col items-end gap-1">
                            <Button
                                type="button"
                                variant={cart.isMember ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => cart.setIsMember(!cart.isMember)}
                                disabled={cart.items.length > 0}
                            >
                                {cart.isMember ? (
                                    <UserCheck className="size-4" />
                                ) : (
                                    <Users className="size-4" />
                                )}
                                {cart.isMember ? 'Member' : 'Non-Member'}
                                <Switch
                                    checked={cart.isMember}
                                    className="ml-1 pointer-events-none"
                                />
                            </Button>
                            {cart.items.length > 0 ? (
                                <p className="text-xs text-muted-foreground">Clear cart to change customer type</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">Tap to switch</p>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {cart.items.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Cart is empty.
                            </p>
                        )}
                        {cart.items.map((item, index) => (
                            <div key={`${item.product_id}-${item.unit_type}`} className="border rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium truncate">{item.name}</p>
                                    <button onClick={() => cart.removeItem(index)}>
                                        <Trash2 className="size-4 text-red-500" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={1}
                                            max={item.max_available}
                                            value={item.quantity}
                                            onChange={(e) => cart.updateQuantity(index, Number(e.target.value))}
                                            className="w-16 h-8"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            × ₱{item.unit_price.toFixed(2)} ({item.unit_type})
                                        </span>
                                    </div>
                                    <p className="text-sm font-semibold">₱{item.line_total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4 mt-4 space-y-3">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₱{cart.subtotal.toFixed(2)}</span>
                        </div>

                        <div>
                            <Label>Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cash' | 'gcash')}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="gcash">GCash</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div>
                                <Label>Amount Tendered</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    placeholder="0.00"
                                />
                                {amountTendered && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Change: ₱{change.toFixed(2)}
                                    </p>
                                )}
                            </div>
                        )}

                        {paymentMethod === 'gcash' && (
                            <div>
                                <Label>GCash Reference No.</Label>
                                <Input
                                    value={gcashReference}
                                    onChange={(e) => setGcashReference(e.target.value)}
                                    placeholder="Reference number from GCash app"
                                />
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={processing || cart.items.length === 0}
                        >
                            {processing ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}

PosIndex.layout = {
    breadcrumbs: [
        { title: 'Point of Sale', href: '/pos' },
    ],
};