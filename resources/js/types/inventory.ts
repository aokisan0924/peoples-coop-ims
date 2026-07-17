export interface Unit {
    id: number;
    name: string;
    abbreviation: string;
}

export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: Category | null;
    children?: Category[];
}

export interface Supplier {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    payment_terms: string | null;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
    barcode: string | null;
    category_id: number;
    category?: Category;
    base_unit_id: number;
    base_unit?: Unit;
    pack_unit_id: number | null;
    pack_unit?: Unit | null;
    pack_conversion_factor: number | null;
    cost_price: string; // Laravel decimal casts serialize as string in JSON
    markup_percentage: string;
    low_stock_threshold: number;
    is_active: boolean;
    total_stock?: number;
    is_low_stock?: boolean;
    member_piece_price?: number;
    non_member_piece_price?: number;
    member_pack_price?: number | null;
    non_member_pack_price?: number | null;
}

export interface StockBatch {
    id: number;
    product_id: number;
    product?: Product;
    supplier_id: number | null;
    supplier?: Supplier | null;
    received_qty: number;
    remaining_qty: number;
    cost_price: string;
    received_date: string;
    expiry_date: string | null;
}