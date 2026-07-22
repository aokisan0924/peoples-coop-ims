import JsBarcode from 'jsbarcode';
import { useEffect, useRef } from 'react';

interface Props {
    barcode: string;
    productName: string;
    price?: string;
    size?: 'label' | 'display';
}

export default function BarcodeLabel({ barcode, productName, price, size = 'label' }: Props) {
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
        <div className={`barcode-label border border-dashed border-gray-300 p-2 flex flex-col items-center justify-center text-center break-inside-avoid ${size === 'display' ? 'bg-white p-8 rounded-xl' : ''}`}>
            <p className={size === 'display' ? 'text-lg font-semibold mb-2' : 'text-xs font-medium truncate w-full'}>
                {productName}
            </p>
            <svg ref={svgRef}></svg>
            {price && <p className={size === 'display' ? 'text-2xl font-bold mt-2' : 'text-sm font-semibold'}>₱{price}</p>}
        </div>
    );
}