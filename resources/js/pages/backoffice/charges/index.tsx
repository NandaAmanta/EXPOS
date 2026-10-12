import React, { useState } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah } from '@/lib/printer';
import {
    Coins,
    Plus,
    Edit2,
    Trash2,
    CheckCircle2,
    X,
    Info,
    Utensils,
    Package,
    Truck,
    Layers,
    ArrowRight,
    Percent,
} from 'lucide-react';

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

interface ChargePageProps {
    charges: ChargeItem[];
}

export default function ChargeIndex({ charges }: ChargePageProps) {
    // Charge Modal state
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
    const [editingCharge, setEditingCharge] = useState<ChargeItem | null>(null);

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
                        <Utensils className="w-3 h-3" /> Dine In
                    </span>
                );
            case 'takeaway':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                        <Package className="w-3 h-3" /> Takeaway
                    </span>
                );
            case 'delivery':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                        <Truck className="w-3 h-3" /> Delivery
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
        <BackofficeLayout currentTab="charges">
            <Head title="Backoffice - Master Biaya Tambahan (Additional Charge)" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wide border border-emerald-200">
                            Master Data
                        </span>
                        <Link
                            href="/backoffice/taxes"
                            className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 font-medium transition"
                        >
                            <span>Lihat Master Pajak</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Coins className="w-6 h-6 text-emerald-600" />
                        <span>Master Biaya Tambahan (Additional Charge)</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Kelola service charge restoran, biaya kemasan takeaway, atau ongkos antar pesanan
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreateChargeModal}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition active:scale-95"
                    >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Tambah Biaya Tambahan</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="space-y-4">
                {/* Info Card */}
                <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-start gap-3 text-xs text-slate-800">
                    <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold block">Integrasi Pajak Restoran (PB1) & Biaya Layanan</span>
                        <span className="text-[11px] text-slate-600 leading-relaxed block mt-0.5">
                            Biaya yang ditandai <strong>Taxable</strong> (seperti <em>Service Charge</em>) akan secara otomatis digabungkan ke Dasar Pengenaan Pajak (DPP) sebelum perhitungan PB1/PPN dilakukan di Terminal POS kasir.
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
                                    <th className="py-3 px-4">Tipe & Nilai</th>
                                    <th className="py-3 px-4">Kena Pajak?</th>
                                    <th className="py-3 px-4">Kondisi Tipe Pesanan</th>
                                    <th className="py-3 px-4">Auto-Apply</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {charges.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <Coins className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                            <span>Belum ada biaya tambahan yang dikonfigurasi</span>
                                        </td>
                                    </tr>
                                ) : (
                                    charges.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4 font-bold text-slate-900">
                                                {c.name}
                                            </td>
                                            <td className="py-3 px-4">
                                                {c.type === 'percent' ? (
                                                    <span className="font-extrabold text-emerald-700 text-sm">
                                                        {parseFloat(c.rate as string)}%
                                                    </span>
                                                ) : (
                                                    <span className="font-extrabold text-slate-900 text-sm">
                                                        {formatRupiah(parseFloat(c.rate as string))}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                {c.is_taxable ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                                                        Ya (DPP PB1)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px]">Bukan Objek Pajak</span>
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
                                                    <span className="text-slate-400 text-[11px]">Manual</span>
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
                                    Service charge, biaya kemasan takeaway, atau ongkos kirim
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
