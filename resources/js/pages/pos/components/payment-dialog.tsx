import React, { useState, useMemo } from 'react';
import type { CartItem, PosPaymentPayload } from '@/types/pos';
import { formatRupiah } from '@/lib/printer';
import { X, Banknote, QrCode, CreditCard, Check, Delete } from 'lucide-react';

interface PaymentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    totalAmount: number;
    cartItems: CartItem[];
    customerName: string;
    onPaymentComplete: (payments: PosPaymentPayload[]) => void;
}

export default function PaymentDialog({
    isOpen,
    onClose,
    totalAmount,
    customerName,
    onPaymentComplete,
}: PaymentDialogProps) {
    const [selectedMethod, setSelectedMethod] = useState<'CASH' | 'QRIS' | 'DEBIT'>('CASH');
    const [paidAmountStr, setPaidAmountStr] = useState<string>('');
    const [refNumber, setRefNumber] = useState<string>('');

    if (!isOpen) return null;

    const paidNumber = parseFloat(paidAmountStr) || 0;
    const changeAmount = Math.max(0, paidNumber - totalAmount);
    const isAmountSufficient = selectedMethod === 'CASH' ? paidNumber >= totalAmount : true;

    // Fast denominations based on totalAmount
    const quickDenominations = useMemo(() => {
        const base = [totalAmount, 50000, 100000, 200000, 500000];
        // Filter unique and only >= totalAmount (except exact total)
        return Array.from(new Set(base))
            .filter((val) => val >= totalAmount)
            .slice(0, 4);
    }, [totalAmount]);

    const handleKeypadPress = (val: string) => {
        if (val === 'C') {
            setPaidAmountStr('');
        } else if (val === 'DEL') {
            setPaidAmountStr((prev) => prev.slice(0, -1));
        } else {
            setPaidAmountStr((prev) => prev + val);
        }
    };

    const handleConfirm = () => {
        if (!isAmountSufficient && selectedMethod === 'CASH') return;

        const effectivePaid = selectedMethod === 'CASH' ? paidNumber : totalAmount;
        const payments: PosPaymentPayload[] = [
            {
                method: selectedMethod,
                amount: effectivePaid,
                change_amount: selectedMethod === 'CASH' ? changeAmount : 0,
                reference_no: refNumber || (selectedMethod === 'QRIS' ? `QRIS-${Date.now().toString().slice(-6)}` : null),
            },
        ];

        onPaymentComplete(payments);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-lg">Penyelesaian Pembayaran</h2>
                        {customerName && (
                            <p className="text-xs text-slate-400">Pelanggan: {customerName}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Left Column: Total & Method Selection */}
                    <div className="space-y-5">
                        {/* Total Card */}
                        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                                Total Tagihan
                            </span>
                            <span className="text-3xl font-bold text-slate-900 mt-1 block">
                                {formatRupiah(totalAmount)}
                            </span>
                        </div>

                        {/* Payment Method Tabs */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                                Metode Pembayaran
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMethod('CASH');
                                        setPaidAmountStr('');
                                    }}
                                    className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                                        selectedMethod === 'CASH'
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <Banknote className="w-5 h-5 text-emerald-400" />
                                    <span>Tunai</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMethod('QRIS');
                                        setPaidAmountStr(totalAmount.toString());
                                    }}
                                    className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                                        selectedMethod === 'QRIS'
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <QrCode className="w-5 h-5 text-emerald-400" />
                                    <span>QRIS</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMethod('DEBIT');
                                        setPaidAmountStr(totalAmount.toString());
                                    }}
                                    className={`py-3 px-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-semibold ${
                                        selectedMethod === 'DEBIT'
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5 text-emerald-400" />
                                    <span>Debit</span>
                                </button>
                            </div>
                        </div>

                        {/* QRIS / Non-Cash Preview */}
                        {selectedMethod === 'QRIS' && (
                            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                                <div className="w-36 h-36 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                                    <QrCode className="w-28 h-28 text-slate-900" />
                                </div>
                                <p className="text-xs text-slate-500 font-medium">Scan QRIS Kasir Dinamis</p>
                            </div>
                        )}

                        {selectedMethod === 'DEBIT' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                    No. Referensi / EDC
                                </label>
                                <input
                                    type="text"
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                    placeholder="Contoh: REF-109283"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-slate-900"
                                />
                            </div>
                        )}
                    </div>

                    {/* Right Column: Cash Tender & Touch Numpad */}
                    <div className="space-y-4">
                        {selectedMethod === 'CASH' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                                        Nominal Diterima
                                    </label>
                                    <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 text-right">
                                        <span className="text-2xl font-bold text-slate-900">
                                            {paidNumber > 0 ? formatRupiah(paidNumber) : 'Rp 0'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick amounts */}
                                <div className="grid grid-cols-2 gap-2">
                                    {quickDenominations.map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setPaidAmountStr(amount.toString())}
                                            className="py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-100 active:scale-95 transition"
                                        >
                                            {amount === totalAmount ? 'Uang Pas' : formatRupiah(amount)}
                                        </button>
                                    ))}
                                </div>

                                {/* Touch Keypad for Tablet */}
                                <div className="grid grid-cols-3 gap-1.5">
                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'DEL'].map((key) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => handleKeypadPress(key)}
                                            className="h-11 rounded-lg border border-slate-200 bg-white text-slate-900 font-bold text-base hover:bg-slate-100 active:bg-slate-200 transition flex items-center justify-center"
                                        >
                                            {key === 'DEL' ? <Delete className="w-5 h-5 text-slate-600" /> : key}
                                        </button>
                                    ))}
                                </div>

                                {/* Change amount display */}
                                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-600 uppercase">Kembalian:</span>
                                    <span className="text-lg font-bold text-emerald-700">
                                        {formatRupiah(changeAmount)}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center text-center p-6 bg-slate-50 rounded-xl border border-slate-200">
                                <Check className="w-12 h-12 text-emerald-600 mb-2" />
                                <h3 className="font-bold text-slate-900 text-base">Pembayaran Non-Tunai</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Verifikasi nominal EDC/QRIS sebesar {formatRupiah(totalAmount)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="py-3 px-5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-100 active:scale-95 transition"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isAmountSufficient && selectedMethod === 'CASH'}
                        className="flex-1 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-98 transition"
                    >
                        <Check className="w-5 h-5" />
                        <span>Selesaikan Transaksi</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
