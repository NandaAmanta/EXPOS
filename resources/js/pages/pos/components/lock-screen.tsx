import React, { useState, useEffect } from 'react';
import type { CashierUser } from '@/types/pos';
import { Lock, Delete, CheckCircle2, UserCircle2, ArrowRight } from 'lucide-react';

interface LockScreenProps {
    isOpen: boolean;
    onUnlock: (cashier: CashierUser, token?: string) => void;
    currentCashier: CashierUser | null;
}

export default function LockScreen({
    isOpen,
    onUnlock,
    currentCashier,
}: LockScreenProps) {
    const [cashiers, setCashiers] = useState<CashierUser[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<CashierUser | null>(currentCashier);
    const [pin, setPin] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (currentCashier) {
            setSelectedCashier(currentCashier);
        }
    }, [currentCashier]);

    useEffect(() => {
        if (isOpen) {
            try {
                const cached = localStorage.getItem('pos_cached_cashiers');
                if (cached) {
                    const list = JSON.parse(cached);
                    setCashiers(list);
                    if (!selectedCashier && list.length > 0) {
                        setSelectedCashier(list[0]);
                    }
                }
            } catch {}

            fetch('/api/pos/auth/cashiers')
                .then((res) => res.json())
                .then((data) => {
                    if (data.cashiers && data.cashiers.length > 0) {
                        setCashiers(data.cashiers);
                        try {
                            localStorage.setItem('pos_cached_cashiers', JSON.stringify(data.cashiers));
                        } catch {}
                        if (!selectedCashier && !currentCashier) {
                            setSelectedCashier(data.cashiers[0]);
                        }
                    }
                })
                .catch((err) => console.warn('Offline: Using local cashier session', err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleKeypadPress = (val: string) => {
        setErrorMsg(null);
        if (val === 'C') {
            setPin('');
        } else if (val === 'DEL') {
            setPin((prev) => prev.slice(0, -1));
        } else {
            if (pin.length < 6) {
                const nextPin = pin + val;
                setPin(nextPin);
                if (nextPin.length === 4) {
                    verifyPin(nextPin);
                }
            }
        }
    };

    const verifyPin = async (inputPin = pin) => {
        if (!selectedCashier) return;
        setIsLoading(true);
        setErrorMsg(null);

        try {
            const res = await fetch('/api/pos/auth/verify-pin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    user_id: selectedCashier.id,
                    pin: inputPin,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || 'PIN Kasir salah.');
                setPin('');
                setIsLoading(false);
                return;
            }

            // Save token to localStorage for authenticated API batch sync
            if (data.token) {
                localStorage.setItem('pos_device_token', data.token);
            }

            onUnlock(data.cashier, data.token);
            setPin('');
            setIsLoading(false);
        } catch (err) {
            // Offline fallback: if pin is 1234, unlock for local demo
            if (inputPin === '1234') {
                onUnlock(selectedCashier);
                setPin('');
            } else {
                setErrorMsg('Mode Offline: PIN tidak cocok');
                setPin('');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6">
                {/* Header with Lock Icon */}
                <div className="text-center space-y-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-emerald-400 mx-auto flex items-center justify-center shadow-md">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Kunci Layar Terminal</h2>
                        <p className="text-xs text-slate-500">Pilih operator dan masukkan 4 digit PIN kasir</p>
                    </div>
                </div>

                {/* Cashier Selection Pills */}
                {cashiers.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 justify-center mb-3 no-scrollbar">
                        {cashiers.map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    setSelectedCashier(c);
                                    setPin('');
                                    setErrorMsg(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 ${
                                    selectedCashier?.id === c.id
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Selected Cashier indicator */}
                <div className="text-center pb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Kasir Aktif:
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                        {selectedCashier?.name || 'Pilih Kasir'}
                    </span>
                </div>

                {/* PIN Dots Indicator */}
                <div className="flex justify-center items-center gap-3 py-2">
                    {[0, 1, 2, 3].map((idx) => (
                        <div
                            key={idx}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                                pin.length > idx
                                    ? 'bg-emerald-600 scale-125'
                                    : 'bg-slate-200 border border-slate-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Error message */}
                {errorMsg && (
                    <p className="text-xs text-slate-800 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-center font-medium my-2">
                        {errorMsg}
                    </p>
                )}

                {/* Touch Keypad for Tablet */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((k) => (
                        <button
                            key={k}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleKeypadPress(k)}
                            className="h-14 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-900 font-bold text-lg flex items-center justify-center transition active:scale-95 disabled:opacity-50"
                        >
                            {k === 'DEL' ? <Delete className="w-5 h-5 text-slate-600" /> : k}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
