import React, { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import {
    Boxes,
    Plus,
    Search,
    Edit2,
    Trash2,
    SlidersHorizontal,
    AlertTriangle,
    Layers,
    DollarSign,
    Store,
    ArrowUpDown,
    CheckCircle2,
    X,
    Filter,
} from 'lucide-react';

interface StockBreakdown {
    outlet_id: string;
    outlet_name: string;
    outlet_code: string;
    current_stock: number;
    min_stock_alert: number;
    is_low: boolean;
}

interface IngredientItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    unit: string;
    cost_per_unit: number;
    is_active: boolean;
    total_stock: number;
    outlet_stock: number | null;
    stocks: StockBreakdown[];
}

interface OutletItem {
    id: string;
    name: string;
    code: string;
}

interface IngredientsProps {
    ingredients: IngredientItem[];
    categories: string[];
    outlets: OutletItem[];
    filters: {
        search?: string;
        category?: string;
        outlet_id: string;
    };
}

export default function IngredientsIndex({
    ingredients,
    categories,
    outlets,
    filters,
}: IngredientsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedOutlet, setSelectedOutlet] = useState(filters.outlet_id || 'all');

    // Create / Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<IngredientItem | null>(null);

    // Stock Adjust Modal State
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [adjustItem, setAdjustItem] = useState<IngredientItem | null>(null);

    const form = useForm({
        sku: '',
        name: '',
        category: 'Coffee Beans',
        unit: 'gram',
        cost_per_unit: 0,
        is_active: true,
        initial_stocks: {} as Record<string, number>,
    });

    const adjustForm = useForm({
        outlet_id: outlets[0]?.id || '',
        item_type: 'ingredient' as 'ingredient' | 'product',
        item_id: '',
        type: 'purchase' as 'purchase' | 'adjustment' | 'waste',
        quantity: 0,
        notes: '',
    });

    const applyFilter = (key: string, value: string) => {
        const params: any = {
            search: key === 'search' ? value : search,
            category: key === 'category' ? value : selectedCategory,
            outlet_id: key === 'outlet_id' ? value : selectedOutlet,
        };
        if (!params.search) delete params.search;
        if (!params.category) delete params.category;
        if (params.outlet_id === 'all') delete params.outlet_id;

        router.get('/backoffice/ingredients', params, { preserveState: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('search', search);
    };

    const openCreateModal = () => {
        setEditingItem(null);
        form.reset();
        const initialMap: Record<string, number> = {};
        outlets.forEach((o) => {
            initialMap[o.id] = 0;
        });
        form.setData({
            sku: '',
            name: '',
            category: categories[0] || 'Coffee Beans',
            unit: 'gram',
            cost_per_unit: 0,
            is_active: true,
            initial_stocks: initialMap,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (item: IngredientItem) => {
        setEditingItem(item);
        form.reset();
        form.setData({
            sku: item.sku,
            name: item.name,
            category: item.category,
            unit: item.unit,
            cost_per_unit: item.cost_per_unit,
            is_active: item.is_active,
            initial_stocks: {},
        });
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            form.put(`/backoffice/ingredients/${editingItem.id}`, {
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post('/backoffice/ingredients', {
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (item: IngredientItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus bahan baku "${item.name}"?`)) {
            router.delete(`/backoffice/ingredients/${item.id}`);
        }
    };

    const openAdjustModal = (item: IngredientItem) => {
        setAdjustItem(item);
        adjustForm.reset();
        adjustForm.setData({
            outlet_id: outlets[0]?.id || '',
            item_type: 'ingredient',
            item_id: item.id,
            type: 'purchase',
            quantity: 0,
            notes: '',
        });
        setIsAdjustModalOpen(true);
    };

    const handleSaveAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        adjustForm.post('/backoffice/inventory/adjust', {
            onSuccess: () => setIsAdjustModalOpen(false),
        });
    };

    // Calculate Summary Stats
    const totalIngredients = ingredients.length;
    const lowStockCount = ingredients.filter((ing) =>
        ing.stocks.some((s) => s.is_low)
    ).length;
    const totalInventoryValue = ingredients.reduce((sum, ing) => {
        const stock = selectedOutlet !== 'all' && ing.outlet_stock !== null
            ? ing.outlet_stock
            : ing.total_stock;
        return sum + stock * ing.cost_per_unit;
    }, 0);

    return (
        <BackofficeLayout currentTab="ingredients">
            <Head title="Master Bahan Baku & Stok - EXPOS Backoffice" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                            <Boxes className="w-7 h-7 text-emerald-600" />
                            Manajemen Bahan Baku (Ingredients)
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Kelola inventaris bahan mentah, takaran unit, biaya HPP, dan stok di setiap gerai cabang.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/backoffice/recipes"
                            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition"
                        >
                            <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                            Resep Menu (BOM)
                        </Link>
                        <Link
                            href="/backoffice/inventory/movements"
                            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition"
                        >
                            <ArrowUpDown className="w-4 h-4 text-purple-600" />
                            Kartu Stok
                        </Link>
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Bahan Baku
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Total Item Bahan</span>
                            <span className="text-2xl font-bold text-slate-900 mt-1 block">
                                {totalIngredients} <span className="text-xs text-slate-400 font-normal">Bahan</span>
                            </span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <Boxes className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Peringatan Stok Menipis</span>
                            <span className={`text-2xl font-bold mt-1 block ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                                {lowStockCount} <span className="text-xs text-slate-400 font-normal">Item Kritis</span>
                            </span>
                        </div>
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div>
                            <span className="text-xs text-slate-500 font-medium block">Estimasi Nilai Aset Bahan</span>
                            <span className="text-2xl font-bold text-emerald-600 mt-1 block">
                                Rp {Math.round(totalInventoryValue).toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari SKU atau nama bahan baku..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 transition"
                        />
                    </form>

                    <div className="flex items-center gap-2.5 overflow-x-auto">
                        {/* Outlet Filter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedOutlet}
                                onChange={(e) => {
                                    setSelectedOutlet(e.target.value);
                                    applyFilter('outlet_id', e.target.value);
                                }}
                                className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-slate-900"
                            >
                                <option value="all">Semua Cabang (Konsolidasi)</option>
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name} ({o.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Filter className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    applyFilter('category', e.target.value);
                                }}
                                className="bg-white border border-slate-200 text-xs text-slate-700 rounded-xl px-2.5 py-2 focus:outline-hidden focus:border-slate-900"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table of Ingredients */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">SKU & Bahan Baku</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Satuan</th>
                                    <th className="px-4 py-3">HPP Satuan</th>
                                    <th className="px-4 py-3">Stok per Cabang</th>
                                    <th className="px-4 py-3 text-right">Total Stok</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {ingredients.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                                            <Boxes className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <span>Tidak ada bahan baku yang ditemukan.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    ingredients.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                            <td className="px-4 py-3.5">
                                                <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                    {item.sku}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 font-medium text-slate-700 capitalize">
                                                {item.unit}
                                            </td>
                                            <td className="px-4 py-3.5 font-semibold text-slate-900">
                                                Rp {item.cost_per_unit.toLocaleString('id-ID')}
                                                <span className="text-[10px] text-slate-400 block font-normal">
                                                    / {item.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.stocks.map((stock) => (
                                                        <span
                                                            key={stock.outlet_id}
                                                            title={`Min alert: ${stock.min_stock_alert} ${item.unit}`}
                                                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center gap-1 ${
                                                                stock.is_low
                                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                                                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                                            }`}
                                                        >
                                                            <span className="text-slate-500">{stock.outlet_code}:</span>
                                                            <span>
                                                                {Number(stock.current_stock).toLocaleString('id-ID')} {item.unit}
                                                            </span>
                                                            {stock.is_low && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                                                {Number(item.total_stock).toLocaleString('id-ID')}{' '}
                                                <span className="text-[11px] text-slate-400 font-normal">
                                                    {item.unit}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openAdjustModal(item)}
                                                        title="Penyesuaian Stok / Opname"
                                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-semibold transition"
                                                    >
                                                        Mutasi / Opname
                                                    </button>
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                        title="Edit Data Bahan"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        title="Hapus Bahan"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 text-white flex items-center justify-between px-6 py-4 shrink-0">
                            <h2 className="text-base font-bold flex items-center gap-2">
                                <Boxes className="w-5 h-5 text-emerald-400" />
                                {editingItem ? 'Edit Bahan Baku' : 'Tambah Master Bahan Baku Baru'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kode SKU *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.sku}
                                        onChange={(e) => form.setData('sku', e.target.value.toUpperCase())}
                                        placeholder="e.g. ING-COF-01"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Kategori *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={form.data.category}
                                        onChange={(e) => form.setData('category', e.target.value)}
                                        placeholder="e.g. Coffee Beans, Dairy"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama Bahan Baku *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    placeholder="e.g. Biji Kopi Arabica Gayo"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Satuan Dasar *
                                    </label>
                                    <select
                                        value={form.data.unit}
                                        onChange={(e) => form.setData('unit', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900 capitalize"
                                    >
                                        <option value="gram">gram (g)</option>
                                        <option value="ml">mililiter (ml)</option>
                                        <option value="pcs">pieces (pcs)</option>
                                        <option value="portion">portion (porsi)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        HPP per Satuan (Rp) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0"
                                        required
                                        value={form.data.cost_per_unit}
                                        onChange={(e) => form.setData('cost_per_unit', parseFloat(e.target.value) || 0)}
                                        placeholder="280"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    />
                                </div>
                            </div>

                            {!editingItem && outlets.length > 0 && (
                                <div className="pt-2 border-t border-slate-200">
                                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                                        Stok Awal per Gerai Cabang ({form.data.unit})
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {outlets.map((outlet) => (
                                            <div key={outlet.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                <span className="text-[11px] text-slate-600 block font-medium">
                                                    {outlet.name}
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    value={form.data.initial_stocks[outlet.id] ?? 0}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        form.setData('initial_stocks', {
                                                            ...form.data.initial_stocks,
                                                            [outlet.id]: val,
                                                        });
                                                    }}
                                                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 mt-1 focus:outline-hidden focus:border-slate-900"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Simpan Bahan Baku'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock Adjust Modal */}
            {isAdjustModalOpen && adjustItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 text-white flex items-center justify-between px-6 py-4 shrink-0">
                            <div>
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    <ArrowUpDown className="w-5 h-5 text-emerald-400" />
                                    Mutasi / Penyesuaian Stok
                                </h2>
                                <span className="text-xs text-emerald-400 mt-0.5 block font-medium">
                                    {adjustItem.name} ({adjustItem.sku})
                                </span>
                            </div>
                            <button
                                onClick={() => setIsAdjustModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveAdjust} className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Pilih Gerai Cabang *
                                </label>
                                <select
                                    required
                                    value={adjustForm.data.outlet_id}
                                    onChange={(e) => adjustForm.setData('outlet_id', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                >
                                    {outlets.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name} ({o.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Jenis Mutasi *
                                    </label>
                                    <select
                                        value={adjustForm.data.type}
                                        onChange={(e) => adjustForm.setData('type', e.target.value as any)}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    >
                                        <option value="purchase">Barang Masuk / Pembelian</option>
                                        <option value="adjustment">Stok Opname (Penyesuaian)</option>
                                        <option value="waste">Barang Rusak / Waste (Tumpah)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Jumlah ({adjustItem.unit}) *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        required
                                        value={adjustForm.data.quantity}
                                        onChange={(e) => adjustForm.setData('quantity', parseFloat(e.target.value) || 0)}
                                        placeholder="1000"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Catatan / Alasan Mutasi *
                                </label>
                                <textarea
                                    required
                                    rows={2}
                                    value={adjustForm.data.notes}
                                    onChange={(e) => adjustForm.setData('notes', e.target.value)}
                                    placeholder="Contoh: Kulakan dari supplier Greenfields, atau susu tumpah"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition"
                                >
                                    {adjustForm.processing ? 'Menyimpan...' : 'Simpan Mutasi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
