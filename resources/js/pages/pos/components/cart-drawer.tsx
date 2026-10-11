import React from 'react';
import type { CartItem } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, User } from 'lucide-react';

interface CartDrawerProps {
    cart: CartItem[];
    customerName: string;
    onCustomerNameChange: (val: string) => void;
    onUpdateQty: (productId: string, delta: number) => void;
    onRemoveItem: (productId: string) => void;
    onClearCart: () => void;
    onCheckout: () => void;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
}

export default function CartDrawer({
    cart,
    customerName,
    onCustomerNameChange,
    onUpdateQty,
    onRemoveItem,
    onClearCart,
    onCheckout,
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
}: CartDrawerProps) {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-slate-800" />
                    <span className="font-bold text-base text-slate-900">Pesanan Aktif</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
                        {totalItems}
                    </span>
                </div>
                {cart.length > 0 && (
                    <button
                        onClick={onClearCart}
                        className="text-xs font-medium text-slate-500 hover:text-slate-900 transition"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Customer input */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-white">
                <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => onCustomerNameChange(e.target.value)}
                        placeholder="Nama Pelanggan (Opsional)"
                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
                    />
                </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2 opacity-50" />
                        <p className="text-sm font-semibold text-slate-600">Keranjang Masih Kosong</p>
                        <p className="text-xs text-slate-400 mt-0.5">Pilih produk di katalog untuk menambahkan pesanan</p>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.product_id} className="pt-2.5 first:pt-0">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold text-slate-900 truncate">
                                        {item.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        {formatRupiah(item.price)}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-slate-900 whitespace-nowrap">
                                    {formatRupiah(item.subtotal)}
                                </span>
                            </div>

                            {/* Touch Qty Controls for Tablet */}
                            <div className="flex items-center justify-between mt-2">
                                <button
                                    onClick={() => onRemoveItem(item.product_id)}
                                    className="p-1 text-slate-400 hover:text-slate-700 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQty(item.product_id, -1)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-9 text-center text-xs font-bold text-slate-900">
                                        {item.qty}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => onUpdateQty(item.product_id, 1)}
                                        className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Price Calculations */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-medium">
                            <span>Diskon</span>
                            <span>-{formatRupiah(discountAmount)}</span>
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between">
                            <span>Pajak</span>
                            <span className="font-semibold text-slate-800">{formatRupiah(taxAmount)}</span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-700 uppercase">Total Bayar</span>
                    <span className="text-xl font-extrabold text-slate-900">
                        {formatRupiah(totalAmount)}
                    </span>
                </div>

                {/* Primary Touch CTA Button */}
                <button
                    type="button"
                    onClick={onCheckout}
                    disabled={cart.length === 0}
                    className="w-full mt-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
                >
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
