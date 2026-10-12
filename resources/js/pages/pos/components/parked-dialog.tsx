import React, { useState, useEffect } from 'react';
import type { ParkedOrder } from '@/types/pos';
import { getParkedOrders, removeParkedOrder } from '@/lib/db';
import { formatRupiah } from '@/lib/printer';
import { X, Clock, Play, Trash2, PauseCircle, Utensils, ShoppingBag } from 'lucide-react';

interface ParkedDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onRecallOrder: (order: ParkedOrder) => void;
}

export default function ParkedDialog({
    isOpen,
    onClose,
    onRecallOrder,
}: ParkedDialogProps) {
    const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const list = await getParkedOrders();
            setParkedOrders(list);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadOrders();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleRecall = async (order: ParkedOrder) => {
        await removeParkedOrder(order.id);
        onRecallOrder(order);
        onClose();
    };

    const handleDelete = async (orderId: string) => {
        if (confirm('Hapus antrean pesanan yang ditahan ini?')) {
            await removeParkedOrder(orderId);
            await loadOrders();
        }
    };

    const getOrderTypeBadge = (type: string, table?: string) => {
        if (type === 'dine_in') {
            return `Dine In ${table ? `(Meja ${table})` : ''}`;
        }
        if (type === 'delivery') return 'Delivery';
        return 'Takeaway';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <PauseCircle className="w-5 h-5 text-emerald-400" />
                        <div>
                            <h2 className="font-semibold text-base">Pesanan Ditahan (Hold / Park)</h2>
                            <p className="text-xs text-slate-400">{parkedOrders.length} pesanan tersimpan</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-3">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400 text-xs">Memuat daftar antrean...</div>
                    ) : parkedOrders.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 space-y-2">
                            <PauseCircle className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                            <p className="font-semibold text-slate-600 text-sm">Tidak ada pesanan yang ditahan</p>
                            <p className="text-xs text-slate-400">
                                Gunakan tombol "Tahan Pesanan" di keranjang jika pelanggan ingin menunda pembayaran
                            </p>
                        </div>
                    ) : (
                        parkedOrders.map((ord) => {
                            const totalAmount = ord.items.reduce((sum, item) => sum + item.subtotal, 0);
                            const totalItems = ord.items.reduce((sum, item) => sum + item.qty, 0);
                            const timeStr = new Date(ord.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                            return (
                                <div
                                    key={ord.id}
                                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition flex items-center justify-between gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm font-mono">
                                                {ord.order_number}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-semibold">
                                                {getOrderTypeBadge(ord.order_type, ord.table_number)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 flex items-center gap-2">
                                            {ord.customer_name && (
                                                <span className="font-medium">{ord.customer_name} •</span>
                                            )}
                                            <span>{totalItems} item</span>
                                            <span>• {formatRupiah(totalAmount)}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Ditahan pk {timeStr}</span>
                                            {ord.notes && <span className="italic">({ord.notes})</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(ord.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                                            title="Hapus"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRecall(ord)}
                                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
                                        >
                                            <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                                            <span>Lanjutkan</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
