import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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

interface Props {
    onSelect: (product: ProductResult) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

export default function ProductSearchBar({ onSelect, placeholder, autoFocus }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProductResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        if (autoFocus) inputRef.current?.focus();
    }, [autoFocus]);

    useEffect(() => {
        clearTimeout(debounceRef.current);

        if (query.trim() === '') {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/products/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.products);
                setShowDropdown(true);
            } finally {
                setLoading(false);
            }
        }, 200); // debounce — also fast enough that a barcode scanner's rapid keystrokes + Enter still work

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        // Barcode scanners send an Enter after the code — if there's exactly
        // one exact barcode match, select it immediately without waiting for a click
        if (e.key === 'Enter') {
            const exactMatch = results.find((p) => p.barcode === query.trim());
            if (exactMatch) {
                handleSelect(exactMatch);
            }
        }
    }

    function handleSelect(product: ProductResult) {
        onSelect(product);
        setQuery('');
        setResults([]);
        setShowDropdown(false);
        inputRef.current?.focus();
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    placeholder={placeholder ?? 'Search by product name, or scan barcode...'}
                    className="pl-9"
                    autoComplete="off"
                />
            </div>

            {showDropdown && (
                <div className="absolute z-10 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-80 overflow-y-auto">
                    {loading && <p className="p-3 text-sm text-muted-foreground">Searching...</p>}
                    {!loading && results.length === 0 && (
                        <p className="p-3 text-sm text-muted-foreground">No products found.</p>
                    )}
                    {results.map((product) => (
                        <button
                            key={product.id}
                            type="button"
                            onClick={() => handleSelect(product)}
                            className="w-full text-left p-3 hover:bg-muted flex items-center justify-between border-b last:border-b-0"
                        >
                            <div>
                                <p className="text-sm font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {product.sku} · {product.category ?? 'Uncategorized'} · Stock: {product.total_stock}
                                </p>
                            </div>
                            <p className="text-sm font-semibold">₱{product.member_piece_price?.toFixed(2)}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
