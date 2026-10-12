export interface ProductVariant {
    name: string;
    price?: number;
    additional_price?: number;
}

export interface PosCategory {
    id: string;
    tenant_id?: string;
    outlet_id?: string | null;
    name: string;
    slug?: string | null;
    description?: string | null;
    is_active?: boolean;
}

export interface PosProduct {
    id: string;
    tenant_id?: string;
    outlet_id?: string | null;
    sku: string;
    barcode?: string | null;
    name: string;
    category: string;
    category_id?: string | null;
    price: number | string;
    cost_price?: number | string;
    stock: number;
    image_url?: string | null;
    variants?: ProductVariant[] | null;
    is_active?: boolean;
}

export interface CashierUser {
    id: number;
    name: string;
    role: string;
    email?: string;
}

export interface CartItem {
    cart_item_id?: string;
    product_id: string;
    sku: string;
    name: string;
    price: number;
    qty: number;
    subtotal: number;
    selected_variant?: string;
    item_notes?: string;
    discount?: number; // item-level discount nominal
}

export interface PosPaymentPayload {
    method: 'CASH' | 'QRIS' | 'DEBIT';
    amount: number;
    change_amount?: number;
    reference_no?: string | null;
}

export interface PosTax {
    id: number;
    name: string;
    code?: string | null;
    rate: number | string;
    type: 'exclusive' | 'inclusive';
    is_auto_apply: boolean;
    is_active: boolean;
}

export interface PosCharge {
    id: number;
    name: string;
    type: 'percent' | 'fixed';
    rate: number | string;
    is_taxable: boolean;
    applies_to: 'all' | 'dine_in' | 'takeaway' | 'delivery';
    is_auto_apply: boolean;
    is_active: boolean;
}

export interface AppliedCharge {
    id?: number;
    name: string;
    type: 'percent' | 'fixed';
    rate: number;
    amount: number;
    is_taxable: boolean;
}

export interface PosOrderPayload {
    id: string;
    order_number: string;
    outlet_id?: string | null;
    order_type?: 'dine_in' | 'takeaway' | 'delivery';
    table_number?: string | null;
    notes?: string | null;
    customer_name?: string | null;
    cashier_id?: number | null;
    shift_id?: string | null;
    subtotal: number;
    tax_amount: number;
    tax_rate?: number | null;
    tax_name?: string | null;
    charges_amount?: number;
    charges_detail?: AppliedCharge[];
    discount_amount: number;
    total_amount: number;
    payment_status: 'paid' | 'pending' | 'failed';
    items: {
        product_id: string;
        sku: string;
        product_name: string;
        qty: number;
        unit_price: number;
        subtotal: number;
        selected_variant?: string | null;
        notes?: string | null;
    }[];
    payments: PosPaymentPayload[];
    is_synced: 0 | 1;
    created_at: string;
}

export interface ParkedOrder {
    id: string;
    order_number: string;
    customer_name?: string;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
    table_number?: string;
    notes?: string;
    items: CartItem[];
    discount_type: 'percent' | 'nominal';
    discount_value: number;
    created_at: string;
}

export interface CashMovement {
    id: string;
    shift_id: string;
    user_id?: number | null;
    type: 'in' | 'out';
    amount: number;
    reason: string;
    created_at?: string;
    user?: {
        id: number;
        name: string;
    };
}

export interface PosShift {
    id: string;
    tenant_id?: string;
    outlet_id: string;
    user_id?: number | null;
    starting_cash: number | string;
    expected_cash?: number | string | null;
    actual_cash?: number | string | null;
    difference?: number | string | null;
    status: 'open' | 'closed';
    notes?: string | null;
    opened_at: string;
    closed_at?: string | null;
    user?: {
        id: number;
        name: string;
    };
    orders_count?: number;
    cash_movements?: CashMovement[];
}

export interface PosOutlet {
    id: string;
    tenant_id?: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    receipt_header?: string | null;
    receipt_footer?: string | null;
    is_active: boolean;
}
