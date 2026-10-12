import React, { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import {
    SlidersHorizontal,
    Plus,
    Search,
    Trash2,
    Boxes,
    Package,
    ArrowUpDown,
    CheckCircle2,
    X,
    Percent,
    TrendingUp,
    Utensils,
} from 'lucide-react';

interface RecipeLine {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    ingredient_sku: string;
    variant_name: string | null;
    quantity: number;
    unit: string;
    cost: number;
}

interface ProductItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    variants: any[];
    calculated_cogs: number;
    recipes: RecipeLine[];
}

interface IngredientOption {
    id: string;
    sku: string;
    name: string;
    unit: string;
    cost_per_unit: number;
}

interface RecipesProps {
    products: ProductItem[];
    ingredients: IngredientOption[];
    filters: {
        search?: string;
    };
}

export default function RecipesIndex({ products, ingredients, filters }: RecipesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

    const recipeForm = useForm({
        product_id: '',
        variant_name: '',
        ingredient_id: ingredients[0]?.id || '',
        quantity: 1,
        unit: 'gram',
        notes: '',
    });

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/backoffice/recipes',
            search ? { search } : {},
            { preserveState: true }
        );
    };

    const openAddRecipeModal = (product: ProductItem) => {
        setSelectedProduct(product);
        recipeForm.reset();
        const firstIng = ingredients[0];
        recipeForm.setData({
            product_id: product.id,
            variant_name: product.variants?.[0]?.name || '',
            ingredient_id: firstIng?.id || '',
            quantity: 1,
            unit: firstIng?.unit || 'gram',
            notes: '',
        });
        setIsAddModalOpen(true);
    };

    const handleIngredientSelect = (ingId: string) => {
        const found = ingredients.find((i) => i.id === ingId);
        if (found) {
            recipeForm.setData({
                ...recipeForm.data,
                ingredient_id: ingId,
                unit: found.unit,
            });
        }
    };

    const handleSaveRecipe = (e: React.FormEvent) => {
        e.preventDefault();
        recipeForm.post('/backoffice/recipes', {
            onSuccess: () => setIsAddModalOpen(false),
        });
    };

    const handleDeleteRecipeLine = (recipeId: string, ingredientName: string) => {
        if (confirm(`Hapus takaran "${ingredientName}" dari resep menu ini?`)) {
            router.delete(`/backoffice/recipes/${recipeId}`);
        }
    };

    return (
        <BackofficeLayout currentTab="recipes">
            <Head title="Resep Menu & Bill of Materials (BOM) - EXPOS Backoffice" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                            <SlidersHorizontal className="w-7 h-7 text-cyan-600" />
                            Formula Resep & Racikan (Bill of Materials)
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Atur formula bahan baku per menu/varian. Stok bahan akan otomatis berkurang presisi saat transaksi POS terjadi.
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
                        <Link
                            href="/backoffice/inventory/movements"
                            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-200 shadow-xs transition"
                        >
                            <ArrowUpDown className="w-4 h-4 text-purple-600" />
                            Kartu Stok
                        </Link>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                    <form onSubmit={handleSearchSubmit} className="relative max-w-md">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama menu atau SKU..."
                            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 transition"
                        />
                    </form>
                </div>

                {/* Product Recipe Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {products.map((prod) => {
                        const hasRecipe = prod.recipes.length > 0;
                        const cogs = prod.calculated_cogs;
                        const price = prod.price;
                        const grossProfit = price - cogs;
                        const marginPercent = price > 0 ? (grossProfit / price) * 100 : 0;

                        return (
                            <div
                                key={prod.id}
                                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
                            >
                                <div>
                                    {/* Product Card Top */}
                                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-slate-900">{prod.name}</h3>
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono">
                                                    {prod.sku}
                                                </span>
                                            </div>
                                            <span className="text-xs text-slate-500 block mt-0.5">
                                                Kategori: {prod.category}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => openAddRecipeModal(prod)}
                                            className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-[11px] font-semibold flex items-center gap-1.5 transition active:scale-95"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            Tambah Bahan
                                        </button>
                                    </div>

                                    {/* Financial & Profit Margin Indicator */}
                                    <div className="grid grid-cols-3 gap-2 my-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Harga Jual</span>
                                            <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                                                Rp {price.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Estimasi HPP (BOM)</span>
                                            <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
                                                Rp {Math.round(cogs).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Gross Margin</span>
                                            <span className={`text-xs font-extrabold mt-0.5 block ${marginPercent >= 50 ? 'text-cyan-700' : 'text-amber-600'}`}>
                                                {marginPercent.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Recipe Ingredients Composition */}
                                    <div className="space-y-1.5">
                                        <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                                            Komposisi Takaran Resep:
                                        </span>

                                        {!hasRecipe ? (
                                            <div className="py-5 text-center border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-slate-400 text-xs">
                                                Belum ada resep bahan baku. Produk ini menggunakan stok barang jadi langsung (retail).
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden bg-white">
                                                {prod.recipes.map((rcp) => (
                                                    <div
                                                        key={rcp.id}
                                                        className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50/70 transition"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-slate-800">
                                                                {rcp.ingredient_name}
                                                            </span>
                                                            {rcp.variant_name && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-medium">
                                                                    {rcp.variant_name}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <span className="font-mono text-cyan-700 font-bold">
                                                                {rcp.quantity} {rcp.unit}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400">
                                                                (Rp {Math.round(rcp.cost).toLocaleString('id-ID')})
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteRecipeLine(rcp.id, rcp.ingredient_name)}
                                                                className="text-slate-400 hover:text-rose-600 transition p-1"
                                                                title="Hapus bahan dari resep"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal Tambah Bahan ke Resep */}
            {isAddModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 text-white flex items-center justify-between px-6 py-4 shrink-0">
                            <div>
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    <Utensils className="w-5 h-5 text-cyan-400" />
                                    Tambah Racikan Menu
                                </h2>
                                <span className="text-xs text-cyan-400 mt-0.5 block font-medium">
                                    {selectedProduct.name}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveRecipe} className="p-6 space-y-4 overflow-y-auto">
                            {/* Variant Selector (if product has variants) */}
                            {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Khusus Varian (Opsional)
                                    </label>
                                    <select
                                        value={recipeForm.data.variant_name}
                                        onChange={(e) => recipeForm.setData('variant_name', e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    >
                                        <option value="">Berlaku untuk Semua Varian</option>
                                        {selectedProduct.variants.map((v: any, idx: number) => (
                                            <option key={idx} value={v.name}>
                                                {v.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Pilih Bahan Baku *
                                </label>
                                <select
                                    required
                                    value={recipeForm.data.ingredient_id}
                                    onChange={(e) => handleIngredientSelect(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                >
                                    {ingredients.map((ing) => (
                                        <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.sku}) - Satuan: {ing.unit} (Rp {ing.cost_per_unit}/{ing.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Takaran Kuantitas *
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        min="0.001"
                                        required
                                        value={recipeForm.data.quantity}
                                        onChange={(e) => recipeForm.setData('quantity', parseFloat(e.target.value) || 0)}
                                        placeholder="18"
                                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Satuan
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={recipeForm.data.unit}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 capitalize cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={recipeForm.processing}
                                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs transition"
                                >
                                    {recipeForm.processing ? 'Menyimpan...' : 'Simpan Racikan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
