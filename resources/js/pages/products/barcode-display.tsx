import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Barcode as BarcodeIcon, Printer, Sun } from 'lucide-react';
import BarcodeLabel from '@/components/products/barcode-label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import products from '@/routes/products';
import type {Product} from '@/types/inventory';

export default function BarcodeDisplay({ product }: { product: Product }) {
    return (
        <div className="mx-auto max-w-2xl p-3 sm:p-6" style={{ '--pos-teal': '#00a79b' } as React.CSSProperties}>
            <Head title={`Barcode - ${product.name}`} />

            <Button variant="ghost" size="sm" asChild className="mb-3 -ml-2 gap-1.5 text-muted-foreground">
                <Link href={products.index().url}>
                    <ArrowLeft className="size-4" />
                    Products
                </Link>
            </Button>

            <Card className="animate-in fade-in-0 slide-in-from-bottom-2 shadow-sm duration-300">
                <CardContent className="flex flex-col items-center gap-5 p-5 text-center sm:p-8">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--pos-teal)]/10 text-[var(--pos-teal)] ring-1 ring-[var(--pos-teal)]/15">
                        <BarcodeIcon className="size-5" />
                    </div>

                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">Scan This Barcode</h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {product.name}
                            {product.sku && <span className="font-mono"> · {product.sku}</span>}
                        </p>
                    </div>

                    <div className="flex w-full justify-center overflow-x-auto" style={{ zoom: 0.7 }}>
                        <BarcodeLabel
                            barcode={product.barcode ?? product.sku}
                            productName={product.name}
                            price={product.member_piece_price?.toFixed(2)}
                            size="display"
                        />
                    </div>

                    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-left text-xs text-muted-foreground">
                        <Sun className="mt-0.5 size-3.5 shrink-0" />
                        <p>Point your barcode scanner at this screen. Increase screen brightness if the scan doesn't register on the first try.</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                        <Button asChild className="gap-1.5 bg-[var(--pos-teal)] text-white hover:bg-[var(--pos-teal)]/90 sm:flex-1">
                            <a href={`/products/${product.id}/label`} target="_blank" rel="noopener noreferrer">
                                <Printer className="size-4" />
                                Print Instead
                            </a>
                        </Button>
                        <Button variant="outline" asChild className="sm:flex-1">
                            <Link href={products.index().url}>Back to Products</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

BarcodeDisplay.layout = {
    breadcrumbs: [
        { title: 'Products', href: products.index().url },
        { title: 'Scan Barcode', href: '#' },
    ],
};
