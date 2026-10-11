import React, { useState } from 'react';
import type { PosShift } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import { X, Clock, Banknote, CheckCircle2 } from 'lucide-react';

interface ShiftDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeShift: PosShift | null;
    onShiftUpdated: (shift: PosShift | null) => void;
}

export default function ShiftDialog({
    isOpen,
    onClose,
    activeShift,
    onShiftUpdated,
}: ShiftDialogProps) {
    const [startingCash, setStartingCash] = useState<string>('200000');
    const [actualCash, setActualCash] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleOpenShift = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/pos/shifts/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    starting_cash: parseFloat(startingCash) || 0,
                    notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal membuka shift');
            onShiftUpdated(data.shift);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseShift = async () => {
        if (!activeShift) return;
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await fetch(`/api/pos/shifts/${activeShift.id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    actual_cash: parseFloat(actualCash) || 0,
                    notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menutup shift');
            onShiftUpdated(null);
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <h2 className="font-semibold text-lg">
                            {activeShift ? 'Tutup Kasir (Shift Aktif)' : 'Buka Kasir (Shift Baru)'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {errorMsg && (
                        <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-sm font-medium">
                            {errorMsg}
                        </div>
                    )}

                    {!activeShift ? (
                        // Form Buka Shift
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Modal Kas Awal
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        value={startingCash}
                                        onChange={(e) => setStartingCash(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Quick Nominal Buttons for Tablet */}
                            <div className="grid grid-cols-3 gap-2">
                                {[100000, 200000, 500000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setStartingCash(val.toString())}
                                        className="py-2.5 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 active:scale-95 transition"
                                    >
                                        {formatRupiah(val)}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Catatan Kasir
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    placeholder="Contoh: Shift Pagi / Kasir 1"
                                />
                            </div>

                            <button
                                onClick={handleOpenShift}
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                <span>{isSubmitting ? 'Membuka...' : 'Mulai Shift'}</span>
                            </button>
                        </div>
                    ) : (
                        // Form Tutup Shift
                        <div className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Waktu Buka:</span>
                                    <span className="font-semibold text-slate-800">
                                        {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Modal Awal:</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatRupiah(activeShift.starting_cash)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Fisik Uang Tunai di Laci Kasir
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-base">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        value={actualCash}
                                        onChange={(e) => setActualCash(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Catatan Penutupan
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    placeholder="Keterangan fisik uang / serah terima..."
                                />
                            </div>

                            <button
                                onClick={handleCloseShift}
                                disabled={isSubmitting || !actualCash}
                                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-base flex items-center justify-center gap-2 transition active:scale-98 shadow-sm disabled:opacity-50"
                            >
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                <span>{isSubmitting ? 'Menutup...' : 'Tutup Shift Sekarang'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
