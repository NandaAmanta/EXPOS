export interface PosProduct {
    id: string;
    tenant_id?: string;
    outlet_id?: string | null;
    sku: string;
    barcode?: string | null;
    name: string;
    category: string;
    price: number | string;
    cost_price?: number | string;
    stock: number;
    image_url?: string | null;
    is_active?: boolean;
}

export interface CashierUser {
    id: number;
    name: string;
    role: string;
    email?: string;
}

export interface CartItem {
    product_id: string;
    sku: string;
    name: string;
    price: number;
    qty: number;
    subtotal: number;
}

export interface PosPaymentPayload {
    method: 'CASH' | 'QRIS' | 'DEBIT';
    amount: number;
    change_amount?: number;
    reference_no?: string | null;
}

export interface PosOrderPayload {
    id: string;
    order_number: string;
    customer_name?: string | null;
    cashier_id?: number | null;
    shift_id?: string | null;
    subtotal: number;
    tax_amount: number;
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
    }[];
    payments: PosPaymentPayload[];
    is_synced: 0 | 1;
    created_at: string;
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
}

export interface PosOutlet {
    id: string;
    tenant_id: string;
    name: string;
    code: string;
    address?: string | null;
    phone?: string | null;
    is_active: boolean;
}
