import React from 'react';
import type { PosOrderPayload } from '@/types/pos';
import { formatRupiah, printThermalReceipt } from '@/lib/printer';
import { CheckCircle2, Printer, X, ArrowRight } from 'lucide-react';

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
    if (!isOpen || !order) return null;

    const handlePrint = () => {
        printThermalReceipt(order, outletName, outletAddress);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <h2 className="font-semibold text-base">Transaksi Berhasil</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Thermal Paper Simulation */}
                <div className="p-5 overflow-y-auto bg-slate-50 flex-1">
                    <div className="bg-white p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 shadow-xs space-y-3">
                        <div className="text-center border-b border-dashed border-slate-200 pb-2">
                            <p className="font-bold text-sm tracking-tight">{outletName}</p>
                            <p className="text-[10px] text-slate-500">{outletAddress}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{order.order_number}</p>
                            <p className="text-[10px] text-slate-400">
                                {new Date(order.created_at).toLocaleString('id-ID')}
                            </p>
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 border-b border-dashed border-slate-200 pb-2">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="space-y-0.5">
                                    <div className="font-medium text-slate-900">{item.product_name}</div>
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
                                <div className="flex justify-between text-slate-600">
                                    <span>Diskon</span>
                                    <span>-{formatRupiah(order.discount_amount)}</span>
                                </div>
                            )}
                            {order.tax_amount > 0 && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Pajak</span>
                                    <span>{formatRupiah(order.tax_amount)}</span>
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
                                <div key={idx} className="space-y-1">
                                    <div className="flex justify-between">
                                        <span>Metode ({p.method})</span>
                                        <span className="font-medium text-slate-800">{formatRupiah(p.amount)}</span>
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

                        <div className="text-center pt-2 text-[10px] text-slate-400">
                            Terima kasih atas kunjungan Anda
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                    <button
                        onClick={handlePrint}
                        className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                    >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        <span>Cetak Struk (ESC/POS)</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                    >
                        <span>Transaksi Baru</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
