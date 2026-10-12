import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import {
    Store,
    Building2,
    Layers,
    MapPin,
    Phone,
    ArrowRight,
    LogOut,
    MonitorPlay,
    CheckCircle2,
    ShieldCheck,
    X,
} from 'lucide-react';

interface OutletItem {
    id: string;
    code: string;
    name: string;
    address: string | null;
    phone: string | null;
}

interface SelectOutletProps {
    outlets: OutletItem[];
    can_select_all: boolean;
    current_outlet_id: string | null;
}

export default function SelectOutlet({
    outlets,
    can_select_all,
    current_outlet_id,
}: SelectOutletProps) {
    const { auth } = usePage().props as any;
    const user = auth?.user;
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);

    const handleSelectOutlet = (outletId: string) => {
        router.post('/backoffice/set-outlet', {
            outlet_id: outletId,
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
            <Head title="Pilih Cabang Gerai - EXPOS Backoffice" />

            {/* Top Bar */}
            <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-emerald-600/20">
                        EX
                    </div>
                    <div>
                        <span className="font-extrabold text-lg text-slate-900 tracking-tight block">EXPOS</span>
                        <span className="text-xs text-slate-500 block -mt-1 font-medium">
                            Multi-Outlet Management
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (!outlets || outlets.length <= 1) {
                                const targetId = outlets?.[0]?.id;
                                router.visit(targetId ? `/pos/${targetId}` : '/pos');
                            } else {
                                setIsPosModalOpen(true);
                            }
                        }}
                        className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-xs transition"
                    >
                        <MonitorPlay className="w-4 h-4 text-emerald-600" />
                        <span>Terminal Kasir POS</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-white border border-transparent hover:border-slate-200 transition"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </div>

            {/* Main Content Card Container */}
            <div className="max-w-4xl w-full mx-auto my-auto py-8">
                {/* Greeting & Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-3">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        {user?.role ? `Login sebagai ${user.role.toUpperCase()}` : 'Akses Terverifikasi'}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                        Pilih Gerai Cabang Operasional
                    </h1>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto mt-2">
                        Hai <span className="text-slate-900 font-semibold">{user?.name}</span>, silakan tentukan cabang gerai yang ingin Anda kelola untuk memulai sesi kerja di Backoffice.
                    </p>
                </div>

                {/* Grid of Outlets */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: HQ Consolidated (Admins only) */}
                    {can_select_all && (
                        <div
                            onClick={() => handleSelectOutlet('all')}
                            className={`group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                current_outlet_id === 'all'
                                    ? 'bg-purple-50/60 border-purple-500 ring-2 ring-purple-500/30 shadow-md'
                                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-purple-300 shadow-xs hover:shadow-md'
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-3">
                                    <div className="w-11 h-11 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <span className="px-2.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-[10px] font-bold uppercase tracking-wider">
                                        Konsolidasi HQ
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                                    Semua Cabang (Pusat)
                                </h3>
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                                    Akses komprehensif dashboard gabungan omset, seluruh mutasi inventaris, dan audit laporan transaksi di seluruh cabang.
                                </p>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-semibold text-purple-700 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                                    Kelola Semua Gerai <ArrowRight className="w-3.5 h-3.5" />
                                </span>
                                {current_outlet_id === 'all' && (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Branch Outlets Cards */}
                    {outlets.map((outlet) => {
                        const isSelected = current_outlet_id === outlet.id;
                        return (
                            <div
                                key={outlet.id}
                                onClick={() => handleSelectOutlet(outlet.id)}
                                className={`group relative p-6 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                                    isSelected
                                        ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                                        : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md'
                                }`}
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                                            <Store className="w-5 h-5" />
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold tracking-wider">
                                            {outlet.code}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                        {outlet.name}
                                    </h3>

                                    <div className="mt-2.5 space-y-1.5 text-xs text-slate-500">
                                        {outlet.address && (
                                            <div className="flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{outlet.address}</span>
                                            </div>
                                        )}
                                        {outlet.phone && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span>{outlet.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
                                        Buka Gerai Ini <ArrowRight className="w-3.5 h-3.5" />
                                    </span>
                                    {isSelected && (
                                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="max-w-5xl w-full mx-auto text-center py-4 text-xs text-slate-400">
                EXPOS Point of Sale & Backoffice Hub &bull; Solusi Multi-Cabang & Manajemen Inventaris Bahan Baku
            </div>

            {/* Modal Pilih Cabang untuk Terminal Kasir POS */}
            {isPosModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <MonitorPlay className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        Buka Terminal Kasir POS
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Pilih cabang gerai yang akan dioperasikan pada layar kasir terminal ini:
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPosModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body: List of Branch Cards */}
                        <div className="p-5 overflow-y-auto space-y-3 bg-white">
                            {outlets?.map((outlet) => {
                                const isCurrentActive = current_outlet_id === outlet.id;
                                return (
                                    <Link
                                        key={outlet.id}
                                        href={`/pos/${outlet.id}`}
                                        onClick={() => setIsPosModalOpen(false)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                                            isCurrentActive
                                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 group-hover:scale-105 transition-transform">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-slate-900 truncate">
                                                        {outlet.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold shrink-0">
                                                        {outlet.code}
                                                    </span>
                                                    {isCurrentActive && (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                                            Gerai Aktif
                                                        </span>
                                                    )}
                                                </div>
                                                {outlet.address && (
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{outlet.address}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <span className="text-xs font-semibold text-emerald-700 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
                                            Buka POS &rarr;
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                            <span>
                                Setiap gerai memiliki kartu stok & antrean offline mandiri
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsPosModalOpen(false)}
                                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition shadow-xs"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
