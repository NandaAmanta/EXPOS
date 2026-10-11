import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah, printThermalReceipt } from '@/lib/printer';
import {
    Search,
    Calendar,
    Printer,
    ReceiptText,
    Eye,
    X,
    TrendingUp
} from 'lucide-react';
import type { PosOrderPayload } from '@/types/pos';

interface SalesReportProps {
    orders: any[];
    summary: {
        total_revenue: number;
        total_orders: number;
        date: string;
    };
    filters: {
        search?: string;
        date: string;
    };
}

export default function SalesReport({
    orders,
    summary,
    filters,
}: SalesReportProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/backoffice/reports/sales', { search, date }, { preserveState: true });
    };

    const handlePrintOrder = (order: any) => {
        const payload: PosOrderPayload = {
            id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            subtotal: parseFloat(order.subtotal),
            tax_amount: parseFloat(order.tax_amount || 0),
            discount_amount: parseFloat(order.discount_amount || 0),
            total_amount: parseFloat(order.total_amount),
            payment_status: order.payment_status,
            items: order.items || [],
            payments: order.payments?.map((p: any) => ({
                method: p.payment_method,
                amount: parseFloat(p.amount),
                change_amount: parseFloat(p.change_amount || 0),
                reference_no: p.reference_number,
            })) || [],
            is_synced: 1,
            created_at: order.transacted_at,
        };
        printThermalReceipt(payload);
    };

    return (
        <BackofficeLayout currentTab="sales">
            <Head title="Backoffice - Riwayat Transaksi" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Riwayat Transaksi POS</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Daftar lengkap transaksi struk kasir dan rincian item terjual
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Total Penjualan
                        </span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                            {formatRupiah(summary.total_revenue)}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                            Jumlah Struk Kasir
                        </span>
                        <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                            {summary.total_orders} <span className="text-xs font-medium text-slate-400">transaksi</span>
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        <ReceiptText className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleFilter} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari nomor struk atau nama pelanggan..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-slate-900"
                    />
                </div>

                <div className="relative">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                    />
                </div>

                <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                >
                    Terapkan
                </button>
            </form>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">No. Struk</th>
                                <th className="py-3 px-4">Waktu Transaksi</th>
                                <th className="py-3 px-4">Pelanggan</th>
                                <th className="py-3 px-4">Total Belanja</th>
                                <th className="py-3 px-4">Metode Bayar</th>
                                <th className="py-3 px-4">Status ERP</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <span>Tidak ada riwayat transaksi</span>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                                            {order.order_number}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">
                                            {new Date(order.transacted_at).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="py-3 px-4 text-slate-700 font-medium">
                                            {order.customer_name || '-'}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900">
                                            {formatRupiah(order.total_amount)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                                                {order.payments?.[0]?.payment_method || 'CASH'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-medium text-[10px]">
                                                {order.erp_sync_status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-1">
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                title="Lihat Rincian"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handlePrintOrder(order)}
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                title="Cetak Struk"
                                            >
                                                <Printer className="w-3.5 h-3.5 text-emerald-600" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Detail Transaksi */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-base">Detail Transaksi</h3>
                                <p className="text-xs text-slate-400 font-mono">{selectedOrder.order_number}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 text-xs">
                            <div className="space-y-1.5 border-b border-slate-100 pb-3">
                                {selectedOrder.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.product_name}</p>
                                            <p className="text-slate-400 font-mono text-[10px]">
                                                {item.qty} x {formatRupiah(item.unit_price)}
                                            </p>
                                        </div>
                                        <span className="font-bold text-slate-900">
                                            {formatRupiah(item.subtotal)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-1 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-slate-900">{formatRupiah(selectedOrder.subtotal)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-100">
                                    <span>TOTAL</span>
                                    <span>{formatRupiah(selectedOrder.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => handlePrintOrder(selectedOrder)}
                                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5"
                            >
                                <Printer className="w-4 h-4 text-emerald-400" />
                                <span>Cetak Ulang Struk</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
