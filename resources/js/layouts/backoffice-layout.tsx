import { Link, usePage, router } from '@inertiajs/react';
import {
    LayoutDashboard,
    Package,
    ReceiptText,
    Clock,
    MonitorPlay,
    LogOut,
    UserCircle,
    Percent,
    Coins,
    LayoutGrid,
    Search,
    X,
    ChevronRight,
    ChevronDown,
    Boxes,
    SlidersHorizontal,
    ArrowUpDown,
    Store,
    Building2,
    CheckCircle2,
    MapPin,
} from 'lucide-react';
import React, { useState, useMemo, useEffect, type ReactNode } from 'react';

export type BackofficeTab =
    | 'dashboard'
    | 'products'
    | 'sales'
    | 'shifts'
    | 'ingredients'
    | 'recipes'
    | 'movements'
    | 'users'
    | 'taxes'
    | 'charges'
    | 'taxes-charges';

interface BackofficeLayoutProps {
    children: ReactNode;
    currentTab?: BackofficeTab;
}

interface MenuItem {
    id: BackofficeTab;
    label: string;
    href: string;
    icon: any;
    category: 'Utama & Operasional' | 'Master Data' | 'Laporan & Keuangan' | 'Pengaturan & Akses';
    description: string;
    priority: number; // 1-2: md, 3: lg, 4: xl, >4: modal
    color: string;
}

export default function BackofficeLayout({
    children,
    currentTab = 'dashboard',
}: BackofficeLayoutProps) {
    const { auth, outlets, active_outlet_id, active_outlet, selected_outlet_id } = usePage().props as any;
    const currentUser = auth?.user;
    const isGlobalAdmin = currentUser?.role === 'admin' || currentUser?.role === 'owner';

    const [isMoreModalOpen, setIsMoreModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [isPosModalOpen, setIsPosModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const currentOutletId = selected_outlet_id || active_outlet_id || 'all';
    const isHQ = currentOutletId === 'all';
    const currentOutlet = outlets?.find((o: any) => o.id === currentOutletId) || active_outlet;
    const currentBranchName = isHQ ? 'Semua Cabang (HQ)' : currentOutlet ? currentOutlet.name : 'Pilih Cabang';
    const currentBranchCode = isHQ ? 'HQ' : currentOutlet ? currentOutlet.code : 'Cabang';

    const handleSwitchOutlet = (outletId: string) => {
        router.post(
            '/backoffice/set-outlet',
            {
                outlet_id: outletId,
                redirect_to: window.location.pathname + window.location.search,
            },
            {
                preserveScroll: true,
                onSuccess: () => setIsBranchModalOpen(false),
            }
        );
    };

    const allMenuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Ringkasan',
            href: '/backoffice',
            icon: LayoutDashboard,
            category: 'Utama & Operasional',
            description: 'Ikhtisar omset harian, grafik penjualan, dan performa gerai',
            priority: 1,
            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'products',
            label: 'Katalog Produk',
            href: '/backoffice/products',
            icon: Package,
            category: 'Master Data',
            description: 'Kelola daftar produk, varian rasa/porsi, harga, dan stok',
            priority: 2,
            color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        },
        {
            id: 'sales',
            label: 'Riwayat Transaksi',
            href: '/backoffice/reports/sales',
            icon: ReceiptText,
            category: 'Laporan & Keuangan',
            description: 'Audit struk kasir, atribusi kasir operator, dan rincian pembayaran',
            priority: 3,
            color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        },
        {
            id: 'shifts',
            label: 'Audit Shift',
            href: '/backoffice/reports/shifts',
            icon: Clock,
            category: 'Laporan & Keuangan',
            description: 'Rekonsiliasi kas laci, setoran kasir, dan selisih modal awal/akhir',
            priority: 4,
            color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        },
        {
            id: 'ingredients',
            label: 'Bahan Baku',
            href: '/backoffice/ingredients',
            icon: Boxes,
            category: 'Master Data',
            description: 'Master inventaris bahan mentah, takaran unit (gram/ml/pcs), dan stok cabang',
            priority: 5,
            color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        },
        {
            id: 'recipes',
            label: 'Resep Menu (BOM)',
            href: '/backoffice/recipes',
            icon: SlidersHorizontal,
            category: 'Master Data',
            description: 'Formula racikan menu, takaran bahan baku, dan kalkulasi HPP otomatis',
            priority: 6,
            color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        },
        {
            id: 'movements',
            label: 'Kartu Stok & Mutasi',
            href: '/backoffice/inventory/movements',
            icon: ArrowUpDown,
            category: 'Laporan & Keuangan',
            description: 'Buku besar mutasi inventaris, audit stok opname, dan riwayat pemakaian bahan',
            priority: 7,
            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
        {
            id: 'taxes',
            label: 'Master Pajak',
            href: '/backoffice/taxes',
            icon: Percent,
            category: 'Master Data',
            description: 'Konfigurasi aturan pajak daerah (PB1 10%), PPN, dan mode eksklusif/inklusif',
            priority: 8,
            color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
        },
        {
            id: 'charges',
            label: 'Biaya Tambahan',
            href: '/backoffice/charges',
            icon: Coins,
            category: 'Master Data',
            description: 'Kelola biaya layanan restoran (Service Charge), kemasan takeaway, dan ongkir',
            priority: 9,
            color: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        },
        {
            id: 'users',
            label: 'Pengguna & Akses',
            href: '/backoffice/users',
            icon: UserCircle,
            category: 'Pengaturan & Akses',
            description: 'Manajemen akun staf kasir, supervisor, admin, dan matriks hak akses peran',
            priority: 10,
            color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        },
    ];

    // Check if the currently active page is an overflow menu (priority > 4 or not visible on smaller screens)
    const activeItem = allMenuItems.find((item) => item.id === currentTab);
    const isOverflowActive = Boolean(activeItem && activeItem.priority > 3);

    // Filter items inside modal search
    const filteredMenuItems = useMemo(() => {
        if (!searchQuery.trim()) return allMenuItems;
        const query = searchQuery.toLowerCase();
        return allMenuItems.filter(
            (item) =>
                item.label.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
        );
    }, [allMenuItems, searchQuery]);

    // Group items by category for modal
    const categories = useMemo(() => {
        const order = ['Utama & Operasional', 'Master Data', 'Laporan & Keuangan', 'Pengaturan & Akses'];
        const grouped: Record<string, MenuItem[]> = {};
        for (const cat of order) {
            grouped[cat] = [];
        }
        for (const item of filteredMenuItems) {
            if (!grouped[item.category]) grouped[item.category] = [];
            grouped[item.category].push(item);
        }
        return grouped;
    }, [filteredMenuItems]);

    // Handle ESC to close modals
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isMoreModalOpen) setIsMoreModalOpen(false);
                if (isBranchModalOpen) setIsBranchModalOpen(false);
                if (isPosModalOpen) setIsPosModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMoreModalOpen, isBranchModalOpen, isPosModalOpen]);

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 antialiased flex flex-col font-sans">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Brand & Adaptive Main Menu */}
                    <div className="flex items-center gap-4 lg:gap-6">
                        <Link href="/backoffice" className="flex items-center gap-2.5 shrink-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-extrabold text-white text-base tracking-wider shadow-xs">
                                EX
                            </div>
                            <div>
                                <span className="font-bold text-base text-white tracking-tight">EXPOS</span>
                                <span className="text-[11px] text-slate-400 block -mt-1 font-medium">
                                    Backoffice Hub
                                </span>
                            </div>
                        </Link>

                        {/* Adaptive Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1 ml-2">
                            {/* Always visible on md+ (Priority 1 & 2) */}
                            {allMenuItems
                                .filter((item) => item.priority <= 2)
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentTab === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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

                            {/* Visible on lg+ (Priority 3: Riwayat Transaksi) */}
                            {allMenuItems
                                .filter((item) => item.priority === 3)
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentTab === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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

                            {/* Visible on xl+ (Priority 4: Audit Shift) */}
                            {allMenuItems
                                .filter((item) => item.priority === 4)
                                .map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentTab === item.id;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            className={`hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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

                            {/* "Lainnya" Button (All Menus Modal Trigger) */}
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setIsMoreModalOpen(true);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                                    isOverflowActive
                                        ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 shadow-xs'
                                        : 'text-slate-300 border-transparent hover:text-white hover:bg-slate-800/60'
                                }`}
                                title="Buka semua menu & modul backoffice"
                            >
                                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                                <span>Lainnya</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                            </button>
                        </nav>
                    </div>

                    {/* Right Action Bar */}
                    <div className="flex items-center gap-3">
                        {/* Multi-Branch Selector Button (Opens Branch Modal) */}
                        {outlets && outlets.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setIsBranchModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-white transition shadow-xs active:scale-95 group"
                                title="Klik untuk memilih atau beralih cabang gerai"
                            >
                                <Store className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                                <span className="hidden sm:inline max-w-[170px] md:max-w-[210px] truncate text-slate-200">
                                    {isHQ ? 'Semua Cabang (HQ)' : `${currentBranchCode} - ${currentBranchName}`}
                                </span>
                                <span className="sm:hidden text-slate-200 font-bold">
                                    {currentBranchCode}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors shrink-0" />
                            </button>
                        )}

                        {/* Terminal POS Button */}
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
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-xs active:scale-95"
                            title="Buka Terminal Kasir POS"
                        >
                            <MonitorPlay className="w-4 h-4" />
                            <span className="hidden sm:inline">Terminal POS</span>
                            <span className="sm:hidden">POS</span>
                        </button>

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

                {/* Mobile Sub-Navigation Bar */}
                <div className="flex md:hidden border-t border-slate-800 px-3 py-2 items-center justify-between gap-1 overflow-x-auto text-xs">
                    <div className="flex items-center gap-1">
                        <Link
                            href="/backoffice"
                            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                                currentTab === 'dashboard'
                                    ? 'bg-slate-800 text-emerald-400 font-bold'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Ringkasan</span>
                        </Link>

                        <Link
                            href="/backoffice/products"
                            className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 ${
                                currentTab === 'products'
                                    ? 'bg-slate-800 text-emerald-400 font-bold'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            <Package className="w-3.5 h-3.5" />
                            <span>Produk</span>
                        </Link>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery('');
                            setIsMoreModalOpen(true);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border ${
                            isOverflowActive
                                ? 'bg-slate-800 text-emerald-400 border-emerald-500/40'
                                : 'bg-slate-800/60 text-slate-300 border-slate-700/60'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lainnya</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>

            {/* "LAINNYA" MODAL - ALL MODULES & NAVIGATION DIRECTORY */}
            {isMoreModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                                    <LayoutGrid className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white tracking-tight">
                                        Navigasi & Modul Backoffice
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Pilih modul atau gunakan pencarian cepat untuk akses instan
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsMoreModalOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 shrink-0">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Ketik nama modul, misal: pajak, charge, produk, shift, user..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 placeholder:text-slate-400 transition"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Modul Grid Content (Scrollable) */}
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                            {filteredMenuItems.length === 0 ? (
                                <div className="py-12 text-center text-slate-400">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="font-semibold text-xs text-slate-600">
                                        Tidak ditemukan modul untuk "{searchQuery}"
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Coba kata kunci lain seperti "pajak", "produk", atau "transaksi"
                                    </p>
                                </div>
                            ) : (
                                Object.entries(categories).map(([categoryName, items]) => {
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={categoryName} className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {categoryName}
                                                </span>
                                                <div className="h-px bg-slate-200 flex-1" />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {items.map((item) => {
                                                    const Icon = item.icon;
                                                    const isActive = currentTab === item.id;
                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={item.href}
                                                            onClick={() => setIsMoreModalOpen(false)}
                                                            className={`p-3.5 rounded-2xl border transition group flex items-start gap-3.5 text-left relative ${
                                                                isActive
                                                                    ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/20 shadow-xs'
                                                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                                                            }`}
                                                        >
                                                            <div
                                                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform`}
                                                            >
                                                                <Icon className="w-5 h-5" />
                                                            </div>

                                                            <div className="flex-1 min-w-0 pr-6">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-700 transition">
                                                                        {item.label}
                                                                    </span>
                                                                    {isActive && (
                                                                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase tracking-wide">
                                                                            Aktif
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                                                                    {item.description}
                                                                </p>
                                                            </div>

                                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 transition group-hover:translate-x-0.5" />
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                            <span className="text-[11px]">
                                Tekan <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px]">Esc</kbd> untuk menutup
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMoreModalOpen(false);
                                    if (!outlets || outlets.length <= 1) {
                                        const targetId = outlets?.[0]?.id;
                                        router.visit(targetId ? `/pos/${targetId}` : '/pos');
                                    } else {
                                        setIsPosModalOpen(true);
                                    }
                                }}
                                className="font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 text-[11px]"
                            >
                                <MonitorPlay className="w-3.5 h-3.5" />
                                <span>Buka Layar Kasir POS &rarr;</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Ganti Gerai Cabang Operasional */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        Pilih Gerai Cabang Operasional
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Pilih cabang gerai untuk memfilter data omset, stok, dan laporan operasional.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsBranchModalOpen(false)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body: List of Branch Cards */}
                        <div className="p-5 overflow-y-auto space-y-3 bg-white">
                            {/* Option 1: HQ Consolidated (if admin/owner) */}
                            {isGlobalAdmin && (
                                <div
                                    onClick={() => handleSwitchOutlet('all')}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                        isHQ
                                            ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-500/30 text-slate-900 shadow-xs'
                                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-300 text-slate-800 shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">Semua Cabang (Konsolidasi HQ)</span>
                                                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-bold uppercase shrink-0">
                                                    Pusat
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                Tampilkan seluruh data gabungan omset, laporan, dan stok
                                            </p>
                                        </div>
                                    </div>

                                    {isHQ ? (
                                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 hover:text-slate-700 font-semibold shrink-0">
                                            Pilih &rarr;
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Outlet list */}
                            {outlets?.map((outlet: any) => {
                                const isSelected = currentOutletId === outlet.id;
                                return (
                                    <div
                                        key={outlet.id}
                                        onClick={() => handleSwitchOutlet(outlet.id)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                            isSelected
                                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/30 text-slate-900 shadow-xs'
                                                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-800 shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
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
                                                </div>
                                                {outlet.address && (
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{outlet.address}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected ? (
                                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 hover:text-emerald-700 font-semibold shrink-0">
                                                Pilih &rarr;
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                            <span>
                                Gerai aktif: <strong className="text-slate-900 font-bold">{currentBranchName}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsBranchModalOpen(false)}
                                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition shadow-xs"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                            {outlets?.map((outlet: any) => {
                                const isBackofficeActive = currentOutletId === outlet.id;
                                return (
                                    <Link
                                        key={outlet.id}
                                        href={`/pos/${outlet.id}`}
                                        onClick={() => setIsPosModalOpen(false)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                                            isBackofficeActive
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
                                                    {isBackofficeActive && (
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
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
