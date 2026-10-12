import React, { useState, useEffect } from 'react';
import type { PosShift, CashMovement } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import { X, Clock, Banknote, CheckCircle2, ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';

interface ShiftDialogProps {
    isOpen: boolean;
    onClose: () => void;
    activeShift: PosShift | null;
    onShiftUpdated: (shift: PosShift | null) => void;
    outletId?: string;
}

export default function ShiftDialog({
    isOpen,
    onClose,
    activeShift,
    onShiftUpdated,
    outletId,
}: ShiftDialogProps) {
    const [tab, setTab] = useState<'close' | 'movement'>('close');
    const [startingCash, setStartingCash] = useState<string>('200000');
    const [actualCash, setActualCash] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Cash movement form state
    const [movementType, setMovementType] = useState<'in' | 'out'>('in');
    const [movementAmount, setMovementAmount] = useState<string>('');
    const [movementReason, setMovementReason] = useState<string>('');
    const [movements, setMovements] = useState<CashMovement[]>(activeShift?.cash_movements || []);

    useEffect(() => {
        if (activeShift) {
            setMovements(activeShift.cash_movements || []);
            // Fetch latest shift state including cash movements
            const url = outletId ? `/api/pos/shifts/current?outlet_id=${outletId}` : '/api/pos/shifts/current';
            fetch(url)
                .then((res) => res.json())
                .then((data) => {
                    if (data.shift) {
                        setMovements(data.shift.cash_movements || []);
                    }
                })
                .catch(() => {});
        }
    }, [activeShift, isOpen, outletId]);

    if (!isOpen) return null;

    const totalCashIn = movements
        .filter((m) => m.type === 'in')
        .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);

    const totalCashOut = movements
        .filter((m) => m.type === 'out')
        .reduce((sum, m) => sum + parseFloat(m.amount.toString()), 0);

    const handleOpenShift = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/pos/shifts/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    outlet_id: outletId,
                    starting_cash: parseFloat(startingCash) || 0,
                    notes,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal membuka shift');
            onShiftUpdated(data.shift);
            onClose();
        } catch (err: any) {
            // Offline fallback: create local shift
            const offlineShift: PosShift = {
                id: crypto.randomUUID(),
                outlet_id: outletId || 'default-outlet',
                starting_cash: parseFloat(startingCash) || 0,
                status: 'open',
                notes: notes || 'Shift Offline',
                opened_at: new Date().toISOString(),
            };
            onShiftUpdated(offlineShift);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCashMovementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeShift) return;
        const amount = parseFloat(movementAmount);
        if (!amount || amount <= 0) {
            setErrorMsg('Jumlah kas harus lebih dari 0');
            return;
        }
        if (!movementReason.trim()) {
            setErrorMsg('Keterangan / alasan harus diisi');
            return;
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            const res = await fetch('/api/pos/shifts/cash-movement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    shift_id: activeShift.id,
                    type: movementType,
                    amount,
                    reason: movementReason,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Gagal menyimpan mutasi kas');

            const newMovements = [data.cash_movement, ...movements];
            setMovements(newMovements);
            setMovementAmount('');
            setMovementReason('');
            setTab('close');
        } catch (err: any) {
            // Offline fallback: save movement in local shift state
            const offlineMovement: CashMovement = {
                id: crypto.randomUUID(),
                shift_id: activeShift.id,
                type: movementType,
                amount,
                reason: movementReason,
                created_at: new Date().toISOString(),
            };
            setMovements([offlineMovement, ...movements]);
            setMovementAmount('');
            setMovementReason('');
            setTab('close');
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
            // Offline fallback: close shift locally
            onShiftUpdated(null);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <h2 className="font-semibold text-base">
                            {activeShift ? 'Manajemen Kasir & Shift' : 'Buka Kasir (Shift Baru)'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sub-Tabs if Shift is Active */}
                {activeShift && (
                    <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                setTab('close');
                                setErrorMsg(null);
                            }}
                            className={`py-3 text-center transition ${
                                tab === 'close'
                                    ? 'bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Ringkasan & Tutup
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTab('movement');
                                setErrorMsg(null);
                            }}
                            className={`py-3 text-center transition ${
                                tab === 'movement'
                                    ? 'bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Kas Masuk / Keluar
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {errorMsg && (
                        <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-medium">
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
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Quick Nominal Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                                {[100000, 200000, 500000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setStartingCash(val.toString())}
                                        className="py-2.5 px-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold hover:bg-slate-100 active:scale-95 transition"
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
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    placeholder="Contoh: Shift Pagi / Kasir 1"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleOpenShift}
                                disabled={isSubmitting}
                                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{isSubmitting ? 'Membuka...' : 'Mulai Shift'}</span>
                            </button>
                        </div>
                    ) : tab === 'movement' ? (
                        // Form Kas Masuk / Kas Keluar
                        <form onSubmit={handleCashMovementSubmit} className="space-y-4">
                            {/* Type selector */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                    Tipe Transaksi
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMovementType('in')}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 ${
                                            movementType === 'in'
                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ArrowDownLeft className="w-4 h-4" />
                                        <span>Kas Masuk (+)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMovementType('out')}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition active:scale-95 ${
                                            movementType === 'out'
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span>Kas Keluar (-)</span>
                                    </button>
                                </div>
                            </div>

                            {/* Nominal */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                                    Nominal Uang
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                                        Rp
                                    </span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={movementAmount}
                                        onChange={(e) => setMovementAmount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Quick Nominal Buttons */}
                            <div className="grid grid-cols-4 gap-1.5">
                                {[20000, 50000, 100000, 200000].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setMovementAmount(val.toString())}
                                        className="py-1.5 px-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-semibold hover:bg-slate-100 transition active:scale-95"
                                    >
                                        {formatRupiah(val).replace('Rp', '')}
                                    </button>
                                ))}
                            </div>

                            {/* Keterangan */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    Alasan / Keterangan
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={movementReason}
                                    onChange={(e) => setMovementReason(e.target.value)}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    placeholder={
                                        movementType === 'in'
                                            ? 'Contoh: Tambah uang receh kasir'
                                            : 'Contoh: Beli es batu / kantong plastik'
                                    }
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 active:scale-98 transition shadow-xs"
                            >
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi Kas'}</span>
                            </button>

                            {/* Movement History */}
                            {movements.length > 0 && (
                                <div className="border-t border-slate-100 pt-3">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                        Riwayat Shift Ini ({movements.length})
                                    </span>
                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                        {movements.map((m, idx) => (
                                            <div
                                                key={m.id || idx}
                                                className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                                            >
                                                <div>
                                                    <span className="font-semibold text-slate-900 block">
                                                        {m.reason}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {m.type === 'in' ? 'Kas Masuk' : 'Kas Keluar'}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`font-bold font-mono ${
                                                        m.type === 'in' ? 'text-emerald-700' : 'text-slate-800'
                                                    }`}
                                                >
                                                    {m.type === 'in' ? '+' : '-'}
                                                    {formatRupiah(m.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    ) : (
                        // Form Tutup Shift
                        <div className="space-y-4">
                            {/* Summary Card */}
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Waktu Buka:</span>
                                    <span className="font-semibold text-slate-800">
                                        {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Modal Kas Awal:</span>
                                    <span className="font-semibold text-slate-800">
                                        {formatRupiah(activeShift.starting_cash)}
                                    </span>
                                </div>
                                {totalCashIn > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-medium">
                                        <span>Total Kas Masuk:</span>
                                        <span>+{formatRupiah(totalCashIn)}</span>
                                    </div>
                                )}
                                {totalCashOut > 0 && (
                                    <div className="flex justify-between text-slate-700 font-medium">
                                        <span>Total Kas Keluar:</span>
                                        <span>-{formatRupiah(totalCashOut)}</span>
                                    </div>
                                )}
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
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-hidden focus:border-slate-900"
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
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-hidden focus:border-slate-900"
                                    placeholder="Keterangan fisik uang / serah terima..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseShift}
                                disabled={isSubmitting || !actualCash}
                                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-sm disabled:opacity-50"
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
