import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    ReceiptText,
    Clock,
    MonitorPlay,
    LogOut,
    UserCircle,
    Store
} from 'lucide-react';
import React, { type ReactNode } from 'react';

interface BackofficeLayoutProps {
    children: ReactNode;
    currentTab?: 'dashboard' | 'products' | 'sales' | 'shifts';
}

export default function BackofficeLayout({ children, currentTab = 'dashboard' }: BackofficeLayoutProps) {
    const { auth } = usePage().props as any;
    const currentUser = auth?.user;

    const navItems = [
        { id: 'dashboard', label: 'Ringkasan', href: '/backoffice', icon: LayoutDashboard },
        { id: 'products', label: 'Katalog Produk', href: '/backoffice/products', icon: Package },
        { id: 'sales', label: 'Riwayat Transaksi', href: '/backoffice/reports/sales', icon: ReceiptText },
        { id: 'shifts', label: 'Audit Shift', href: '/backoffice/reports/shifts', icon: Clock },
    ];

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col font-sans">
            {/* Top Navigation Bar (Slate-900 + Emerald-600) */}
            <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/backoffice" className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-base tracking-wider shadow-xs">
                                EX
                            </div>
                            <div>
                                <span className="font-bold text-base text-white tracking-tight">EXPOS</span>
                                <span className="text-[11px] text-slate-400 block -mt-1 font-medium">Backoffice Hub</span>
                            </div>
                        </Link>

                        <nav className="hidden md:flex items-center gap-1 ml-4">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentTab === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-slate-800 text-emerald-400 shadow-xs'
                                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Terminal Button */}
                        <Link
                            href="/pos"
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs active:scale-95"
                        >
                            <MonitorPlay className="w-4 h-4" />
                            <span>Terminal POS</span>
                        </Link>

                        {/* User Profile & Logout */}
                        {currentUser && (
                            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
                                <div className="text-right hidden sm:block">
                                    <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                                        {currentUser.name}
                                    </span>
                                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">
                                        {currentUser.role || 'Admin'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    title="Keluar / Logout"
                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Navigation bar */}
                <div className="flex md:hidden border-t border-slate-800 overflow-x-auto px-2 py-1.5 gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                                    isActive
                                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                                        : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
