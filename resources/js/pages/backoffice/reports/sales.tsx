import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah, printThermalReceipt, printKitchenSpk } from '@/lib/printer';
import {
    Search,
    Calendar,
    Printer,
    ReceiptText,
    Eye,
    X,
    TrendingUp,
    UserCheck,
    Utensils,
    Tag,
    Clock,
    CreditCard,
    QrCode,
    Banknote,
    Layers,
    FileText,
    Percent,
    ChevronLeft,
    ChevronRight,
    CalendarRange,
    RotateCcw,
} from 'lucide-react';
import type { PosOrderPayload } from '@/types/pos';

interface OrderItem {
    id: string;
    product_id: string;
    sku: string;
    product_name: string;
    qty: number;
    unit_price: number;
    subtotal: number;
    selected_variant: string | null;
    notes: string | null;
}

interface OrderPayment {
    id: string;
    payment_method: string;
    amount: number;
    change_amount: number;
    reference_number: string | null;
}

interface OrderRecord {
    id: string;
    order_number: string;
    order_type: 'dine_in' | 'takeaway' | 'delivery';
    table_number: string | null;
    customer_name: string | null;
    notes: string | null;
    subtotal: number;
    discount_amount: number;
    charges_amount?: number;
    charges_detail?: Array<{
        charge_id: string;
        name: string;
        amount: number;
        calculation_type: 'percent' | 'fixed';
        rate_or_value: number;
        is_taxable: boolean;
    }> | null;
    tax_rate?: number | null;
    tax_name?: string | null;
    tax_amount: number;
    total_amount: number;
    payment_status: string;
    transacted_at: string;
    erp_sync_status: string;
    cashier_id: number | null;
    cashier_name: string;
    cashier_role: string;
    outlet_name: string;
    items: OrderItem[];
    payments: OrderPayment[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedOrders {
    data: OrderRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: PaginationLink[];
    prev_page_url: string | null;
    next_page_url: string | null;
}

interface CashierOption {
    id: number;
    name: string;
    role: string;
}

interface SalesReportProps {
    orders: PaginatedOrders | OrderRecord[];
    summary: {
        total_revenue: number;
        total_subtotal: number;
        total_discount: number;
        total_charges?: number;
        total_tax: number;
        total_orders: number;
        cash_total: number;
        qris_total: number;
        debit_total: number;
        start_date?: string | null;
        end_date?: string | null;
        date?: string;
    };
    cashiers: CashierOption[];
    filters: {
        search?: string;
        start_date?: string | null;
        end_date?: string | null;
        date?: string;
        cashier_id?: string;
        order_type?: string;
        payment_method?: string;
        per_page?: number;
    };
}

export default function SalesReport({
    orders,
    summary,
    cashiers,
    filters,
}: SalesReportProps) {
    const orderList: OrderRecord[] = Array.isArray(orders) ? orders : (orders?.data || []);
    const pagination: PaginatedOrders | null = !Array.isArray(orders) ? orders : null;

    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(
        filters.start_date !== undefined
            ? filters.start_date || ''
            : filters.date && filters.date !== 'all'
            ? filters.date
            : ''
    );
    const [endDate, setEndDate] = useState(
        filters.end_date !== undefined
            ? filters.end_date || ''
            : filters.date && filters.date !== 'all'
            ? filters.date
            : ''
    );
    const [cashierId, setCashierId] = useState(filters.cashier_id || '');
    const [orderType, setOrderType] = useState(filters.order_type || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');
    const [perPage, setPerPage] = useState(filters.per_page || 15);
    const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/backoffice/reports/sales',
            {
                search,
                start_date: startDate || 'all',
                end_date: endDate || 'all',
                cashier_id: cashierId,
                order_type: orderType,
                payment_method: paymentMethod,
                per_page: perPage,
            },
            { preserveState: true }
        );
    };

    const getTodayStr = () => new Date().toISOString().split('T')[0];
    const getDaysAgoStr = (days: number) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d.toISOString().split('T')[0];
    };
    const getMonthStartStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };

    const handlePresetDate = (type: 'today' | '7d' | '30d' | 'month' | 'all') => {
        let s = '';
        let e = '';
        if (type === 'today') {
            s = getTodayStr();
            e = getTodayStr();
        } else if (type === '7d') {
            s = getDaysAgoStr(6);
            e = getTodayStr();
        } else if (type === '30d') {
            s = getDaysAgoStr(29);
            e = getTodayStr();
        } else if (type === 'month') {
            s = getMonthStartStr();
            e = getTodayStr();
        } else if (type === 'all') {
            s = '';
            e = '';
        }
        setStartDate(s);
        setEndDate(e);
        router.get(
            '/backoffice/reports/sales',
            {
                search,
                start_date: s || 'all',
                end_date: e || 'all',
                cashier_id: cashierId,
                order_type: orderType,
                payment_method: paymentMethod,
                per_page: perPage,
            },
            { preserveState: true }
        );
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        router.get(
            '/backoffice/reports/sales',
            {
                search,
                start_date: startDate || 'all',
                end_date: endDate || 'all',
                cashier_id: cashierId,
                order_type: orderType,
                payment_method: paymentMethod,
                per_page: newPerPage,
            },
            { preserveState: true }
        );
    };

    const handlePrintReceipt = (order: OrderRecord) => {
        const payload: PosOrderPayload = {
            id: order.id,
            order_number: order.order_number,
            order_type: order.order_type,
            table_number: order.table_number,
            customer_name: order.customer_name,
            notes: order.notes,
            subtotal: order.subtotal,
            tax_rate: order.tax_rate,
            tax_name: order.tax_name,
            tax_amount: order.tax_amount,
            charges_amount: order.charges_amount,
            charges_detail: order.charges_detail as any,
            discount_amount: order.discount_amount,
            total_amount: order.total_amount,
            payment_status: order.payment_status,
            items: order.items.map((i) => ({
                product_id: i.product_id,
                sku: i.sku,
                product_name: i.product_name,
                qty: i.qty,
                unit_price: i.unit_price,
                subtotal: i.subtotal,
                selected_variant: i.selected_variant,
                notes: i.notes,
            })),
            payments: order.payments.map((p) => ({
                method: p.payment_method,
                amount: p.amount,
                change_amount: p.change_amount,
                reference_no: p.reference_number,
            })),
            is_synced: 1,
            created_at: order.transacted_at,
        };
        printThermalReceipt(payload);
    };

    const handlePrintSpk = (order: OrderRecord) => {
        const payload: PosOrderPayload = {
            id: order.id,
            order_number: order.order_number,
            order_type: order.order_type,
            table_number: order.table_number,
            customer_name: order.customer_name,
            notes: order.notes,
            subtotal: order.subtotal,
            tax_rate: order.tax_rate,
            tax_name: order.tax_name,
            tax_amount: order.tax_amount,
            charges_amount: order.charges_amount,
            charges_detail: order.charges_detail as any,
            discount_amount: order.discount_amount,
            total_amount: order.total_amount,
            payment_status: order.payment_status,
            items: order.items.map((i) => ({
                product_id: i.product_id,
                sku: i.sku,
                product_name: i.product_name,
                qty: i.qty,
                unit_price: i.unit_price,
                subtotal: i.subtotal,
                selected_variant: i.selected_variant,
                notes: i.notes,
            })),
            payments: [],
            is_synced: 1,
            created_at: order.transacted_at,
        };
        printKitchenSpk(payload);
    };

    const getOrderTypeBadge = (type: string, table?: string | null) => {
        if (type === 'dine_in') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    <Utensils className="w-2.5 h-2.5" />
                    Dine In {table ? `(Meja ${table})` : ''}
                </span>
            );
        }
        if (type === 'takeaway') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                    Bungkus (Takeaway)
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                Delivery
            </span>
        );
    };

    return (
        <BackofficeLayout currentTab="sales">
            <Head title="Backoffice - Riwayat & Detail Transaksi" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Riwayat & Detail Penjualan POS
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Audit transaksi lengkap, atribusi kasir operator, rincian varian, diskon, dan metode pembayaran
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-semibold shadow-xs">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                            {summary.start_date && summary.end_date
                                ? summary.start_date === summary.end_date
                                    ? `Tanggal: ${summary.start_date}`
                                    : `Periode: ${summary.start_date} s/d ${summary.end_date}`
                                : 'Semua Periode Transaksi'}
                        </span>
                    </span>
                </div>
            </div>

            {/* Summary Statistics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Omset Bersih
                        </span>
                        <span className="text-2xl font-black text-slate-900 mt-1 block">
                            {formatRupiah(summary.total_revenue)}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                            Subtotal: {formatRupiah(summary.total_subtotal)}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Jumlah Struk
                        </span>
                        <span className="text-2xl font-black text-slate-900 mt-1 block">
                            {summary.total_orders}{' '}
                            <span className="text-xs font-normal text-slate-400">transaksi</span>
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                            Pajak: {formatRupiah(summary.total_tax)}
                            {summary.total_charges && summary.total_charges > 0 ? ` • Biaya: ${formatRupiah(summary.total_charges)}` : ''}
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shadow-xs">
                        <ReceiptText className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                    <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Total Diskon Diberikan
                        </span>
                        <span className="text-2xl font-black text-rose-600 mt-1 block">
                            {formatRupiah(summary.total_discount)}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                            Potongan promosi kasir
                        </span>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-xs">
                        <Percent className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Breakdown Pembayaran
                    </span>
                    <div className="space-y-1 mt-1 text-xs font-medium">
                        <div className="flex justify-between items-center text-slate-700">
                            <span className="flex items-center gap-1 text-[11px]">
                                <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Tunai
                            </span>
                            <span className="font-bold">{formatRupiah(summary.cash_total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                            <span className="flex items-center gap-1 text-[11px]">
                                <QrCode className="w-3.5 h-3.5 text-slate-900" /> QRIS
                            </span>
                            <span className="font-bold">{formatRupiah(summary.qris_total)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-700">
                            <span className="flex items-center gap-1 text-[11px]">
                                <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Debit
                            </span>
                            <span className="font-bold">{formatRupiah(summary.debit_total)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar with Date Range */}
            <form
                onSubmit={handleFilter}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 space-y-3"
            >
                {/* Search Bar & Primary Filters */}
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nomor struk, nama pelanggan, kasir, atau nomor meja..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-slate-900"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filter Kasir */}
                        <select
                            value={cashierId}
                            onChange={(e) => setCashierId(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Kasir</option>
                            {cashiers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    Kasir: {c.name}
                                </option>
                            ))}
                        </select>

                        {/* Filter Tipe Order */}
                        <select
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Tipe</option>
                            <option value="dine_in">Dine In (Makan di Tempat)</option>
                            <option value="takeaway">Bungkus (Takeaway)</option>
                            <option value="delivery">Delivery</option>
                        </select>

                        {/* Filter Cara Bayar */}
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Cara Bayar</option>
                            <option value="CASH">Tunai (Cash)</option>
                            <option value="QRIS">QRIS</option>
                            <option value="DEBIT">Kartu Debit</option>
                        </select>

                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                        >
                            Terapkan
                        </button>
                    </div>
                </div>

                {/* Date Range Selector & Quick Presets */}
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    {/* Date Inputs Range */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-500 flex items-center gap-1.5 text-xs">
                            <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                            <span>Rentang Tanggal:</span>
                        </span>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-slate-900"
                                title="Tanggal Mulai"
                            />
                            <span className="text-slate-400 text-xs font-medium">s/d</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-hidden focus:border-slate-900"
                                title="Tanggal Akhir"
                            />
                        </div>
                    </div>

                    {/* Quick Range Presets */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-1 font-medium">Preset:</span>
                        <button
                            type="button"
                            onClick={() => handlePresetDate('today')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Hari Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePresetDate('7d')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            7 Hari
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePresetDate('month')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Bulan Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePresetDate('all')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                            Semua Waktu
                        </button>
                    </div>
                </div>
            </form>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">No. Struk & Tipe</th>
                                <th className="py-3 px-4">Waktu Transaksi</th>
                                <th className="py-3 px-4">Kasir Operator</th>
                                <th className="py-3 px-4">Pelanggan</th>
                                <th className="py-3 px-4">Subtotal & Diskon</th>
                                <th className="py-3 px-4">Total Akhir</th>
                                <th className="py-3 px-4">Metode Bayar</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orderList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <ReceiptText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <span>Tidak ada riwayat transaksi yang cocok</span>
                                    </td>
                                </tr>
                            ) : (
                                orderList.map((order) => {
                                    const paymentMethodName =
                                        order.payments?.[0]?.payment_method || 'CASH';

                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/70 transition">
                                            {/* Struk & Tipe */}
                                            <td className="py-3 px-4">
                                                <div className="space-y-1">
                                                    <span className="font-mono font-bold text-slate-900 block">
                                                        {order.order_number}
                                                    </span>
                                                    {getOrderTypeBadge(
                                                        order.order_type,
                                                        order.table_number
                                                    )}
                                                </div>
                                            </td>

                                            {/* Waktu */}
                                            <td className="py-3 px-4 text-slate-600">
                                                <div>
                                                    <span className="font-medium text-slate-800 block">
                                                        {new Date(order.transacted_at).toLocaleDateString(
                                                            'id-ID',
                                                            {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            }
                                                        )}
                                                    </span>
                                                    <span className="text-slate-400 text-[11px]">
                                                        {new Date(order.transacted_at).toLocaleTimeString(
                                                            'id-ID',
                                                            {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            }
                                                        )}{' '}
                                                        WIB
                                                    </span>
                                                </div>
                                            </td>

                                            {/* KASIR OPERATOR */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                        {order.cashier_name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">
                                                            {order.cashier_name}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            {order.cashier_role}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Pelanggan */}
                                            <td className="py-3 px-4 text-slate-700">
                                                <span className="font-medium">
                                                    {order.customer_name || 'Pelanggan Umum'}
                                                </span>
                                                {order.notes && (
                                                    <p className="text-[10px] text-slate-400 truncate max-w-[120px] italic">
                                                        "{order.notes}"
                                                    </p>
                                                )}
                                            </td>

                                            {/* Subtotal & Diskon */}
                                            <td className="py-3 px-4">
                                                <span className="text-slate-600 block">
                                                    {formatRupiah(order.subtotal)}
                                                </span>
                                                {order.discount_amount > 0 && (
                                                    <span className="text-rose-600 text-[11px] font-semibold block">
                                                        -{formatRupiah(order.discount_amount)}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Total Akhir */}
                                            <td className="py-3 px-4 font-black text-slate-900 text-sm">
                                                {formatRupiah(order.total_amount)}
                                            </td>

                                            {/* Metode Bayar */}
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px] border border-slate-200">
                                                    {paymentMethodName === 'CASH' && (
                                                        <Banknote className="w-3 h-3 text-emerald-600" />
                                                    )}
                                                    {paymentMethodName === 'QRIS' && (
                                                        <QrCode className="w-3 h-3 text-slate-900" />
                                                    )}
                                                    {paymentMethodName === 'DEBIT' && (
                                                        <CreditCard className="w-3 h-3 text-blue-600" />
                                                    )}
                                                    {paymentMethodName}
                                                </span>
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                    title="Rincian Lengkap"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintReceipt(order)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                                                    title="Cetak Ulang Struk Kasir"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintSpk(order)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition"
                                                    title="Cetak Ulang SPK Dapur"
                                                >
                                                    <Utensils className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.total > 0 && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3 text-slate-500">
                            <span>
                                Menampilkan <strong className="text-slate-800">{pagination.from || 0}</strong> -{' '}
                                <strong className="text-slate-800">{pagination.to || 0}</strong> dari{' '}
                                <strong className="text-slate-900">{pagination.total}</strong> transaksi
                            </span>
                            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                                <span className="text-[11px] text-slate-400">Per Halaman:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-xs text-slate-700"
                                >
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        {/* Page Link Buttons */}
                        {pagination.last_page > 1 && (
                            <div className="flex items-center gap-1">
                                {pagination.links.map((link, idx) => {
                                    const isPrev = link.label.includes('&laquo;') || link.label.toLowerCase().includes('prev') || link.label.toLowerCase().includes('previous');
                                    const isNext = link.label.includes('&raquo;') || link.label.toLowerCase().includes('next');
                                    const isDisabled = !link.url;

                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => link.url && router.visit(link.url, { preserveState: true })}
                                            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center justify-center text-xs ${
                                                link.active
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : isDisabled
                                                    ? 'text-slate-300 cursor-not-allowed'
                                                    : 'text-slate-700 hover:bg-slate-200/70'
                                            }`}
                                        >
                                            {isPrev ? (
                                                <ChevronLeft className="w-4 h-4" />
                                            ) : isNext ? (
                                                <ChevronRight className="w-4 h-4" />
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: DETAIL SALES MENYELURUH */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                        {/* Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-base">Rincian Lengkap Transaksi</h3>
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                                        LUNAS
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                    {selectedOrder.order_number}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5 text-xs">
                            {/* Cashier & Order Meta Banner */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-3">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                        Kasir Operator
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                                            {selectedOrder.cashier_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-bold text-slate-900 text-xs">
                                            {selectedOrder.cashier_name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">
                                        {selectedOrder.outlet_name}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                                        Waktu & Tipe Order
                                    </span>
                                    <span className="font-bold text-slate-800 text-xs mt-1 block">
                                        {new Date(selectedOrder.transacted_at).toLocaleString('id-ID')}
                                    </span>
                                    <div className="mt-1">
                                        {getOrderTypeBadge(
                                            selectedOrder.order_type,
                                            selectedOrder.table_number
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Customer & Notes (if any) */}
                            {(selectedOrder.customer_name || selectedOrder.notes) && (
                                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 space-y-1">
                                    {selectedOrder.customer_name && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Pelanggan:</span>
                                            <span className="font-bold text-slate-900">
                                                {selectedOrder.customer_name}
                                            </span>
                                        </div>
                                    )}
                                    {selectedOrder.notes && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Catatan Pesanan:</span>
                                            <span className="font-medium text-slate-800 italic">
                                                "{selectedOrder.notes}"
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Itemized Products Breakdown */}
                            <div>
                                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
                                    Daftar Item Menu ({selectedOrder.items.length})
                                </span>
                                <div className="divide-y divide-slate-100 border-y border-slate-100">
                                    {selectedOrder.items.map((item) => (
                                        <div key={item.id} className="py-2.5 flex justify-between items-start">
                                            <div className="space-y-0.5 pr-2">
                                                <span className="font-bold text-slate-900 block text-xs">
                                                    {item.product_name}
                                                </span>
                                                {item.selected_variant && (
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                        Varian: {item.selected_variant}
                                                    </span>
                                                )}
                                                {item.notes && (
                                                    <span className="block text-[10px] text-slate-500 italic">
                                                        * {item.notes}
                                                    </span>
                                                )}
                                                <span className="text-slate-400 font-mono text-[11px] block">
                                                    {item.qty} x {formatRupiah(item.unit_price)}
                                                </span>
                                            </div>
                                            <span className="font-bold text-slate-900 text-xs shrink-0">
                                                {formatRupiah(item.subtotal)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal Item</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatRupiah(selectedOrder.subtotal)}
                                    </span>
                                </div>

                                {selectedOrder.discount_amount > 0 && (
                                    <div className="flex justify-between text-rose-600 font-medium">
                                        <span>Potongan Diskon</span>
                                        <span>-{formatRupiah(selectedOrder.discount_amount)}</span>
                                    </div>
                                )}

                                {/* Applied Additional Charges */}
                                {selectedOrder.charges_detail && selectedOrder.charges_detail.length > 0 ? (
                                    selectedOrder.charges_detail.map((charge, idx) => (
                                        <div key={idx} className="flex justify-between text-slate-600 text-xs">
                                            <span className="flex items-center gap-1">
                                                <span>{charge.name}</span>
                                                {charge.calculation_type === 'percent' && (
                                                    <span className="text-[10px] text-slate-400">({charge.rate_or_value}%)</span>
                                                )}
                                                {charge.is_taxable && (
                                                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1 py-0.2 rounded font-mono">
                                                        Taxable
                                                    </span>
                                                )}
                                            </span>
                                            <span className="font-semibold text-slate-900">
                                                +{formatRupiah(charge.amount)}
                                            </span>
                                        </div>
                                    ))
                                ) : (selectedOrder.charges_amount ?? 0) > 0 ? (
                                    <div className="flex justify-between text-slate-600 text-xs">
                                        <span>Biaya Tambahan</span>
                                        <span className="font-semibold text-slate-900">
                                            +{formatRupiah(selectedOrder.charges_amount || 0)}
                                        </span>
                                    </div>
                                ) : null}

                                {selectedOrder.tax_amount > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span className="flex items-center gap-1">
                                            <span>{selectedOrder.tax_name || 'Pajak'}</span>
                                            {selectedOrder.tax_rate !== null && selectedOrder.tax_rate !== undefined && (
                                                <span className="text-[10px] text-slate-400">({selectedOrder.tax_rate}%)</span>
                                            )}
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            +{formatRupiah(selectedOrder.tax_amount)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-200">
                                    <span>TOTAL TRANSAKSI</span>
                                    <span className="text-emerald-700">
                                        {formatRupiah(selectedOrder.total_amount)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div>
                                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
                                    Rincian Pembayaran
                                </span>
                                {selectedOrder.payments.map((p) => (
                                    <div
                                        key={p.id}
                                        className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1"
                                    >
                                        <div className="flex justify-between font-bold text-slate-800">
                                            <span className="flex items-center gap-1.5">
                                                {p.payment_method === 'CASH' && <Banknote className="w-4 h-4 text-emerald-600" />}
                                                {p.payment_method === 'QRIS' && <QrCode className="w-4 h-4 text-slate-900" />}
                                                {p.payment_method === 'DEBIT' && <CreditCard className="w-4 h-4 text-blue-600" />}
                                                Metode: {p.payment_method}
                                            </span>
                                            <span>{formatRupiah(p.amount)}</span>
                                        </div>

                                        {p.payment_method === 'CASH' && (
                                            <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                                                <span>Uang Kembalian:</span>
                                                <span className="font-bold text-emerald-700">
                                                    {formatRupiah(p.change_amount)}
                                                </span>
                                            </div>
                                        )}

                                        {p.reference_number && (
                                            <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 font-mono">
                                                <span>Ref / Approval No:</span>
                                                <span>{p.reference_number}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                            <button
                                onClick={() => handlePrintSpk(selectedOrder)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 transition"
                            >
                                <Utensils className="w-4 h-4 text-amber-600" />
                                <span>Cetak SPK Dapur</span>
                            </button>

                            <button
                                onClick={() => handlePrintReceipt(selectedOrder)}
                                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition"
                            >
                                <Printer className="w-4 h-4 text-emerald-400" />
                                <span>Cetak Struk Kasir</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
