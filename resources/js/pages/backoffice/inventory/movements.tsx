import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import {
    ArrowUpDown,
    Store,
    Filter,
    Boxes,
    Package,
    ArrowDownLeft,
    ArrowUpRight,
    AlertTriangle,
    RotateCcw,
    FileText,
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface MovementRecord {
    id: string;
    outlet_id: string;
    item_type: 'ingredient' | 'product';
    type: 'sale' | 'purchase' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'waste';
    quantity: number;
    balance_before: number;
    balance_after: number;
    reference_id: string | null;
    reference_type: string | null;
    notes: string | null;
    created_at: string;
    outlet?: {
        name: string;
        code: string;
    };
    user?: {
        name: string;
    };
    ingredient?: {
        name: string;
        sku: string;
        unit: string;
    };
    product?: {
        name: string;
        sku: string;
    };
}

interface MovementsProps {
    movements: {
        data: MovementRecord[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: any[];
    };
    outlets: Array<{ id: string; name: string; code: string }>;
    filters: {
        outlet_id: string;
        item_type?: string;
        type?: string;
    };
}

export default function MovementsIndex({ movements, outlets, filters }: MovementsProps) {
    const [selectedOutlet, setSelectedOutlet] = useState(filters.outlet_id || 'all');
    const [selectedItemType, setSelectedItemType] = useState(filters.item_type || '');
    const [selectedType, setSelectedType] = useState(filters.type || '');

    const applyFilter = (key: string, value: string) => {
        const params: any = {
            outlet_id: key === 'outlet_id' ? value : selectedOutlet,
            item_type: key === 'item_type' ? value : selectedItemType,
            type: key === 'type' ? value : selectedType,
        };

        if (params.outlet_id === 'all') delete params.outlet_id;
        if (!params.item_type) delete params.item_type;
        if (!params.type) delete params.type;

        router.get('/backoffice/inventory/movements', params, { preserveState: true });
    };

    const getTypeBadge = (type: MovementRecord['type']) => {
        switch (type) {
            case 'sale':
                return (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1">
                        <ArrowDownLeft className="w-2.5 h-2.5" />
                        Penjualan POS
                    </span>
                );
            case 'purchase':
                return (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                        <ArrowUpRight className="w-2.5 h-2.5" />
                        Stok Masuk
                    </span>
                );
            case 'adjustment':
                return (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" />
                        Stok Opname
                    </span>
                );
            case 'waste':
                return (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Barang Rusak / Waste
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] uppercase font-semibold">
                        {type}
                    </span>
                );
        }
    };

    return (
        <BackofficeLayout currentTab="movements">
            <Head title="Kartu Stok & Buku Besar Mutasi - EXPOS Backoffice" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                            <ArrowUpDown className="w-7 h-7 text-purple-600" />
                            Kartu Stok & Buku Besar Mutasi Inventaris
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Audit jejak digital mutasi stok secara immutable: dari penjualan POS, stok masuk supplier, hingga opname & waste.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/backoffice/ingredients"
                            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition"
                        >
                            <Boxes className="w-4 h-4 text-emerald-600" />
                            Master Bahan Baku
                        </Link>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center gap-3 shadow-xs">
                    {/* Outlet Filter */}
                    <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedOutlet}
                            onChange={(e) => {
                                setSelectedOutlet(e.target.value);
                                applyFilter('outlet_id', e.target.value);
                            }}
                            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="all">Semua Cabang Gerai</option>
                            {outlets.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name} ({o.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Item Type */}
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select
                            value={selectedItemType}
                            onChange={(e) => {
                                setSelectedItemType(e.target.value);
                                applyFilter('item_type', e.target.value);
                            }}
                            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Tipe Barang</option>
                            <option value="ingredient">Bahan Baku (Ingredients)</option>
                            <option value="product">Barang Jadi (Retail Products)</option>
                        </select>
                    </div>

                    {/* Movement Type */}
                    <div className="flex items-center gap-1.5">
                        <select
                            value={selectedType}
                            onChange={(e) => {
                                setSelectedType(e.target.value);
                                applyFilter('type', e.target.value);
                            }}
                            className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-hidden focus:border-slate-900"
                        >
                            <option value="">Semua Jenis Mutasi</option>
                            <option value="sale">Penjualan POS</option>
                            <option value="purchase">Barang Masuk / Pembelian</option>
                            <option value="adjustment">Stok Opname</option>
                            <option value="waste">Barang Rusak / Waste</option>
                        </select>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">Waktu & Gerai</th>
                                    <th className="px-4 py-3">Nama Item & SKU</th>
                                    <th className="px-4 py-3">Jenis Mutasi</th>
                                    <th className="px-4 py-3 text-right">Perubahan Qty</th>
                                    <th className="px-4 py-3 text-right">Saldo Sesudah</th>
                                    <th className="px-4 py-3">Catatan / Referensi</th>
                                    <th className="px-4 py-3">Operator</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {movements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            <ArrowUpDown className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <span>Belum ada catatan mutasi kartu stok untuk filter yang dipilih.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    movements.data.map((m) => {
                                        const itemName = m.item_type === 'ingredient'
                                            ? m.ingredient?.name || 'Bahan Baku'
                                            : m.product?.name || 'Barang Jadi';
                                        const sku = m.item_type === 'ingredient'
                                            ? m.ingredient?.sku
                                            : m.product?.sku;
                                        const unit = m.item_type === 'ingredient'
                                            ? m.ingredient?.unit || 'unit'
                                            : 'pcs';
                                        const isNegative = Number(m.quantity) < 0;

                                        return (
                                            <tr key={m.id} className="hover:bg-slate-50/70 transition">
                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    <div className="font-semibold text-slate-900">
                                                        {new Date(m.created_at).toLocaleString('id-ID', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        {m.outlet?.code} - {m.outlet?.name}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5">
                                                    <div className="font-bold text-slate-900">{itemName}</div>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {sku}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 whitespace-nowrap">
                                                    {getTypeBadge(m.type)}
                                                </td>

                                                <td className={`px-4 py-3.5 text-right font-mono font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {isNegative ? '' : '+'}
                                                    {Number(m.quantity).toLocaleString('id-ID')} {unit}
                                                </td>

                                                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                                                    {Number(m.balance_after).toLocaleString('id-ID')} {unit}
                                                    <span className="text-[10px] text-slate-400 block font-normal">
                                                        Awal: {Number(m.balance_before).toLocaleString('id-ID')}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate" title={m.notes || ''}>
                                                    {m.notes || '-'}
                                                </td>

                                                <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                                                    {m.user?.name || 'Sistem POS'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {movements.last_page > 1 && (
                        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white">
                            <div>
                                Menampilkan {movements.from} - {movements.to} dari {movements.total} data mutasi
                            </div>
                            <div className="flex items-center gap-1.5">
                                {movements.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            link.active
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : link.url
                                                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                                                : 'text-slate-400 border border-transparent cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BackofficeLayout>
    );
}
