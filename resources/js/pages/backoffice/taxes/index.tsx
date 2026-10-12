import React, { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import {
    Percent,
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    X,
    Info,
    ArrowRight,
    Coins,
} from 'lucide-react';

interface TaxItem {
    id: number;
    name: string;
    code: string | null;
    rate: string | number;
    type: 'exclusive' | 'inclusive';
    is_auto_apply: boolean;
    is_active: boolean;
}

interface TaxPageProps {
    taxes: TaxItem[];
}

export default function TaxIndex({ taxes }: TaxPageProps) {
    // Tax Modal state
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxItem | null>(null);

    // Tax Form
    const taxForm = useForm({
        name: '',
        code: '',
        rate: 10,
        type: 'exclusive' as 'exclusive' | 'inclusive',
        is_auto_apply: true,
        is_active: true,
    });

    // Tax Modal handlers
    const openCreateTaxModal = () => {
        setEditingTax(null);
        taxForm.reset();
        taxForm.setData({
            name: '',
            code: '',
            rate: 10,
            type: 'exclusive',
            is_auto_apply: true,
            is_active: true,
        });
        setIsTaxModalOpen(true);
    };

    const openEditTaxModal = (tax: TaxItem) => {
        setEditingTax(tax);
        taxForm.reset();
        taxForm.setData({
            name: tax.name,
            code: tax.code || '',
            rate: parseFloat(tax.rate as string) || 0,
            type: tax.type,
            is_auto_apply: tax.is_auto_apply,
            is_active: tax.is_active,
        });
        setIsTaxModalOpen(true);
    };

    const handleSaveTax = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTax) {
            taxForm.put(`/backoffice/taxes/${editingTax.id}`, {
                onSuccess: () => setIsTaxModalOpen(false),
            });
        } else {
            taxForm.post('/backoffice/taxes', {
                onSuccess: () => setIsTaxModalOpen(false),
            });
        }
    };

    const handleDeleteTax = (tax: TaxItem) => {
        if (confirm(`Hapus konfigurasi pajak "${tax.name}"?`)) {
            router.delete(`/backoffice/taxes/${tax.id}`);
        }
    };

    return (
        <BackofficeLayout currentTab="taxes">
            <Head title="Backoffice - Master Pajak (Tax Rules)" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wide border border-emerald-200">
                            Master Data
                        </span>
                        <Link
                            href="/backoffice/charges"
                            className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition"
                        >
                            <span>Lihat Biaya Tambahan</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Percent className="w-6 h-6 text-emerald-600" />
                        <span>Master Pajak</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Konfigurasi aturan pajak daerah restoran (PB1) atau PPN, tarif persentase, dan mode kalkulasi POS
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateTaxModal}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Tambah Aturan Pajak</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3 text-xs text-emerald-900">
                    <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block">Model Pajak Eksklusif vs Inklusif</span>
                        <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                            Pajak <strong>Eksklusif</strong> dihitung dan ditambahkan di atas subtotal keranjang (standar kafe & resto di Indonesia). Pajak <strong>Inklusif</strong> mengasumsikan harga menu yang tertera sudah termasuk pajak di dalamnya (*net price*).
                        </span>
                    </div>
                </div>

                {/* Taxes Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Nama Pajak</th>
                                    <th className="py-3 px-4">Kode</th>
                                    <th className="py-3 px-4">Tarif</th>
                                    <th className="py-3 px-4">Tipe Pengenaan</th>
                                    <th className="py-3 px-4">Otomatis Diterapkan</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {taxes.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <Percent className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <span>Belum ada konfigurasi pajak</span>
                                        </td>
                                    </tr>
                                ) : (
                                    taxes.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                {t.name}
                                            </td>
                                            <td className="py-3 px-4 font-mono font-medium text-slate-600">
                                                {t.code || '-'}
                                            </td>
                                            <td className="py-3 px-4 font-extrabold text-emerald-700 text-sm">
                                                {parseFloat(t.rate as string)}%
                                            </td>
                                            <td className="py-3 px-4">
                                                {t.type === 'exclusive' ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                                                        Eksklusif (+{parseFloat(t.rate as string)}%)
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                                                        Inklusif (Nett di Menu)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {t.is_auto_apply ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Ya
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">Tidak (Manual)</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {t.is_active ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 font-medium text-[10px]">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right space-x-1">
                                                <button
                                                    onClick={() => openEditTaxModal(t)}
                                                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                    title="Edit Pajak"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTax(t)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                    title="Hapus Pajak"
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
            </div>

            {/* MODAL: CREATE / EDIT TAX */}
            {isTaxModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">
                                    {editingTax ? 'Edit Aturan Pajak' : 'Tambah Aturan Pajak'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Atur pengenaan PB1 (10%), PPN (11%), atau pajak khusus lainnya
                                </p>
                            </div>
                            <button
                                onClick={() => setIsTaxModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTax} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Nama Pajak *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={taxForm.data.name}
                                    onChange={(e) => taxForm.setData('name', e.target.value)}
                                    placeholder="Contoh: PB1 (Pajak Restoran)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Kode Singkat
                                    </label>
                                    <input
                                        type="text"
                                        value={taxForm.data.code}
                                        onChange={(e) => taxForm.setData('code', e.target.value)}
                                        placeholder="PB1 / PPN"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Tarif (%) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={taxForm.data.rate}
                                        onChange={(e) =>
                                            taxForm.setData('rate', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Tipe Pengenaan Pajak
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => taxForm.setData('type', 'exclusive')}
                                        className={`p-3 rounded-xl border text-left transition ${
                                            taxForm.data.type === 'exclusive'
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        <span className="font-bold block text-xs">Eksklusif</span>
                                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                            Ditambahkan di atas subtotal
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => taxForm.setData('type', 'inclusive')}
                                        className={`p-3 rounded-xl border text-left transition ${
                                            taxForm.data.type === 'inclusive'
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        <span className="font-bold block text-xs">Inklusif</span>
                                        <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                            Termasuk di harga jual
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={taxForm.data.is_auto_apply}
                                        onChange={(e) => taxForm.setData('is_auto_apply', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className="font-semibold text-slate-700">
                                        Otomatis Diterapkan pada Pesanan Baru
                                    </span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={taxForm.data.is_active}
                                        onChange={(e) => taxForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className="font-bold text-slate-800">
                                        Pajak Aktif
                                    </span>
                                </label>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsTaxModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={taxForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                                >
                                    <span>{editingTax ? 'Simpan Perubahan' : 'Buat Pajak'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
