import React from 'react';
import { Head } from '@inertiajs/react';
import BackofficeLayout from '@/layouts/backoffice-layout';
import { formatRupiah } from '@/lib/printer';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PosShift } from '@/types/pos';

interface ShiftReportProps {
    shifts: PosShift[];
}

export default function ShiftReport({ shifts }: ShiftReportProps) {
    return (
        <BackofficeLayout currentTab="shifts">
            <Head title="Backoffice - Audit Shift Kasir" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Shift & Rekonsiliasi Kas</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Rekap pembukaan, penutupan shift, dan verifikasi fisik uang laci kasir
                    </p>
                </div>
            </div>

            {/* Shifts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Waktu Buka</th>
                                <th className="py-3 px-4">Waktu Tutup</th>
                                <th className="py-3 px-4">Modal Awal</th>
                                <th className="py-3 px-4">Kas Sistem</th>
                                <th className="py-3 px-4">Fisik Kas Laci</th>
                                <th className="py-3 px-4">Selisih</th>
                                <th className="py-3 px-4">Total Order</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shifts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-slate-400">
                                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <span>Belum ada riwayat shift</span>
                                    </td>
                                </tr>
                            ) : (
                                shifts.map((shift) => {
                                    const diff = shift.difference ? parseFloat(shift.difference.toString()) : 0;
                                    return (
                                        <tr key={shift.id} className="hover:bg-slate-50/70 transition">
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                                        shift.status === 'open'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {shift.status === 'open' ? (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Aktif
                                                        </>
                                                    ) : (
                                                        'Ditutup'
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">
                                                {new Date(shift.opened_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-3 px-4 text-slate-500">
                                                {shift.closed_at
                                                    ? new Date(shift.closed_at).toLocaleString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-800">
                                                {formatRupiah(shift.starting_cash)}
                                            </td>
                                            <td className="py-3 px-4 text-slate-700">
                                                {shift.expected_cash
                                                    ? formatRupiah(shift.expected_cash)
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-slate-900">
                                                {shift.actual_cash ? formatRupiah(shift.actual_cash) : '-'}
                                            </td>
                                            <td className="py-3 px-4 font-bold">
                                                {shift.difference !== null && shift.difference !== undefined ? (
                                                    <span
                                                        className={
                                                            diff === 0
                                                                ? 'text-emerald-700'
                                                                : 'text-slate-900'
                                                        }
                                                    >
                                                        {formatRupiah(diff)}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 font-medium">
                                                {shift.orders_count || 0} order
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </BackofficeLayout>
    );
}
