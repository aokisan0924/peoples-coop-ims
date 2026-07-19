import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePosCart } from '@/hooks/use-pos-cart';
import { Minus, Plus, Search, Trash2, UserCheck, Users } from 'lucide-react';
import SyncStatusBadge from '@/components/pos/sync-status-badge';
import { syncEngine } from '@/lib/sync-engine';
import { offlineDb, type CachedProduct } from '@/lib/offline-db';
import { cn } from '@/lib/utils';

const QUICK_CASH = [50, 100, 200, 500, 1000];

export default function PosIndex() {
    const cart = usePosCart();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [gcashReference, setGcashReference] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    // Product catalog is read from the local offline cache, not fetched live per
    // keystroke — this is what actually makes browsing and search work with no signal.
    const [products, setProducts] = useState<CachedProduct[]>([]);
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        searchRef.current?.focus();
        offlineDb.cachedProducts.toArray().then(setProducts);
    }, []);

    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach((p) => set.add(p.category ?? 'Uncategorized'));
        return ['All', ...Array.from(set).sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) => {
            const matchesCategory = activeCategory === 'All' || (p.category ?? 'Uncategorized') === activeCategory;
            if (!matchesCategory) return false;
            if (q === '') return true;
            return (
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode ?? '').toLowerCase() === q
            );
        });
    }, [products, query, activeCategory]);

    const change = paymentMethod === 'cash' && amountTendered
        ? Math.max(0, parseFloat(amountTendered) - cart.subtotal)
        : 0;

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        // Barcode scanners send an Enter after the code — if there's exactly one
        // exact barcode match, add it immediately without waiting for a tap.
        if (e.key === 'Enter') {
            const exactMatch = products.find((p) => p.barcode === query.trim());
            if (exactMatch) {
                cart.addProduct(exactMatch as any, 'piece');
                setQuery('');
            }
        }
    }

    function addTile(product: CachedProduct, unitType: 'piece' | 'pack') {
        if (product.total_stock <= 0) return;
        cart.addProduct(product as any, unitType);
    }

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
            // Always queue locally first — this is the key offline-first behavior.
            // The cashier never waits on the network to complete a sale.
            const uuid = await syncEngine.queueSale({
                is_member: cart.isMember,
                payment_method: paymentMethod,
                amount_tendered: paymentMethod === 'cash' ? parseFloat(amountTendered) : null,
                gcash_reference: paymentMethod === 'gcash' ? gcashReference : null,
                items: cart.items.map((item) => ({
                    product_id: item.product_id,
                    unit_type: item.unit_type,
                    quantity: item.quantity,
                })),
            });

            cart.clearCart();
            setAmountTendered('');
            setGcashReference('');

            // Route to a local "queued" receipt view rather than /sales/{id}/receipt,
            // since we may not have a real server-side sale ID yet if offline.
            router.visit(`/pos/queued-receipt/${uuid}`);
        } catch (e) {
            setError('Failed to queue sale locally. Try again.');
            setProcessing(false);
        }
    }

    return (
        <>
            <Head title="Point of Sale" />

            <div className="flex h-[calc(100vh-4rem)]">
                {/* Left: browse + search feeds into cart */}
                <div className="flex flex-1 flex-col overflow-hidden border-r">
                    <div className="space-y-3 border-b p-4">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                ref={searchRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search product or scan barcode..."
                                className="pl-9"
                                autoComplete="off"
                            />
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                        activeCategory === cat
                                            ? 'border-[#00a79b] bg-[#00a79b] text-white'
                                            : 'text-muted-foreground hover:bg-muted',
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {products.length === 0 && (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                No products cached yet on this device. Connect once to load your catalog, then it
                                works offline from here on.
                            </p>
                        )}

                        {products.length > 0 && filteredProducts.length === 0 && (
                            <p className="py-12 text-center text-sm text-muted-foreground">No products match.</p>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => {
                                const outOfStock = product.total_stock <= 0;
                                const lowStock = !outOfStock && product.total_stock <= 10;

                                return (
                                    <div
                                        key={product.id}
                                        className={cn(
                                            'flex flex-col rounded-lg border p-3 text-left transition-colors',
                                            outOfStock ? 'opacity-50' : 'hover:border-[#00a79b] hover:bg-[#00a79b]/5',
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => addTile(product, 'piece')}
                                            disabled={outOfStock}
                                            className="flex flex-1 flex-col items-start text-left disabled:cursor-not-allowed"
                                        >
                                            <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.name}</p>
                                            <p className="mt-1 text-base font-semibold text-[#00a79b]">
                                                ₱{(cart.isMember ? product.member_piece_price : product.non_member_piece_price ?? product.member_piece_price).toFixed(2)}
                                            </p>
                                            <span
                                                className={cn(
                                                    'mt-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                    outOfStock
                                                        ? 'bg-red-100 text-red-700'
                                                        : lowStock
                                                          ? 'bg-amber-100 text-amber-700'
                                                          : 'bg-muted text-muted-foreground',
                                                )}
                                            >
                                                {outOfStock ? 'Out of stock' : `${product.total_stock} in stock`}
                                            </span>
                                        </button>

                                        {product.pack_conversion_factor && !outOfStock && (
                                            <button
                                                type="button"
                                                onClick={() => addTile(product, 'pack')}
                                                className="mt-2 rounded-md border border-dashed px-2 py-1 text-[11px] font-medium text-muted-foreground hover:border-[#00a79b] hover:text-[#00a79b]"
                                            >
                                                + Add as pack (₱
                                                {(cart.isMember ? product.member_pack_price : product.non_member_pack_price)?.toFixed(2)})
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right: cart + checkout */}
                <div className="flex w-[420px] flex-col p-4">
                    <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold">Cart</h2>
                        <SyncStatusBadge />
                    </div>

                    <div className="mb-4 flex overflow-hidden rounded-lg border">
                        <button
                            type="button"
                            onClick={() => cart.setIsMember(true)}
                            disabled={cart.items.length > 0}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                                cart.isMember ? 'bg-[#00a79b] text-white' : 'text-muted-foreground hover:bg-muted',
                            )}
                        >
                            <UserCheck className="size-4" /> Member
                        </button>
                        <button
                            type="button"
                            onClick={() => cart.setIsMember(false)}
                            disabled={cart.items.length > 0}
                            className={cn(
                                'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                                !cart.isMember ? 'bg-[#00a79b] text-white' : 'text-muted-foreground hover:bg-muted',
                            )}
                        >
                            <Users className="size-4" /> Non-Member
                        </button>
                    </div>
                    {cart.items.length > 0 && (
                        <p className="-mt-3 mb-4 text-xs text-muted-foreground">Clear the cart to change customer type.</p>
                    )}

                    <div className="flex-1 space-y-2 overflow-y-auto">
                        {cart.items.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Cart is empty. Tap a product to add it.
                            </p>
                        )}
                        {cart.items.map((item, index) => (
                            <div key={`${item.product_id}-${item.unit_type}`} className="rounded-lg border p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-sm font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.unit_type === 'pack' ? 'Pack' : 'Piece'} · ₱{item.unit_price.toFixed(2)} each
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => cart.removeItem(index)}
                                        className="shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => cart.updateQuantity(index, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                            className="flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
                                            aria-label="Decrease quantity"
                                        >
                                            <Minus className="size-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => cart.updateQuantity(index, item.quantity + 1)}
                                            disabled={item.quantity >= item.max_available}
                                            className="flex size-8 items-center justify-center rounded-md border disabled:opacity-40"
                                            aria-label="Increase quantity"
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold">₱{item.line_total.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 space-y-3 border-t pt-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₱{cart.subtotal.toFixed(2)}</span>
                        </div>

                        <div className="flex overflow-hidden rounded-lg border">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cash')}
                                className={cn(
                                    'flex-1 py-2 text-sm font-medium transition-colors',
                                    paymentMethod === 'cash' ? 'bg-[#00a79b] text-white' : 'text-muted-foreground hover:bg-muted',
                                )}
                            >
                                Cash
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('gcash')}
                                className={cn(
                                    'flex-1 py-2 text-sm font-medium transition-colors',
                                    paymentMethod === 'gcash' ? 'bg-[#00a79b] text-white' : 'text-muted-foreground hover:bg-muted',
                                )}
                            >
                                GCash
                            </button>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amountTendered}
                                    onChange={(e) => setAmountTendered(e.target.value)}
                                    placeholder="Amount tendered"
                                />
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setAmountTendered(cart.subtotal.toFixed(2))}
                                        className="rounded-full border px-2.5 py-1 text-xs font-medium hover:border-[#00a79b] hover:text-[#00a79b]"
                                    >
                                        Exact
                                    </button>
                                    {QUICK_CASH.filter((v) => v >= cart.subtotal).map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setAmountTendered(v.toFixed(2))}
                                            className="rounded-full border px-2.5 py-1 text-xs font-medium hover:border-[#00a79b] hover:text-[#00a79b]"
                                        >
                                            ₱{v}
                                        </button>
                                    ))}
                                </div>
                                {amountTendered && (
                                    <p className="mt-1 text-sm text-muted-foreground">Change: ₱{change.toFixed(2)}</p>
                                )}
                            </div>
                        )}

                        {paymentMethod === 'gcash' && (
                            <div>
                                <Input
                                    value={gcashReference}
                                    onChange={(e) => setGcashReference(e.target.value)}
                                    placeholder="GCash reference number"
                                />
                            </div>
                        )}

                        {error && <p className="text-sm text-red-600">{error}</p>}

                        <Button
                            className="w-full bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
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
