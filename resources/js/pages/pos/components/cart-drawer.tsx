import React, { useState } from 'react';
import type { AppliedCharge, CartItem, PosTax } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import {
    ShoppingBag,
    Plus,
    Minus,
    Trash2,
    ArrowRight,
    User,
    PauseCircle,
    Utensils,
    PackageCheck,
    Truck,
    Tag,
    ChevronDown,
    ChevronUp,
    FileText,
} from 'lucide-react';

interface CartDrawerProps {
    cart: CartItem[];
    customerName: string;
    onCustomerNameChange: (val: string) => void;
    orderType: 'dine_in' | 'takeaway' | 'delivery';
    onOrderTypeChange: (type: 'dine_in' | 'takeaway' | 'delivery') => void;
    tableNumber: string;
    onTableNumberChange: (table: string) => void;
    orderNotes: string;
    onOrderNotesChange: (notes: string) => void;
    onUpdateQty: (itemKey: string, delta: number) => void;
    onRemoveItem: (itemKey: string) => void;
    onClearCart: () => void;
    onHoldOrder: () => void;
    onOpenParkedOrders: () => void;
    parkedOrdersCount: number;
    onCheckout: () => void;
    subtotal: number;
    discountType: 'percent' | 'nominal';
    discountValue: number;
    onDiscountChange: (type: 'percent' | 'nominal', val: number) => void;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    appliedCharges?: AppliedCharge[];
    activeTax?: PosTax | null;
}

export default function CartDrawer({
    cart,
    customerName,
    onCustomerNameChange,
    orderType,
    onOrderTypeChange,
    tableNumber,
    onTableNumberChange,
    orderNotes,
    onOrderNotesChange,
    onUpdateQty,
    onRemoveItem,
    onClearCart,
    onHoldOrder,
    onOpenParkedOrders,
    parkedOrdersCount,
    onCheckout,
    subtotal,
    discountType,
    discountValue,
    onDiscountChange,
    discountAmount,
    taxAmount,
    totalAmount,
    appliedCharges = [],
    activeTax = null,
}: CartDrawerProps) {
    const [showDiscountPanel, setShowDiscountPanel] = useState(false);
    const [showOrderNotesInput, setShowOrderNotesInput] = useState(Boolean(orderNotes));

    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);

    const getItemKey = (item: CartItem) => {
        return item.cart_item_id || `${item.product_id}__${item.selected_variant || ''}`;
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-slate-200">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-slate-800" />
                    <span className="font-bold text-sm text-slate-900">Pesanan</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-xs font-semibold">
                        {totalItems}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Parked Orders Badge Button */}
                    <button
                        type="button"
                        onClick={onOpenParkedOrders}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                            parkedOrdersCount > 0
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title="Daftar antrean ditahan"
                    >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>Ditahan ({parkedOrdersCount})</span>
                    </button>

                    {cart.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearCart}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Order Type Tabs */}
            <div className="px-3 pt-2.5 pb-2 bg-slate-50/50 border-b border-slate-100 shrink-0 space-y-2">
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => onOrderTypeChange('dine_in')}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                            orderType === 'dine_in'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Utensils className="w-3.5 h-3.5" />
                        <span>Dine In</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onOrderTypeChange('takeaway')}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                            orderType === 'takeaway'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>Takeaway</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onOrderTypeChange('delivery')}
                        className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                            orderType === 'delivery'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Delivery</span>
                    </button>
                </div>

                {/* Table Number & Customer input */}
                <div className="flex items-center gap-2">
                    {orderType === 'dine_in' && (
                        <div className="w-28 shrink-0">
                            <input
                                type="text"
                                value={tableNumber}
                                onChange={(e) => onTableNumberChange(e.target.value)}
                                placeholder="No. Meja"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 focus:outline-hidden focus:border-slate-800"
                            />
                        </div>
                    )}
                    <div className="relative flex-1">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => onCustomerNameChange(e.target.value)}
                            placeholder="Pelanggan (Opsional)"
                            className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
                        />
                    </div>
                </div>

                {/* Notes Input Toggle */}
                {showOrderNotesInput ? (
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={orderNotes}
                            onChange={(e) => onOrderNotesChange(e.target.value)}
                            placeholder="Catatan pesanan keseluruhan..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:border-slate-800"
                        />
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowOrderNotesInput(true)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                        <FileText className="w-3 h-3" />
                        <span>+ Catatan Pesanan</span>
                    </button>
                )}
            </div>

            {/* Cart Item List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                        <ShoppingBag className="w-10 h-10 stroke-[1.5] mb-2 opacity-50 text-slate-400" />
                        <p className="text-xs font-semibold text-slate-600">Keranjang Masih Kosong</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Ketuk produk di katalog untuk menambahkan pesanan</p>
                    </div>
                ) : (
                    cart.map((item) => {
                        const itemKey = getItemKey(item);
                        return (
                            <div key={itemKey} className="pt-2.5 first:pt-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                                            {item.name}
                                        </h4>
                                        {item.selected_variant && (
                                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                                {item.selected_variant}
                                            </span>
                                        )}
                                        {item.item_notes && (
                                            <p className="text-[10px] text-slate-500 italic mt-0.5">
                                                * {item.item_notes}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                            {formatRupiah(item.price)}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                                        {formatRupiah(item.subtotal)}
                                    </span>
                                </div>

                                {/* Touch Qty Controls */}
                                <div className="flex items-center justify-between mt-2">
                                    <button
                                        type="button"
                                        onClick={() => onRemoveItem(itemKey)}
                                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                                        title="Hapus"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(itemKey, -1)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                                            {item.qty}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQty(itemKey, 1)}
                                            className="w-8 h-8 flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Calculations & Checkout */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
                <div className="space-y-1 text-xs text-slate-600">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-slate-800">{formatRupiah(subtotal)}</span>
                    </div>

                    {/* Discount Accordion Row */}
                    <div>
                        <div
                            onClick={() => setShowDiscountPanel(!showDiscountPanel)}
                            className="flex justify-between items-center cursor-pointer py-0.5 hover:text-slate-900"
                        >
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <Tag className="w-3 h-3" />
                                <span>Diskon</span>
                                {showDiscountPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </span>
                            <span className="font-semibold text-emerald-700">
                                {discountAmount > 0 ? `-${formatRupiah(discountAmount)}` : 'Atur Diskon'}
                            </span>
                        </div>

                        {showDiscountPanel && (
                            <div className="p-2.5 mt-1 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
                                        <button
                                            type="button"
                                            onClick={() => onDiscountChange('percent', discountValue)}
                                            className={`px-2 py-1 font-bold ${
                                                discountType === 'percent'
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            %
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDiscountChange('nominal', discountValue)}
                                            className={`px-2 py-1 font-bold ${
                                                discountType === 'nominal'
                                                    ? 'bg-slate-900 text-white'
                                                    : 'bg-slate-50 text-slate-600'
                                            }`}
                                        >
                                            Rp
                                        </button>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={discountValue || ''}
                                        onChange={(e) =>
                                            onDiscountChange(discountType, parseFloat(e.target.value) || 0)
                                        }
                                        placeholder="0"
                                        className="flex-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    />
                                    {discountValue > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => onDiscountChange('percent', 0)}
                                            className="text-xs text-rose-600 font-medium hover:underline"
                                        >
                                            Hapus
                                        </button>
                                    )}
                                </div>

                                {/* Preset Pills */}
                                <div className="flex gap-1.5">
                                    {discountType === 'percent'
                                        ? [5, 10, 15, 20].map((pct) => (
                                              <button
                                                  key={pct}
                                                  type="button"
                                                  onClick={() => onDiscountChange('percent', pct)}
                                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                                              >
                                                  {pct}%
                                              </button>
                                          ))
                                        : [10000, 20000, 50000].map((nom) => (
                                              <button
                                                  key={nom}
                                                  type="button"
                                                  onClick={() => onDiscountChange('nominal', nom)}
                                                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700"
                                              >
                                                  {formatRupiah(nom).replace('Rp', '')}
                                              </button>
                                          ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dynamic Applied Charges (Service Charge, Kemasan, etc.) */}
                    {appliedCharges && appliedCharges.length > 0 && (
                        appliedCharges.map((charge, idx) => (
                            <div key={idx} className="flex justify-between text-slate-600">
                                <span className="flex items-center gap-1">
                                    <span>{charge.name}</span>
                                    {charge.type === 'percent' && (
                                        <span className="text-[10px] text-slate-400 font-mono">({charge.rate}%)</span>
                                    )}
                                </span>
                                <span className="font-semibold text-slate-800">
                                    +{formatRupiah(charge.amount)}
                                </span>
                            </div>
                        ))
                    )}

                    {/* Tax Row */}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-slate-600">
                            <span className="flex items-center gap-1">
                                <span>{activeTax?.name || 'Pajak'}</span>
                                {activeTax?.rate && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        ({parseFloat(activeTax.rate as string)}%)
                                    </span>
                                )}
                            </span>
                            <span className="font-semibold text-slate-800">
                                {activeTax?.type === 'inclusive' ? '(Inklusif)' : `+${formatRupiah(taxAmount)}`}
                            </span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-700 uppercase">Total Bayar</span>
                    <span className="text-lg font-extrabold text-slate-900">
                        {formatRupiah(totalAmount)}
                    </span>
                </div>

                {/* Action Buttons: Hold Order & Checkout */}
                <div className="flex items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onHoldOrder}
                        disabled={cart.length === 0}
                        className="py-3 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                        title="Tahan pesanan pelanggan ini untuk dilanjutkan nanti"
                    >
                        <PauseCircle className="w-4 h-4 text-amber-600" />
                        <span>Tahan</span>
                    </button>

                    <button
                        type="button"
                        onClick={onCheckout}
                        disabled={cart.length === 0}
                        className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs active:scale-98 transition"
                    >
                        <span>Bayar Sekarang</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
