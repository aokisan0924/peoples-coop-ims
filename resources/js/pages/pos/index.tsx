import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { usePosCart } from '@/hooks/use-pos-cart';
import {
    Minus,
    Plus,
    Search,
    Trash2,
    UserCheck,
    Users,
    ShoppingCart,
    PackageSearch,
    WifiOff,
} from 'lucide-react';
import SyncStatusBadge from '@/components/pos/sync-status-badge';
import { syncEngine } from '@/lib/sync-engine';
import { offlineDb, type CachedProduct } from '@/lib/offline-db';
import { cn } from '@/lib/utils';
import { type CartItem } from '@/types/inventory';

const QUICK_CASH = [50, 100, 200, 500, 1000];

function peso(n: number): string {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type PosCart = ReturnType<typeof usePosCart>;

export default function PosIndex() {
    const cart = usePosCart();
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
    const [amountTendered, setAmountTendered] = useState('');
    const [gcashReference, setGcashReference] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [cartSheetOpen, setCartSheetOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

    useEffect(() => {
        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);
        return () => {
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
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

    const change =
        paymentMethod === 'cash' && amountTendered ? Math.max(0, parseFloat(amountTendered) - cart.subtotal) : 0;

    function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        // Barcode scanners send an Enter after the code — if there's exactly one
        // exact barcode match, add it immediately without waiting for a tap.
        if (e.key === 'Enter') {
            const exactMatch = products.find((p) => p.barcode === query.trim());
            if (exactMatch) {
                cart.addProduct(exactMatch as CartProductInput, 'piece');
                setQuery('');
            }
        }
    }

    function addTile(product: CachedProduct, unitType: 'piece' | 'pack') {
        if (product.total_stock <= 0) return;
        cart.addProduct(product as CartProductInput, unitType);
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
            setCartSheetOpen(false);

            // Route to a local "queued" receipt view rather than /sales/{id}/receipt,
            // since we may not have a real server-side sale ID yet if offline.
            router.visit(`/pos/queued-receipt/${uuid}`);
        } catch {
            setError('Failed to queue sale locally. Try again.');
            setProcessing(false);
        }
    }

    const cartPanelProps = {
        cart,
        paymentMethod,
        setPaymentMethod,
        amountTendered,
        setAmountTendered,
        gcashReference,
        setGcashReference,
        error,
        processing,
        change,
        onCheckout: handleCheckout,
    };

    return (
        <div
            className="pos-terminal"
            style={{ '--pos-teal': '#00a79b', '--pos-green': '#8dc645' } as React.CSSProperties}
        >
            <Head title="Point of Sale" />

            <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
                {/* Catalog */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="sticky top-0 z-10 space-y-3 border-b bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:p-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search product or scan barcode…"
                                    className="pl-9"
                                    autoComplete="off"
                                />
                            </div>

                            {/* Mobile/tablet: cart is a sheet, opened here or from the bottom bar */}
                            <div className="lg:hidden">
                                <CartSheetTrigger cart={cart} onOpen={() => setCartSheetOpen(true)} />
                            </div>

                            <div className="hidden lg:block">
                                <SyncStatusBadge />
                            </div>
                        </div>

                        {!isOnline && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-500">
                                <WifiOff className="size-3.5" />
                                Working offline — sales are queued on this device and will sync automatically.
                            </div>
                        )}

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
                                        activeCategory === cat
                                            ? 'border-[var(--pos-teal)] bg-[var(--pos-teal)] text-white'
                                            : 'text-muted-foreground hover:bg-muted',
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 pb-24 sm:p-4 lg:pb-4">
                        {products.length === 0 && (
                            <EmptyState
                                icon={<PackageSearch className="size-9" />}
                                title="No products cached yet"
                                description="Connect once to load your catalog onto this device — from then on, browsing and search work with no signal."
                            />
                        )}

                        {products.length > 0 && filteredProducts.length === 0 && (
                            <EmptyState
                                icon={<Search className="size-9" />}
                                title="No products match"
                                description="Try a different search term or category."
                            />
                        )}

                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <ProductTile
                                    key={product.id}
                                    product={product}
                                    isMember={cart.isMember}
                                    onAdd={(unitType) => addTile(product, unitType)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Desktop / large tablet: cart docked to the side */}
                <div className="hidden w-[400px] shrink-0 flex-col border-l bg-card/40 p-4 lg:flex xl:w-[440px]">
                    <CartPanel {...cartPanelProps} />
                </div>
            </div>

            {/* Mobile / small tablet: sticky checkout bar + slide-up cart sheet */}
            <div className="lg:hidden">
                {cart.items.length > 0 && !cartSheetOpen && (
                    <button
                        type="button"
                        onClick={() => setCartSheetOpen(true)}
                        className="fixed inset-x-3 bottom-3 z-20 flex items-center justify-between gap-3 rounded-xl bg-[var(--pos-teal)] px-4 py-3.5 text-white shadow-lg shadow-black/20"
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <ShoppingCart className="size-4" />
                            {cart.items.reduce((n, i) => n + i.quantity, 0)} item
                            {cart.items.reduce((n, i) => n + i.quantity, 0) !== 1 ? 's' : ''}
                        </span>
                        <span className="font-mono text-base font-bold tabular-nums">{peso(cart.subtotal)}</span>
                        <span className="text-sm font-medium underline-offset-2">View cart</span>
                    </button>
                )}

                <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
                    <SheetContent side="bottom" className="flex h-[92vh] flex-col p-0">
                        <SheetHeader className="border-b px-4 py-3">
                            <SheetTitle className="flex items-center justify-between text-base">
                                Cart
                                <SyncStatusBadge />
                            </SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-1 flex-col overflow-hidden p-4">
                            <CartPanel {...cartPanelProps} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

// The offline product cache uses a slightly different shape than the live API
// result type CartItem/addProduct expects — same fields, this just satisfies TS.
type CartProductInput = Parameters<PosCart['addProduct']>[0];

function CartSheetTrigger({ cart, onOpen }: { cart: PosCart; onOpen: () => void }) {
    const count = cart.items.reduce((n, i) => n + i.quantity, 0);
    return (
        <button
            type="button"
            onClick={onOpen}
            className="relative flex size-9 shrink-0 items-center justify-center rounded-md border text-foreground hover:bg-muted"
            aria-label="Open cart"
        >
            <ShoppingCart className="size-4" />
            {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-5 min-w-5 items-center justify-center rounded-full bg-[var(--pos-teal)] px-1 text-[10px] font-bold text-white">
                    {count}
                </span>
            )}
        </button>
    );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">{icon}</div>
            <p className="text-sm font-medium">{title}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
        </div>
    );
}

function ProductTile({
    product,
    isMember,
    onAdd,
}: {
    product: CachedProduct;
    isMember: boolean;
    onAdd: (unitType: 'piece' | 'pack') => void;
}) {
    const outOfStock = product.total_stock <= 0;
    const lowStock = !outOfStock && product.total_stock <= 10;
    const piecePrice = isMember ? product.member_piece_price : (product.non_member_piece_price ?? product.member_piece_price);
    const packPrice = isMember ? product.member_pack_price : product.non_member_pack_price;

    return (
        <motion.div
            whileTap={outOfStock ? undefined : { scale: 0.96 }}
            className={cn(
                'flex flex-col overflow-hidden rounded-xl border bg-card text-left shadow-sm transition-colors',
                outOfStock ? 'opacity-50' : 'hover:border-[var(--pos-teal)]',
            )}
        >
            <button
                type="button"
                onClick={() => onAdd('piece')}
                disabled={outOfStock}
                className="flex flex-1 flex-col items-start p-3 text-left disabled:cursor-not-allowed"
            >
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">{product.name}</p>
                <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[var(--pos-teal)]">{peso(piecePrice)}</p>
                <span
                    className={cn(
                        'mt-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        outOfStock
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                            : lowStock
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-muted text-muted-foreground',
                    )}
                >
                    {outOfStock ? 'Out of stock' : `${product.total_stock} in stock`}
                </span>
            </button>

            {product.pack_conversion_factor && !outOfStock && (
                <button
                    type="button"
                    onClick={() => onAdd('pack')}
                    className="border-t px-3 py-2 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-[var(--pos-teal)]"
                >
                    + Pack of {product.pack_conversion_factor} · {packPrice != null ? peso(packPrice) : '—'}
                </button>
            )}
        </motion.div>
    );
}

interface CartPanelProps {
    cart: PosCart;
    paymentMethod: 'cash' | 'gcash';
    setPaymentMethod: (m: 'cash' | 'gcash') => void;
    amountTendered: string;
    setAmountTendered: (v: string) => void;
    gcashReference: string;
    setGcashReference: (v: string) => void;
    error: string;
    processing: boolean;
    change: number;
    onCheckout: () => void;
}

function CartPanel({
    cart,
    paymentMethod,
    setPaymentMethod,
    amountTendered,
    setAmountTendered,
    gcashReference,
    setGcashReference,
    error,
    processing,
    change,
    onCheckout,
}: CartPanelProps) {
    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 hidden items-center justify-between gap-2 lg:flex">
                <h2 className="text-lg font-semibold">Cart</h2>
                <SyncStatusBadge />
            </div>

            <div className="mb-3 flex overflow-hidden rounded-lg border">
                <button
                    type="button"
                    onClick={() => cart.setIsMember(true)}
                    disabled={cart.items.length > 0}
                    className={cn(
                        'flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                        cart.isMember ? 'bg-[var(--pos-green)] text-white' : 'text-muted-foreground hover:bg-muted',
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
                        !cart.isMember ? 'bg-[var(--pos-green)] text-white' : 'text-muted-foreground hover:bg-muted',
                    )}
                >
                    <Users className="size-4" /> Non-Member
                </button>
            </div>
            {cart.items.length > 0 && (
                <p className="-mt-2 mb-3 text-xs text-muted-foreground">Clear the cart to change customer type.</p>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto">
                {cart.items.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <ShoppingCart className="size-5" />
                        </div>
                        <p className="text-sm text-muted-foreground">Cart is empty. Tap a product to add it.</p>
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {cart.items.map((item, index) => (
                        <CartRow key={`${item.product_id}-${item.unit_type}`} item={item} index={index} cart={cart} />
                    ))}
                </AnimatePresence>
            </div>

            <div className="mt-3 space-y-3 border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="font-mono tabular-nums">{peso(cart.subtotal)}</span>
                </div>

                <div className="flex overflow-hidden rounded-lg border">
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={cn(
                            'flex-1 py-2 text-sm font-medium transition-colors',
                            paymentMethod === 'cash' ? 'bg-[var(--pos-teal)] text-white' : 'text-muted-foreground hover:bg-muted',
                        )}
                    >
                        Cash
                    </button>
                    <button
                        type="button"
                        onClick={() => setPaymentMethod('gcash')}
                        className={cn(
                            'flex-1 py-2 text-sm font-medium transition-colors',
                            paymentMethod === 'gcash' ? 'bg-[var(--pos-teal)] text-white' : 'text-muted-foreground hover:bg-muted',
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
                            inputMode="decimal"
                            value={amountTendered}
                            onChange={(e) => setAmountTendered(e.target.value)}
                            placeholder="Amount tendered"
                            className="font-mono tabular-nums"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={() => setAmountTendered(cart.subtotal.toFixed(2))}
                                className="rounded-full border px-2.5 py-1 text-xs font-medium hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                            >
                                Exact
                            </button>
                            {QUICK_CASH.filter((v) => v >= cart.subtotal).map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setAmountTendered(v.toFixed(2))}
                                    className="rounded-full border px-2.5 py-1 text-xs font-medium hover:border-[var(--pos-teal)] hover:text-[var(--pos-teal)]"
                                >
                                    ₱{v}
                                </button>
                            ))}
                        </div>
                        {amountTendered && (
                            <p className="mt-1.5 font-mono text-sm tabular-nums text-muted-foreground">
                                Change: {peso(change)}
                            </p>
                        )}
                    </div>
                )}

                {paymentMethod === 'gcash' && (
                    <div>
                        <Input
                            value={gcashReference}
                            onChange={(e) => setGcashReference(e.target.value)}
                            placeholder="GCash reference number"
                            autoComplete="off"
                        />
                    </div>
                )}

                {error && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
                        {error}
                    </p>
                )}

                <Button
                    className="w-full bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90"
                    size="lg"
                    onClick={onCheckout}
                    disabled={processing || cart.items.length === 0}
                >
                    {processing ? 'Processing…' : `Complete Sale · ${peso(cart.subtotal)}`}
                </Button>
            </div>
        </div>
    );
}

function CartRow({ item, index, cart }: { item: CartItem; index: number; cart: PosCart }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border p-3"
        >
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {item.unit_type === 'pack' ? 'Pack' : 'Piece'} · <span className="font-mono tabular-nums">{peso(item.unit_price)}</span> each
                    </p>
                </div>
                <button
                    onClick={() => cart.removeItem(index)}
                    className="shrink-0 rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                    <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
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
                <p className="font-mono text-sm font-semibold tabular-nums">{peso(item.line_total)}</p>
            </div>
        </motion.div>
    );
}

PosIndex.layout = {
    breadcrumbs: [{ title: 'Point of Sale', href: '/pos' }],
};
