import React, { useState } from 'react';
import type { PosOrderPayload } from '@/types/pos';
import {
    formatRupiah,
    printThermalReceipt,
    printKitchenSpk,
    printBothReceiptAndSpk,
} from '@/lib/printer';
import {
    CheckCircle2,
    Printer,
    Utensils,
    X,
    ArrowRight,
    Receipt,
    CopyCheck,
} from 'lucide-react';

interface ReceiptDialogProps {
    isOpen: boolean;
    onClose: () => void;
    order: PosOrderPayload | null;
    outletName?: string;
    outletAddress?: string;
}

export default function ReceiptDialog({
    isOpen,
    onClose,
    order,
    outletName = 'EXPOS STORE',
    outletAddress = 'Cabang Utama',
}: ReceiptDialogProps) {
    const [previewMode, setPreviewMode] = useState<'receipt' | 'kitchen'>('receipt');

    if (!isOpen || !order) return null;

    const handlePrintReceipt = () => {
        printThermalReceipt(order, outletName, outletAddress);
    };

    const handlePrintKitchenSpk = () => {
        printKitchenSpk(order, outletName);
    };

    const handlePrintBoth = () => {
        printBothReceiptAndSpk(order, outletName, outletAddress);
    };

    const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

    const orderTypeLabel = () => {
        if (order.order_type === 'dine_in') {
            return `DINE IN ${order.table_number ? `(MEJA ${order.table_number})` : ''}`;
        }
        if (order.order_type === 'delivery') return 'DELIVERY';
        return 'TAKEAWAY';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                            <h2 className="font-semibold text-sm sm:text-base">Transaksi Berhasil</h2>
                            <p className="text-[11px] text-slate-400 font-mono">{order.order_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Selector (Struk Kasir vs SPK Dapur) */}
                <div className="px-5 pt-3 pb-1 bg-slate-100/70 border-b border-slate-200 shrink-0">
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setPreviewMode('receipt')}
                            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                                previewMode === 'receipt'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Struk Pelanggan</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewMode('kitchen')}
                            className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                                previewMode === 'kitchen'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                            <span>SPK Dapur (KOT)</span>
                        </button>
                    </div>
                </div>

                {/* Thermal Simulation Paper View */}
                <div className="p-4 sm:p-5 overflow-y-auto bg-slate-100 flex-1">
                    {previewMode === 'kitchen' ? (
                        /* Preview SPK Dapur */
                        <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-900 shadow-xs space-y-3">
                            <div className="text-center border-b border-dashed border-slate-300 pb-2.5">
                                <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold text-xs tracking-wider mb-1">
                                    SPK DAPUR / KITCHEN TICKET
                                </span>
                                <p className="font-bold text-sm text-slate-900 mt-1">{order.order_number}</p>
                                <p className="text-[11px] text-slate-500">
                                    {new Date(order.created_at).toLocaleString('id-ID')}
                                </p>
                                <div className="mt-2 inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs">
                                    {orderTypeLabel()}
                                </div>
                                {order.customer_name && (
                                    <p className="text-xs font-semibold text-slate-700 mt-1">
                                        Pelanggan: {order.customer_name}
                                    </p>
                                )}
                            </div>

                            {/* Items with Kitchen Focus */}
                            <div className="space-y-2 border-b border-dashed border-slate-300 pb-2.5">
                                <div className="text-[10px] font-bold uppercase text-slate-400">
                                    Daftar Menu & Instruksi
                                </div>
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 space-y-0.5">
                                        <div className="flex items-start gap-1.5 font-bold text-slate-900 text-xs">
                                            <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white text-[11px]">
                                                {item.qty}x
                                            </span>
                                            <span className="flex-1">{item.product_name}</span>
                                        </div>
                                        {item.selected_variant && (
                                            <div className="text-[11px] font-semibold text-slate-700 pl-7">
                                                &gt; Varian: {item.selected_variant}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <div className="text-[11px] text-emerald-700 font-medium pl-7 italic">
                                                * Note: {item.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Kitchen Summary & Notes */}
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between font-bold text-slate-900">
                                    <span>Total Item:</span>
                                    <span>{totalQty} pcs</span>
                                </div>

                                {order.notes && (
                                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mt-2">
                                        <span className="font-bold block uppercase text-[10px]">Catatan Khusus Order:</span>
                                        <span>{order.notes}</span>
                                    </div>
                                )}
                            </div>

                            <div className="text-center pt-2 text-[10px] text-slate-400 border-t border-dashed border-slate-200">
                                Status: SUDAH DIBAYAR (KASIR)
                            </div>
                        </div>
                    ) : (
                        /* Preview Struk Kasir / Pelanggan */
                        <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 shadow-xs space-y-3">
                            <div className="text-center border-b border-dashed border-slate-200 pb-2">
                                <p className="font-bold text-sm tracking-tight">{outletName}</p>
                                <p className="text-[10px] text-slate-500">{outletAddress}</p>
                                <p className="text-[10px] text-slate-500 mt-1">{order.order_number}</p>
                                <p className="text-[10px] text-slate-400">
                                    {new Date(order.created_at).toLocaleString('id-ID')}
                                </p>
                                <p className="text-[11px] font-semibold text-slate-700 mt-1">
                                    Tipe: {orderTypeLabel()}
                                </p>
                                {order.customer_name && (
                                    <p className="text-[10px] text-slate-600">Pelanggan: {order.customer_name}</p>
                                )}
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="space-y-0.5">
                                        <div className="font-medium text-slate-900">
                                            {item.product_name}
                                            {item.selected_variant ? ` (${item.selected_variant})` : ''}
                                        </div>
                                        {item.notes && (
                                            <div className="text-[10px] text-slate-500 italic">
                                                * {item.notes}
                                            </div>
                                        )}
                                        <div className="flex justify-between text-slate-500 text-[11px]">
                                            <span>
                                                {item.qty} x {formatRupiah(item.unit_price)}
                                            </span>
                                            <span className="font-medium text-slate-800">
                                                {formatRupiah(item.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 border-b border-dashed border-slate-200 pb-2 text-[11px]">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>{formatRupiah(order.subtotal)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-medium">
                                        <span>Diskon</span>
                                        <span>-{formatRupiah(order.discount_amount)}</span>
                                    </div>
                                )}
                                {order.charges_detail && order.charges_detail.length > 0 ? (
                                    order.charges_detail.map((c, idx) => (
                                        <div key={idx} className="flex justify-between text-slate-600">
                                            <span>{c.name}</span>
                                            <span>+{formatRupiah(c.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    Boolean(order.charges_amount && order.charges_amount > 0) && (
                                        <div className="flex justify-between text-slate-600">
                                            <span>Biaya Layanan</span>
                                            <span>+{formatRupiah(order.charges_amount!)}</span>
                                        </div>
                                    )
                                )}
                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>{order.tax_name || 'Pajak (PB1)'}</span>
                                        <span>+{formatRupiah(order.tax_amount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-200">
                                    <span>TOTAL</span>
                                    <span>{formatRupiah(order.total_amount)}</span>
                                </div>
                            </div>

                            {/* Payments */}
                            <div className="space-y-1 text-[11px] text-slate-600">
                                {order.payments.map((p, idx) => (
                                    <div key={idx} className="space-y-0.5">
                                        <div className="flex justify-between">
                                            <span>Metode ({p.method})</span>
                                            <span className="font-medium text-slate-800">
                                                {formatRupiah(p.amount)}
                                            </span>
                                        </div>
                                        {p.change_amount && p.change_amount > 0 ? (
                                            <div className="flex justify-between text-emerald-700 font-semibold">
                                                <span>Kembalian</span>
                                                <span>{formatRupiah(p.change_amount)}</span>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            {order.notes && (
                                <div className="text-[10px] text-slate-500 pt-1 border-t border-dashed border-slate-200 italic">
                                    Catatan: {order.notes}
                                </div>
                            )}

                            <div className="text-center pt-2 text-[10px] text-slate-400">
                                Terima kasih atas kunjungan Anda
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2 shrink-0">
                    {/* Primary Print Controls */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={handlePrintKitchenSpk}
                            className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-xs"
                        >
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cetak SPK Dapur</span>
                        </button>
                        <button
                            type="button"
                            onClick={handlePrintReceipt}
                            className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition shadow-xs"
                        >
                            <Printer className="w-3.5 h-3.5 text-slate-700" />
                            <span>Cetak Struk Kasir</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrintBoth}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
                    >
                        <CopyCheck className="w-3.5 h-3.5 text-slate-600" />
                        <span>Cetak Keduanya (Struk + SPK Dapur)</span>
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                    >
                        <span>Transaksi Baru</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
