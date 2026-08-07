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

            {/* 57mm-wide thermal paper, auto height (continuous roll) — the
                "40mm" in "57x40mm" paper specs refers to the roll's diameter,
                not a fixed page height, so we never cap height here.

                This page renders inside the app's persistent sidebar layout
                (see Receipt.layout below), so scoping print:hidden only on
                elements inside THIS component isn't enough — the sidebar,
                header, and breadcrumbs from that wrapping layout would still
                print. Hiding everything on the page by default and explicitly
                un-hiding only .print-receipt-only is what actually guarantees
                nothing else leaks into the printout, regardless of what
                layout ends up wrapping this page in the future. */}
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-receipt-only,
                    .print-receipt-only * {
                        visibility: visible;
                    }
                    .print-receipt-only {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 57mm;
                        margin: 0;
                        padding: 2mm;
                    }
                }
                @page {
                    size: 57mm auto;
                    margin: 0;
                }
            `}</style>

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

                {/* On screen: normal-sized card, easy to read while previewing.
                    In print: shrinks to fit 57mm paper — about 2mm margin on
                    each side, so content prints at ~53mm wide, with much
                    smaller text than the screen preview needs. */}
                <div className="receipt w-full max-w-sm rounded-lg border bg-white p-4 font-mono text-sm text-black shadow-sm print:w-[53mm] print:max-w-[53mm] print:rounded-none print:border-0 print:p-[2mm] print:text-[9px] print:leading-tight print:shadow-none">
                    <div className="mb-3 text-center print:mb-1">
                        <p className="text-base font-bold print:text-[11px]">
                            PEOPLE'S COOP
                        </p>
                        <p className="text-xs print:text-[8px]">
                            General Merchandise
                        </p>
                        <p className="mt-1 text-xs print:mt-0.5 print:text-[8px]">
                            {sale.receipt_number}
                        </p>
                        <p className="text-xs print:text-[8px]">
                            {new Date(sale.created_at).toLocaleString()}
                        </p>
                        <p className="text-xs print:text-[8px]">
                            Cashier: {sale.cashier.name}
                        </p>
                        <p className="text-xs print:text-[8px]">
                            {sale.is_member ? 'Member' : 'Non-Member'} Sale
                        </p>
                    </div>

                    <div className="my-2 border-t border-b border-dashed border-black py-2 print:my-1 print:py-1">
                        {sale.items.map((item) => (
                            <div
                                key={item.id}
                                className="mb-1 tabular-nums print:mb-0.5"
                            >
                                <p className="print:text-[9px] print:break-words">
                                    {item.product.name}
                                </p>
                                <div className="flex justify-between text-xs print:text-[8px]">
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

                    <div className="space-y-1 tabular-nums print:space-y-0.5">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₱{parseFloat(sale.subtotal).toFixed(2)}</span>
                        </div>
                        {!sale.is_member && (
                            <div className="flex justify-between text-xs print:text-[8px]">
                                <span>VAT included (12%)</span>
                                <span>
                                    ₱{parseFloat(sale.vat_amount).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="mt-1 flex justify-between border-t border-black pt-1 text-base font-bold print:mt-0.5 print:pt-0.5 print:text-[11px]">
                            <span>TOTAL</span>
                            <span>₱{parseFloat(sale.total).toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="mt-2 space-y-1 border-t border-dashed border-black pt-2 tabular-nums print:mt-1 print:space-y-0.5 print:pt-1">
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
                                <div className="flex justify-between text-xs print:text-[8px]">
                                    <span>Ref #</span>
                                    <span>{sale.gcash_reference}</span>
                                </div>
                            )}
                    </div>

                    <p className="mt-4 text-center text-xs print:mt-1.5 print:text-[8px]">
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
