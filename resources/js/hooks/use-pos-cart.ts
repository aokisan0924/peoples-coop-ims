import { useState, useMemo } from 'react';
import type {CartItem} from '@/types/inventory';

interface ProductResult {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category: string | null;
    total_stock: number;
    member_piece_price: number;
    non_member_piece_price?: number;
    member_pack_price?: number | null;
    non_member_pack_price?: number | null;
    pack_conversion_factor?: number | null;
}

export function usePosCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isMember, setIsMember] = useState(true);

    function addProduct(product: ProductResult, unitType: 'piece' | 'pack' = 'piece') {
        setItems((prev) => {
            const existingIndex = prev.findIndex(
                (i) => i.product_id === product.id && i.unit_type === unitType
            );

            const unitPrice = unitType === 'pack'
                ? (isMember ? product.member_pack_price : product.non_member_pack_price) ?? 0
                : (isMember ? product.member_piece_price : product.non_member_piece_price ?? product.member_piece_price);

            if (existingIndex >= 0) {
                const updated = [...prev];
                const item = updated[existingIndex];
                const newQty = item.quantity + 1;
                updated[existingIndex] = {
                    ...item,
                    quantity: newQty,
                    line_total: round2(newQty * item.unit_price),
                };

                return updated;
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    unit_type: unitType,
                    quantity: 1,
                    unit_price: unitPrice,
                    line_total: round2(unitPrice),
                    max_available: product.total_stock,
                    has_pack_option: !!product.pack_conversion_factor,
                    pack_conversion_factor: product.pack_conversion_factor ?? null,
                },
            ];
        });
    }

    function updateQuantity(index: number, quantity: number) {
        if (quantity < 1) {
return;
}

        setItems((prev) => {
            const updated = [...prev];
            const item = updated[index];
            updated[index] = {
                ...item,
                quantity,
                line_total: round2(quantity * item.unit_price),
            };

            return updated;
        });
    }

    function removeItem(index: number) {
        setItems((prev) => prev.filter((_, i) => i !== index));
    }

    function clearCart() {
        setItems([]);
    }

    const subtotal = useMemo(
        () => round2(items.reduce((sum, item) => sum + item.line_total, 0)),
        [items]
    );

    return {
        items,
        isMember,
        setIsMember,
        addProduct,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
    };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}