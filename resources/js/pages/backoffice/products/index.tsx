import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah } from '@/lib/printer';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Check,
    Package,
    Image as ImageIcon,
    Upload,
} from 'lucide-react';
import CategorySearchableSelect from '@/components/category-searchable-select';
import type { PosCategory, PosProduct, ProductVariant } from '@/types/pos';

interface ProductIndexProps {
    products: PosProduct[];
    categories: (PosCategory | string)[];
    filters: {
        search?: string;
        category?: string;
    };
}

export default function ProductIndex({
    products,
    categories,
    filters,
}: ProductIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [categoryList, setCategoryList] = useState<(PosCategory | string)[]>(categories || []);

    const getCategoryName = (c: PosCategory | string) => (typeof c === 'string' ? c : c.name);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        sku: '',
        barcode: '',
        name: '',
        category: 'Coffee',
        price: '',
        cost_price: '',
        stock: '0',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/backoffice/products',
            { search, category: selectedCategory },
            { preserveState: true }
        );
    };

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        router.get(
            '/backoffice/products',
            { search, category: cat },
            { preserveState: true }
        );
    };

    const openAddModal = () => {
        setEditingProduct(null);
        const defaultCat = categoryList.length > 0 ? getCategoryName(categoryList[0]) : 'Coffee';
        setFormData({
            sku: `PRD-${Date.now().toString().slice(-4)}`,
            barcode: '',
            name: '',
            category: defaultCat,
            price: '',
            cost_price: '',
            stock: '10',
        });
        setImageFile(null);
        setImagePreview(null);
        setVariants([]);
        setIsModalOpen(true);
    };

    const openEditModal = (p: PosProduct) => {
        setEditingProduct(p);
        setFormData({
            sku: p.sku,
            barcode: p.barcode || '',
            name: p.name,
            category: p.category,
            price: p.price.toString(),
            cost_price: p.cost_price ? p.cost_price.toString() : '',
            stock: p.stock.toString(),
        });
        setImageFile(null);
        setImagePreview(p.image_url || null);
        setVariants(Array.isArray(p.variants) ? p.variants : []);
        setIsModalOpen(true);
    };

    const addVariant = () => {
        setVariants([...variants, { name: '', additional_price: 0 }]);
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const next = [...variants];
        next[index] = { ...next[index], [field]: value };
        setVariants(next);
    };

    const removeVariant = (index: number) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validVariants = variants.filter((v) => v.name.trim() !== '');

        const data: Record<string, any> = {
            sku: formData.sku,
            barcode: formData.barcode || null,
            name: formData.name,
            category: formData.category,
            price: parseFloat(formData.price) || 0,
            cost_price: parseFloat(formData.cost_price) || 0,
            stock: parseInt(formData.stock) || 0,
            variants: validVariants.length > 0 ? JSON.stringify(validVariants) : null,
        };

        if (imageFile) {
            data.image = imageFile;
        }

        if (editingProduct) {
            data._method = 'put';
            router.post(`/backoffice/products/${editingProduct.id}`, data, {
                forceFormData: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            router.post('/backoffice/products', data, {
                forceFormData: true,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Hapus produk "${name}"?`)) {
            router.delete(`/backoffice/products/${id}`);
        }
    };

    return (
        <BackofficeLayout currentTab="products">
            <Head title="Backoffice - Katalog Produk" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Katalog Produk</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola data item, harga jual, dan stok gerai kasir
                    </p>
                </div>

                <button
                    onClick={openAddModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs active:scale-95 transition"
                >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Tambah Produk</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari berdasarkan nama, SKU, atau barcode..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-slate-900"
                    />
                </form>

                <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-hidden focus:border-slate-900"
                >
                    <option value="">Semua Kategori</option>
                    {categoryList.map((c) => {
                        const name = getCategoryName(c);
                        const id = typeof c === 'string' ? c : c.id;
                        return (
                            <option key={id} value={name}>
                                {name}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">SKU / Barcode</th>
                                <th className="py-3 px-4">Nama Produk</th>
                                <th className="py-3 px-4">Kategori</th>
                                <th className="py-3 px-4">Harga Jual</th>
                                <th className="py-3 px-4">Harga Pokok</th>
                                <th className="py-3 px-4">Stok</th>
                                <th className="py-3 px-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-400">
                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <span>Tidak ada data produk ditemukan</span>
                                    </td>
                                </tr>
                            ) : (
                                products.map((prod) => (
                                    <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                                        <td className="py-3 px-4">
                                            <span className="font-mono font-medium text-slate-800 block">
                                                {prod.sku}
                                            </span>
                                            {prod.barcode && (
                                                <span className="font-mono text-[10px] text-slate-400 block">
                                                    {prod.barcode}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {prod.image_url ? (
                                                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Package className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-slate-900 block">{prod.name}</span>
                                                    {prod.variants && prod.variants.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {prod.variants.map((v, idx) => (
                                                                <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                                                    {v.name}
                                                                    {v.additional_price ? ` (+${formatRupiah(v.additional_price)})` : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                                {prod.category}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-bold text-slate-900">
                                            {formatRupiah(prod.price)}
                                        </td>
                                        <td className="py-3 px-4 text-slate-500">
                                            {formatRupiah(prod.cost_price || 0)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                                    prod.stock <= 10
                                                        ? 'bg-slate-200 text-slate-900'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                }`}
                                            >
                                                {prod.stock} pcs
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right space-x-1">
                                            <button
                                                onClick={() => openEditModal(prod)}
                                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(prod.id, prod.name)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Tambah / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                            <h2 className="font-semibold text-base">
                                {editingProduct ? 'Perbarui Produk' : 'Tambah Produk Baru'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                                    Foto Produk (Opsional)
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition">
                                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Pilih Foto</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                }}
                                                className="ml-2 text-xs text-rose-600 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                        <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, atau WEBP max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        SKU
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Barcode (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.barcode}
                                        onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Nama Produk
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                    Kategori
                                </label>
                                <CategorySearchableSelect
                                    value={formData.category}
                                    onChange={(catName) => setFormData({ ...formData, category: catName })}
                                    categories={categoryList}
                                    onCategoryCreated={(newCat) => {
                                        setCategoryList((prev) => [...prev, newCat]);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Harga Jual
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden focus:border-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Harga Pokok
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.cost_price}
                                        onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                                        Stok
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-hidden focus:border-slate-900"
                                    />
                                </div>
                            </div>

                            {/* Varian & Modifier */}
                            <div className="border-t border-slate-100 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 uppercase">
                                            Varian / Opsi Produk (Opsional)
                                        </label>
                                        <p className="text-[11px] text-slate-400">Pilihan varian ukuran, topping, dll.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addVariant}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition"
                                    >
                                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Tambah</span>
                                    </button>
                                </div>

                                {variants.length > 0 && (
                                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                                        {variants.map((v, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nama Varian (misal: Large)"
                                                    value={v.name}
                                                    onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900"
                                                />
                                                <div className="w-32 relative">
                                                    <span className="text-[10px] text-slate-400 absolute left-2 top-2">+Rp</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        placeholder="0"
                                                        value={v.additional_price || ''}
                                                        onChange={(e) => updateVariant(idx, 'additional_price', parseFloat(e.target.value) || 0)}
                                                        className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-hidden focus:border-slate-900"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariant(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Simpan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
