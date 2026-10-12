import React from 'react';
import { Head, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah } from '@/lib/printer';
import {
    TrendingUp,
    ShoppingBag,
    PackageCheck,
    Coins,
    AlertTriangle,
    Clock,
    ArrowUpRight,
    ArrowRight
} from 'lucide-react';
import type { PosShift } from '@/types/pos';
import SalesLineChart, { type TrendItem } from './components/sales-line-chart';

interface DashboardProps {
    summary: {
        today_sales: number;
        today_orders: number;
        today_items: number;
        avg_order_value: number;
        active_shift: PosShift | null;
    };
    sales_trend?: TrendItem[];
    hourly_trend?: TrendItem[];
    chart_summary?: {
        revenue_7d: number;
        orders_7d: number;
        revenue_30d: number;
        orders_30d: number;
        peak_revenue: number;
        peak_date: string | null;
    };
    recent_orders: any[];
    low_stock_products: any[];
    top_selling: any[];
}

export default function Dashboard({
    summary,
    sales_trend = [],
    hourly_trend = [],
    chart_summary,
    recent_orders,
    low_stock_products,
    top_selling,
}: DashboardProps) {
    return (
        <BackofficeLayout currentTab="dashboard">
            <Head title="Backoffice - Ringkasan POS" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Ringkasan Operasional</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Laporan aktivitas penjualan dan inventaris hari ini
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Shift: {summary.active_shift ? 'Sedang Berjalan' : 'Tidak Ada Shift Aktif'}</span>
                    </span>
                </div>
            </div>

            {/* Metric Cards (Strict Slate-900 / Emerald-600 Palette) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Omzet Hari Ini</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                            {formatRupiah(summary.today_sales)}
                        </span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Transaksi</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                            {summary.today_orders}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5 font-medium">struk</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Item Terjual</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <PackageCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                            {summary.today_items}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5 font-medium">pcs</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-xs font-semibold uppercase tracking-wider">Rata-rata Order</span>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Coins className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl font-extrabold text-slate-900">
                            {formatRupiah(summary.avg_order_value)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Line Chart Section: Live Sales Trend */}
            <div className="mb-6">
                <SalesLineChart
                    salesTrend={sales_trend}
                    hourlyTrend={hourly_trend}
                    chartSummary={chart_summary}
                />
            </div>

            {/* Split Content: Recent Orders vs Stock & Best Sellers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 2 Cols: Recent Transactions */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <div>
                            <h2 className="font-bold text-base text-slate-900">Transaksi Terbaru</h2>
                            <p className="text-xs text-slate-400">10 transaksi terakhir tercatat</p>
                        </div>
                        <Link
                            href="/backoffice/reports/sales"
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
                        >
                            <span>Lihat Semua</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex-1 overflow-x-auto mt-2">
                        {recent_orders.length === 0 ? (
                            <div className="py-12 text-center text-slate-400">
                                <p className="text-sm font-medium">Belum ada transaksi</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                                        <th className="py-2.5">No. Struk</th>
                                        <th className="py-2.5">Waktu</th>
                                        <th className="py-2.5">Item</th>
                                        <th className="py-2.5">Total</th>
                                        <th className="py-2.5">Metode</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recent_orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 font-mono font-medium text-slate-800">
                                                {order.order_number}
                                            </td>
                                            <td className="py-3 text-slate-500">
                                                {new Date(order.transacted_at).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="py-3 text-slate-600">
                                                {order.items?.length || 0} item
                                            </td>
                                            <td className="py-3 font-semibold text-slate-900">
                                                {formatRupiah(order.total_amount)}
                                            </td>
                                            <td className="py-3">
                                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700 text-[10px]">
                                                    {order.payments?.[0]?.payment_method || 'CASH'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* 1 Col: Top Products & Low Stock Alert */}
                <div className="space-y-6">
                    {/* Top Selling Products */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <h2 className="font-bold text-base text-slate-900 mb-3">Produk Terlaris</h2>
                        {top_selling.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Belum ada data penjualan</p>
                        ) : (
                            <div className="space-y-3">
                                {top_selling.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs">
                                        <div className="min-w-0 pr-2">
                                            <span className="font-semibold text-slate-800 block truncate">
                                                {item.product_name}
                                            </span>
                                            <span className="text-[11px] text-slate-600 font-mono">
                                                {item.sku}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-bold text-slate-900 block">
                                                {item.total_qty} pcs
                                            </span>
                                            <span className="text-[11px] text-slate-600">
                                                {formatRupiah(item.total_revenue)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-bold text-base text-slate-900">Peringatan Stok</h2>
                            <Link
                                href="/backoffice/products"
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                            >
                                Kelola
                            </Link>
                        </div>
                        {low_stock_products.length === 0 ? (
                            <p className="text-xs text-slate-400 py-4 text-center">Semua stok produk mencukupi</p>
                        ) : (
                            <div className="space-y-2.5">
                                {low_stock_products.map((prod) => (
                                    <div
                                        key={prod.id}
                                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                                    >
                                        <div className="min-w-0">
                                            <span className="font-semibold text-slate-800 block truncate">
                                                {prod.name}
                                            </span>
                                            <span className="text-[10px] text-slate-600 font-mono">
                                                {prod.sku}
                                            </span>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-bold text-xs">
                                            Sisa: {prod.stock}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </BackofficeLayout>
    );
}
