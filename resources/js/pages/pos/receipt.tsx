import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Printer } from 'lucide-react';
import { useEffect } from 'react';
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

            <div className="flex flex-col items-center px-4 py-8 print:p-0">
                <div className="mb-5 flex w-full max-w-sm items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400 print:hidden">
                    <CheckCircle2 className="size-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Sale completed — {sale.receipt_number}
                    </p>
                </div>

                <div className="mb-4 flex w-full max-w-sm justify-between gap-2 print:hidden">
                    <Button variant="outline" asChild>
                        <Link href="/pos">← New Sale</Link>
                    </Button>
                    <Button
                        onClick={() => window.print()}
                        className="gap-1.5 bg-[#00a79b] text-white hover:bg-[#00a79b]/90"
                    >
                        <Printer className="size-4" />
                        Print Again
                    </Button>
                </div>

                <div className="receipt w-full max-w-sm rounded-lg border bg-white p-4 font-mono text-sm text-black shadow-sm print:rounded-none print:border-0 print:shadow-none">
                    <div className="mb-3 text-center">
                        <p className="text-base font-bold">PEOPLE'S COOP</p>
                        <p className="text-xs">General Merchandise</p>
                        <p className="mt-1 text-xs">{sale.receipt_number}</p>
                        <p className="text-xs">
                            {new Date(sale.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs">Cashier: {sale.cashier.name}</p>
                        <p className="text-xs">
                            {sale.is_member ? 'Member' : 'Non-Member'} Sale
                        </p>
                    </div>

                    <div className="my-2 border-t border-b border-dashed border-black py-2">
                        {sale.items.map((item) => (
                            <div key={item.id} className="mb-1 tabular-nums">
                                <p>{item.product.name}</p>
                                <div className="flex justify-between text-xs">
                                    <span>
                                        {item.quantity} {item.unit_type} × ₱
                                        {parseFloat(item.unit_price).toFixed(2)}
                                    </span>
                                    <span>
                                        ₱
                                        {parseFloat(item.line_total).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-1 tabular-nums">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₱{parseFloat(sale.subtotal).toFixed(2)}</span>
                        </div>
                        {!sale.is_member && (
                            <div className="flex justify-between text-xs">
                                <span>VAT included (12%)</span>
                                <span>
                                    ₱{parseFloat(sale.vat_amount).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="mt-1 flex justify-between border-t border-black pt-1 text-base font-bold">
                            <span>TOTAL</span>
                            <span>₱{parseFloat(sale.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-2 space-y-1 border-t border-dashed border-black pt-2 tabular-nums">
                        <div className="flex justify-between">
                            <span>
                                {sale.payment_method === 'cash'
                                    ? 'Cash'
                                    : 'GCash'}
                            </span>
                            <span>
                                ₱
                                {sale.payment_method === 'cash'
                                    ? parseFloat(
                                          sale.amount_tendered ?? '0',
                                      ).toFixed(2)
                                    : parseFloat(sale.total).toFixed(2)}
                            </span>
                        </div>
                        {sale.payment_method === 'cash' &&
                            sale.change_given && (
                                <div className="flex justify-between">
                                    <span>Change</span>
                                    <span>
                                        ₱
                                        {parseFloat(sale.change_given).toFixed(
                                            2,
                                        )}
                                    </span>
                                </div>
                            )}
                        {sale.payment_method === 'gcash' &&
                            sale.gcash_reference && (
                                <div className="flex justify-between text-xs">
                                    <span>Ref #</span>
                                    <span>{sale.gcash_reference}</span>
                                </div>
                            )}
                    </div>

                    <p className="mt-4 text-center text-xs">
                        Thank you for shopping with us!
                    </p>
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
