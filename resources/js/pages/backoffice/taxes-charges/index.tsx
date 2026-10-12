import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah } from '@/lib/printer';
import {
    Percent,
    Coins,
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    X,
    Info,
    Utensils,
    Package,
    Truck,
    Layers,
    ShieldAlert,
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

interface ChargeItem {
    id: number;
    name: string;
    type: 'percent' | 'fixed';
    rate: string | number;
    is_taxable: boolean;
    applies_to: 'all' | 'dine_in' | 'takeaway' | 'delivery';
    is_auto_apply: boolean;
    is_active: boolean;
}

interface TaxChargePageProps {
    taxes: TaxItem[];
    charges: ChargeItem[];
}

export default function TaxChargeIndex({ taxes, charges }: TaxChargePageProps) {
    const [activeTab, setActiveTab] = useState<'taxes' | 'charges'>('taxes');

    // Tax Modal state
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxItem | null>(null);

    // Charge Modal state
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [editingCharge, setEditingCharge] = useState<ChargeItem | null>(null);

    // Tax Form
    const taxForm = useForm({
        name: '',
        code: '',
        rate: 10,
        type: 'exclusive' as 'exclusive' | 'inclusive',
        is_auto_apply: true,
        is_active: true,
    });

    // Charge Form
    const chargeForm = useForm({
        name: '',
        type: 'percent' as 'percent' | 'fixed',
        rate: 5,
        is_taxable: true,
        applies_to: 'all' as 'all' | 'dine_in' | 'takeaway' | 'delivery',
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

    // Charge Modal handlers
    const openCreateChargeModal = () => {
        setEditingCharge(null);
        chargeForm.reset();
        chargeForm.setData({
            name: '',
            type: 'percent',
            rate: 5,
            is_taxable: true,
            applies_to: 'all',
            is_auto_apply: true,
            is_active: true,
        });
        setIsChargeModalOpen(true);
    };

    const openEditChargeModal = (charge: ChargeItem) => {
        setEditingCharge(charge);
        chargeForm.reset();
        chargeForm.setData({
            name: charge.name,
            type: charge.type,
            rate: parseFloat(charge.rate as string) || 0,
            is_taxable: charge.is_taxable,
            applies_to: charge.applies_to,
            is_auto_apply: charge.is_auto_apply,
            is_active: charge.is_active,
        });
        setIsChargeModalOpen(true);
    };

    const handleSaveCharge = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCharge) {
            chargeForm.put(`/backoffice/charges/${editingCharge.id}`, {
                onSuccess: () => setIsChargeModalOpen(false),
            });
        } else {
            chargeForm.post('/backoffice/charges', {
                onSuccess: () => setIsChargeModalOpen(false),
            });
        }
    };

    const handleDeleteCharge = (charge: ChargeItem) => {
        if (confirm(`Hapus biaya tambahan "${charge.name}"?`)) {
            router.delete(`/backoffice/charges/${charge.id}`);
        }
    };

    const getAppliesToBadge = (appliesTo: string) => {
        switch (appliesTo) {
            case 'dine_in':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                        <Utensils className="w-3 h-3" /> Dine In Sahaja
                    </span>
                );
            case 'takeaway':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        <Package className="w-3 h-3" /> Takeaway Sahaja
                    </span>
                );
            case 'delivery':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                        <Truck className="w-3 h-3" /> Delivery Sahaja
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                        <Layers className="w-3 h-3" /> Semua Tipe
                    </span>
                );
        }
    };

    return (
        <BackofficeLayout currentTab="taxes-charges">
            <Head title="Backoffice - Master Pajak & Biaya Tambahan" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Master Pajak & Biaya Tambahan
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Konfigurasi aturan pajak daerah/PPN serta biaya layanan (*service charge*) dan biaya kemasan
                    </p>
                </div>

                <div>
                    {activeTab === 'taxes' ? (
                        <button
                            onClick={openCreateTaxModal}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Tambah Pajak</span>
                        </button>
                    ) : (
                        <button
                            onClick={openCreateChargeModal}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                        >
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span>Tambah Biaya Tambahan</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-6 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('taxes')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                        activeTab === 'taxes'
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Percent className="w-4 h-4" />
                    <span>Master Pajak (Tax Rules)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                        {taxes.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('charges')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition ${
                        activeTab === 'charges'
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Coins className="w-4 h-4" />
                    <span>Master Additional Charge (Biaya Tambahan)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                        {charges.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: MASTER PAJAK */}
            {activeTab === 'taxes' && (
                <div className="space-y-4">
                    {/* Info Card */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3 text-xs text-emerald-900">
                        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block">Model Pajak Eksklusif vs Inklusif</span>
                            <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                                Pajak **Eksklusif** dihitung dan ditambahkan di atas subtotal keranjang (cocok untuk kafe & resto). Pajak **Inklusif** mengasumsikan harga menu sudah bersih termasuk pajak dan dihitung mundur (*net price*).
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
            )}

            {/* TAB 2: MASTER ADDITIONAL CHARGES */}
            {activeTab === 'charges' && (
                <div className="space-y-4">
                    {/* Info Card */}
                    <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3 text-xs text-blue-900">
                        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold block">Biaya Tambahan & Kena Pajak (*Taxable*)</span>
                            <span className="text-[11px] text-blue-800 leading-relaxed block mt-0.5">
                                Biaya Layanan (*Service Charge*) yang diaktifkan tanda **Kena Pajak** akan otomatis dimasukkan ke dalam dasar pengenaan Pajak Restoran (PB1), sesuai regulasi perpajakan F&B. Biaya kemasan/takeaway umumnya tidak kena pajak restoran.
                            </span>
                        </div>
                    </div>

                    {/* Charges Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                        <th className="py-3 px-4">Nama Biaya</th>
                                        <th className="py-3 px-4">Nilai / Tarif</th>
                                        <th className="py-3 px-4">Kena Pajak?</th>
                                        <th className="py-3 px-4">Kondisi Tipe Pesanan</th>
                                        <th className="py-3 px-4">Otomatis Diterapkan</th>
                                        <th className="py-3 px-4">Status</th>
                                        <th className="py-3 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {charges.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-slate-400">
                                                <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                                <span>Belum ada konfigurasi biaya tambahan</span>
                                            </td>
                                        </tr>
                                    ) : (
                                        charges.map((c) => (
                                            <tr key={c.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {c.name}
                                                </td>
                                                <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                                                    {c.type === 'percent'
                                                        ? `${parseFloat(c.rate as string)}%`
                                                        : formatRupiah(parseFloat(c.rate as string))}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {c.is_taxable ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                                                            Kena Pajak (PB1)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                                                            Bebas Pajak
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {getAppliesToBadge(c.applies_to)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {c.is_auto_apply ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ya
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 text-[11px]">Tidak (Manual)</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {c.is_active ? (
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
                                                        onClick={() => openEditChargeModal(c)}
                                                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                                        title="Edit Biaya"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCharge(c)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                        title="Hapus Biaya"
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
            )}

            {/* MODAL: CREATE / EDIT TAX */}
            {isTaxModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">
                                    {editingTax ? 'Edit Konfigurasi Pajak' : 'Tambah Pajak Baru'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Aturan pengenaan tarif dan model perhitungan pajak
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
                                        placeholder="PB1"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Tarif Pajak (%) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        required
                                        value={taxForm.data.rate}
                                        onChange={(e) => taxForm.setData('rate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Model Pengenaan Pajak
                                </label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <label
                                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 select-none ${
                                            taxForm.data.type === 'exclusive'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tax_type"
                                            className="hidden"
                                            checked={taxForm.data.type === 'exclusive'}
                                            onChange={() => taxForm.setData('type', 'exclusive')}
                                        />
                                        <span className="font-bold text-xs">Eksklusif</span>
                                        <span
                                            className={`text-[10px] leading-tight ${
                                                taxForm.data.type === 'exclusive' ? 'text-slate-300' : 'text-slate-500'
                                            }`}
                                        >
                                            Ditambahkan di atas subtotal keranjang
                                        </span>
                                    </label>

                                    <label
                                        className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1 select-none ${
                                            taxForm.data.type === 'inclusive'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="tax_type"
                                            className="hidden"
                                            checked={taxForm.data.type === 'inclusive'}
                                            onChange={() => taxForm.setData('type', 'inclusive')}
                                        />
                                        <span className="font-bold text-xs">Inklusif</span>
                                        <span
                                            className={`text-[10px] leading-tight ${
                                                taxForm.data.type === 'inclusive' ? 'text-slate-300' : 'text-slate-500'
                                            }`}
                                        >
                                            Sudah termasuk dalam harga menu (Nett)
                                        </span>
                                    </label>
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
                                    <span className="font-bold text-slate-800">
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

            {/* MODAL: CREATE / EDIT CHARGE */}
            {isChargeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-base">
                                    {editingCharge ? 'Edit Biaya Tambahan' : 'Tambah Biaya Tambahan'}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Service charge, biaya kemasan, atau biaya pesan-antar
                                </p>
                            </div>
                            <button
                                onClick={() => setIsChargeModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCharge} className="p-6 space-y-4 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Nama Biaya *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={chargeForm.data.name}
                                    onChange={(e) => chargeForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Biaya Layanan (Service Charge)"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        Tipe Nilai
                                    </label>
                                    <select
                                        value={chargeForm.data.type}
                                        onChange={(e) =>
                                            chargeForm.setData('type', e.target.value as 'percent' | 'fixed')
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
                                    >
                                        <option value="percent">Persentase (%)</option>
                                        <option value="fixed">Nominal Tetap (Rp)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-bold text-slate-700 block mb-1">
                                        {chargeForm.data.type === 'percent' ? 'Tarif (%) *' : 'Nominal (Rp) *'}
                                    </label>
                                    <input
                                        type="number"
                                        step={chargeForm.data.type === 'percent' ? '0.01' : '100'}
                                        min="0"
                                        required
                                        value={chargeForm.data.rate}
                                        onChange={(e) =>
                                            chargeForm.setData('rate', parseFloat(e.target.value) || 0)
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-slate-900 font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">
                                    Berlaku Untuk Tipe Pesanan
                                </label>
                                <select
                                    value={chargeForm.data.applies_to}
                                    onChange={(e) =>
                                        chargeForm.setData(
                                            'applies_to',
                                            e.target.value as 'all' | 'dine_in' | 'takeaway' | 'delivery'
                                        )
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-slate-900"
                                >
                                    <option value="all">Semua Tipe Pesanan</option>
                                    <option value="dine_in">Dine In (Makan di Tempat) Saja</option>
                                    <option value="takeaway">Takeaway (Bungkus) Saja</option>
                                    <option value="delivery">Delivery Saja</option>
                                </select>
                            </div>

                            <div className="space-y-2.5 pt-2 border-t border-slate-100">
                                <label className="flex items-start gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={chargeForm.data.is_taxable}
                                        onChange={(e) => chargeForm.setData('is_taxable', e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">
                                            Dikenakan Pajak (*Taxable*)
                                        </span>
                                        <span className="text-[10px] text-slate-500 block leading-tight">
                                            Biaya ini akan dimasukkan ke dalam dasar pengenaan Pajak Restoran (PB1).
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={chargeForm.data.is_auto_apply}
                                        onChange={(e) => chargeForm.setData('is_auto_apply', e.target.checked)}
                                        className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">
                                            Otomatis Diterapkan
                                        </span>
                                        <span className="text-[10px] text-slate-500 block leading-tight">
                                            Otomatis muncul di keranjang saat tipe pesanan yang sesuai dipilih kasir.
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={chargeForm.data.is_active}
                                        onChange={(e) => chargeForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <span className="font-bold text-slate-800">
                                        Biaya Tambahan Aktif
                                    </span>
                                </label>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsChargeModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={chargeForm.processing}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 disabled:opacity-50 shadow-xs"
                                >
                                    <span>{editingCharge ? 'Simpan Perubahan' : 'Buat Biaya'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </BackofficeLayout>
    );
}
