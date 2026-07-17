import { useState, useEffect, useRef } from 'react';
import { offlineDb } from '@/lib/offline-db';

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

export function useOfflineProductSearch(query: string) {
    const [results, setResults] = useState<ProductResult[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        if (query.trim() === '') {
            setResults([]);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                if (navigator.onLine) {
                    const res = await fetch(`/products/search?q=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    setResults(data.products);
                } else {
                    // Offline — search the local Dexie cache instead
                    const q = query.toLowerCase();
                    const all = await offlineDb.cachedProducts.toArray();
                    const matches = all
                        .filter(
                            (p) =>
                                p.name.toLowerCase().includes(q) ||
                                p.barcode?.toLowerCase().includes(q) ||
                                p.sku.toLowerCase().includes(q)
                        )
                        .slice(0, 20);
                    setResults(matches);
                }
            } catch {
                // Network call failed even though navigator.onLine said true
                // (happens on flaky connections) — fall back to cache as a last resort
                const q = query.toLowerCase();
                const all = await offlineDb.cachedProducts.toArray();
                setResults(
                    all
                        .filter((p) => p.name.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q))
                        .slice(0, 20)
                );
            } finally {
                setLoading(false);
            }
        }, 200);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    return { results, loading };
}
