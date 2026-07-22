import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface Props {
    barcode: string;
    productName: string;
    price?: string;
    size?: 'label' | 'display';
}

export default function BarcodeLabel({
    barcode,
    productName,
    price,
    size = 'label',
}: Props) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, barcode, {
                format: 'CODE128',
                width: size === 'display' ? 3 : 1.5,
                height: size === 'display' ? 100 : 40,
                fontSize: size === 'display' ? 20 : 12,
                margin: size === 'display' ? 16 : 4,
                displayValue: true,
                background: '#ffffff',
                lineColor: '#000000',
            });
        }
    }, [barcode, size]);

    return (
        <div
            className={`barcode-label flex break-inside-avoid flex-col items-center justify-center border border-dashed border-gray-300 p-2 text-center ${size === 'display' ? 'rounded-xl bg-white p-8' : ''}`}
        >
            <p
                className={
                    size === 'display'
                        ? 'mb-2 text-lg font-semibold'
                        : 'w-full truncate text-xs font-medium'
                }
            >
                {productName}
            </p>
            <svg ref={svgRef}></svg>
            {price && (
                <p
                    className={
                        size === 'display'
                            ? 'mt-2 text-2xl font-bold'
                            : 'text-sm font-semibold'
                    }
                >
                    ₱{price}
                </p>
            )}
        </div>
    );
}
