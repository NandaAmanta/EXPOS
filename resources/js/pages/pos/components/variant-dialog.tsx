import React, { useState } from 'react';
import type { PosProduct, ProductVariant } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import { X, Check, Plus, Package } from 'lucide-react';

interface VariantDialogProps {
    isOpen: boolean;
    onClose: () => void;
    product: PosProduct | null;
    onSelectVariant: (product: PosProduct, variant: ProductVariant | null, notes: string) => void;
}

export default function VariantDialog({
    isOpen,
    onClose,
    product,
    onSelectVariant,
}: VariantDialogProps) {
    if (!isOpen || !product) return null;

    const variants: ProductVariant[] = Array.isArray(product.variants) ? product.variants : [];
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
        variants.length > 0 ? variants[0] : null
    );
    const [itemNotes, setItemNotes] = useState<string>('');

    const basePrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

    const currentPrice = () => {
        if (!selectedVariant) return basePrice;
        if (selectedVariant.price !== undefined && selectedVariant.price !== null) {
            return selectedVariant.price;
        }
        if (selectedVariant.additional_price) {
            return basePrice + selectedVariant.additional_price;
        }
        return basePrice;
    };

    const handleConfirm = () => {
        onSelectVariant(product, selectedVariant, itemNotes);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {product.category}
                        </span>
                        <h2 className="font-semibold text-base">{product.name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Product Preview */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-900 block">{product.name}</span>
                            <span className="text-xs text-slate-500 font-mono">
                                Harga Dasar: {formatRupiah(basePrice)}
                            </span>
                        </div>
                    </div>

                    {/* Variant Options */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                            Pilih Varian / Ukuran
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {variants.map((v, idx) => {
                                const isSelected = selectedVariant?.name === v.name;
                                const extra = v.additional_price
                                    ? `+${formatRupiah(v.additional_price)}`
                                    : v.price
                                    ? formatRupiah(v.price)
                                    : null;

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedVariant(v)}
                                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition active:scale-98 ${
                                            isSelected
                                                ? 'border-emerald-600 bg-emerald-50/50 text-slate-900 ring-1 ring-emerald-600'
                                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                    isSelected
                                                        ? 'border-emerald-600 bg-emerald-600 text-white'
                                                        : 'border-slate-300'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                            </div>
                                            <span className="text-xs font-semibold">{v.name}</span>
                                        </div>
                                        {extra && (
                                            <span className="text-xs font-bold text-slate-900 font-mono">
                                                {extra}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes for item */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                            Catatan Item (Opsional)
                        </label>
                        <input
                            type="text"
                            value={itemNotes}
                            onChange={(e) => setItemNotes(e.target.value)}
                            placeholder="Contoh: Less ice, gula sedikit..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                        />
                    </div>

                    {/* Footer / Add to Cart Button */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] text-slate-500 uppercase block">Total Item</span>
                            <span className="text-base font-extrabold text-slate-900">
                                {formatRupiah(currentPrice())}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 active:scale-95 transition"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Pesanan</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
