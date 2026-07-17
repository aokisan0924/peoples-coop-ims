import { useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface SaleItem {
    id: number;
    unit_type: 'piece' | 'pack';
    quantity: number;
    unit_price: string;
    line_total: string;
    product: { name: string; sku: string };
}

interface Sale {
    id: number;
    receipt_number: string;
    is_member: boolean;
    subtotal: string;
    vat_amount: string;
    total: string;
    payment_method: 'cash' | 'gcash';
    amount_tendered: string | null;
    change_given: string | null;
    gcash_reference: string | null;
    created_at: string;
    cashier: { name: string };
    items: SaleItem[];
}

export default function Receipt({ sale }: { sale: Sale }) {
    useEffect(() => {
        // Auto-print as soon as the receipt renders
        const timer = setTimeout(() => window.print(), 400);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title={`Receipt - ${sale.receipt_number}`} />

            <div className="p-4 flex flex-col items-center">
                <div className="w-full max-w-sm print:hidden flex justify-between mb-4">
                    <Button variant="outline" asChild>
                        <Link href="/pos">← New Sale</Link>
                    </Button>
                    <Button onClick={() => window.print()}>Print Again</Button>
                </div>

                <div className="receipt w-full max-w-sm bg-white text-black p-4 font-mono text-sm border">
                    <div className="text-center mb-3">
                        <p className="font-bold text-base">PEOPLE'S COOP</p>
                        <p className="text-xs">General Merchandise</p>
                        <p className="text-xs mt-1">{sale.receipt_number}</p>
                        <p className="text-xs">{new Date(sale.created_at).toLocaleString()}</p>
                        <p className="text-xs">Cashier: {sale.cashier.name}</p>
                        <p className="text-xs">{sale.is_member ? 'Member' : 'Non-Member'} Sale</p>
                    </div>

                    <div className="border-t border-b border-dashed border-black py-2 my-2">
                        {sale.items.map((item) => (
                            <div key={item.id} className="mb-1">
                                <p>{item.product.name}</p>
                                <div className="flex justify-between text-xs">
                                    <span>
                                        {item.quantity} {item.unit_type} × ₱{parseFloat(item.unit_price).toFixed(2)}
                                    </span>
                                    <span>₱{parseFloat(item.line_total).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₱{parseFloat(sale.subtotal).toFixed(2)}</span>
                        </div>
                        {!sale.is_member && (
                            <div className="flex justify-between text-xs">
                                <span>VAT included (12%)</span>
                                <span>₱{parseFloat(sale.vat_amount).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base border-t border-black pt-1 mt-1">
                            <span>TOTAL</span>
                            <span>₱{parseFloat(sale.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed border-black mt-2 pt-2 space-y-1">
                        <div className="flex justify-between">
                            <span>{sale.payment_method === 'cash' ? 'Cash' : 'GCash'}</span>
                            <span>
                                ₱{sale.payment_method === 'cash'
                                    ? parseFloat(sale.amount_tendered ?? '0').toFixed(2)
                                    : parseFloat(sale.total).toFixed(2)}
                            </span>
                        </div>
                        {sale.payment_method === 'cash' && sale.change_given && (
                            <div className="flex justify-between">
                                <span>Change</span>
                                <span>₱{parseFloat(sale.change_given).toFixed(2)}</span>
                            </div>
                        )}
                        {sale.payment_method === 'gcash' && sale.gcash_reference && (
                            <div className="flex justify-between text-xs">
                                <span>Ref #</span>
                                <span>{sale.gcash_reference}</span>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-xs mt-4">Thank you for shopping with us!</p>
                </div>
            </div>
        </>
    );
}

Receipt.layout = {
    breadcrumbs: [
        { title: 'Point of Sale', href: '/pos' },
        { title: 'Receipt', href: '#' },
    ],
};