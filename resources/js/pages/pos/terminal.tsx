import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import { cacheProducts, getLocalProducts, saveLocalOrder, saveActiveShift } from '@/lib/db';
import { syncManager } from '@/lib/syncWorker';
import { formatRupiah } from '@/lib/printer';
import CartDrawer from './components/cart-drawer';
import PaymentDialog from './components/payment-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ShiftDialog from './components/shift-dialog';
import LockScreen from './components/lock-screen';
import type { PosOutlet, PosProduct, PosShift, CartItem, PosOrderPayload, PosPaymentPayload, CashierUser } from '@/types/pos';
import {
    Search,
    Wifi,
    WifiOff,
    RefreshCw,
    Clock,
    LayoutDashboard,
    Package,
    Store,
    Layers,
    Check,
    UserCheck
} from 'lucide-react';

interface TerminalProps {
    outlet: PosOutlet | null;
    initial_products: PosProduct[];
    categories: string[];
    active_shift: PosShift | null;
}

export default function Terminal({
    outlet,
    initial_products,
    categories,
    active_shift,
}: TerminalProps) {
    const [products, setProducts] = useState<PosProduct[]>(initial_products || []);
    const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [taxAmount, setTaxAmount] = useState<number>(0);

    // Modals
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<PosOrderPayload | null>(null);
    // Operator cashier state (null by default until PIN unlocked)
    const [currentCashier, setCurrentCashier] = useState<CashierUser | null>(() => {
        try {
            const stored = localStorage.getItem('pos_active_cashier');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    // Start locked by default if no cashier session exists
    const [isLocked, setIsLocked] = useState<boolean>(() => {
        try {
            return !localStorage.getItem('pos_active_cashier');
        } catch {
            return true;
        }
    });

    // Shift state
    const [activeShiftState, setActiveShiftState] = useState<PosShift | null>(active_shift);

    // Sync State
    const [syncState, setSyncState] = useState({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        lastSyncedAt: null as Date | null,
    });

    // Initialize local IndexedDB cache and sync listener
    useEffect(() => {
        if (initial_products && initial_products.length > 0) {
            cacheProducts(initial_products);
        } else {
            getLocalProducts().then((cached) => {
                if (cached.length > 0) setProducts(cached);
            });
        }

        const unsubscribe = syncManager.subscribe((state) => {
            setSyncState(state);
        });

        return () => unsubscribe();
    }, [initial_products]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
            const query = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !query ||
                p.name.toLowerCase().includes(query) ||
                p.sku.toLowerCase().includes(query) ||
                (p.barcode && p.barcode.toLowerCase().includes(query));
            return matchesCat && matchesQuery;
        });
    }, [products, selectedCategory, searchQuery]);

    // Cart calculations
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.subtotal, 0);
    }, [cart]);

    const totalAmount = useMemo(() => {
        return Math.max(0, subtotal - discountAmount + taxAmount);
    }, [subtotal, discountAmount, taxAmount]);

    // Cart handlers
    const handleAddToCart = useCallback((product: PosProduct) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product_id === product.id);
            const unitPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

            if (existing) {
                return prev.map((item) =>
                    item.product_id === product.id
                        ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.price }
                        : item
                );
            }

            return [
                ...prev,
                {
                    product_id: product.id,
                    sku: product.sku,
                    name: product.name,
                    price: unitPrice,
                    qty: 1,
                    subtotal: unitPrice,
                },
            ];
        });
    }, []);

    const handleUpdateQty = useCallback((productId: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.product_id === productId) {
                        const newQty = item.qty + delta;
                        return newQty > 0
                            ? { ...item, qty: newQty, subtotal: newQty * item.price }
                            : null;
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    }, []);

    const handleRemoveItem = useCallback((productId: string) => {
        setCart((prev) => prev.filter((item) => item.product_id !== productId));
    }, []);

    const handleClearCart = useCallback(() => {
        setCart([]);
        setCustomerName('');
        setDiscountAmount(0);
        setTaxAmount(0);
    }, []);

    // Payment completion -> Local-First Save -> Print & Sync
    const handlePaymentComplete = async (payments: PosPaymentPayload[]) => {
        const orderId = crypto.randomUUID();
        const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

        const orderPayload: PosOrderPayload = {
            id: orderId,
            order_number: orderNumber,
            customer_name: customerName || null,
            cashier_id: currentCashier?.id || null,
            shift_id: activeShiftState?.id || null,
            subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: totalAmount,
            payment_status: 'paid',
            items: cart.map((c) => ({
                product_id: c.product_id,
                sku: c.sku,
                product_name: c.name,
                qty: c.qty,
                unit_price: c.price,
                subtotal: c.subtotal,
            })),
            payments,
            is_synced: 0,
            created_at: new Date().toISOString(),
        };

        // 1. Instant local IndexedDB save (sub-100ms)
        await saveLocalOrder(orderPayload);

        // 2. Set state for receipt dialog
        setCompletedOrder(orderPayload);
        setIsPaymentOpen(false);
        setIsReceiptOpen(true);

        // 3. Reset cart
        handleClearCart();

        // 4. Trigger background sync immediately if online
        syncManager.triggerBackgroundSync();
    };

    const allCategories = useMemo(() => {
        return ['Semua', ...categories];
    }, [categories]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans select-none">
            <Head title="Kasir POS - Local-First Terminal" />

            {/* Top Bar (Clean, Tablet-Friendly) */}
            <header className="h-16 bg-slate-900 text-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                {/* Brand & Outlet info */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-sm">
                            EX
                        </div>
                        <div>
                            <span className="font-bold text-base text-white tracking-tight">EXPOS</span>
                            <span className="text-xs text-slate-400 block -mt-1">
                                {outlet?.name || 'Cabang Utama'}
                            </span>
                        </div>
                    </div>

                    {/* Active Operator Switch */}
                    <button
                        onClick={() => setIsLocked(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition active:scale-95"
                        title="Klik untuk ganti kasir / kunci layar"
                    >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{currentCashier ? currentCashier.name : 'Pilih Kasir'}</span>
                    </button>

                    {/* Shift Badge Button */}
                    <button
                        onClick={() => setIsShiftOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
                            activeShiftState
                                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{activeShiftState ? 'Shift Aktif' : 'Buka Kasir'}</span>
                    </button>
                </div>

                {/* Status & Navigation */}
                <div className="flex items-center gap-3">
                    {/* Sync Indicator */}
                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
                        {syncState.isOnline ? (
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                                Offline
                            </span>
                        )}

                        <span className="text-slate-600">|</span>

                        <button
                            onClick={() => syncManager.triggerBackgroundSync()}
                            disabled={syncState.isSyncing}
                            className="flex items-center gap-1 text-slate-300 hover:text-white transition disabled:opacity-50"
                            title="Klik untuk sinkronisasi"
                        >
                            <RefreshCw
                                className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-emerald-400' : ''}`}
                            />
                            <span>
                                {syncState.pendingCount > 0
                                    ? `${syncState.pendingCount} Tertunda`
                                    : 'Sinkron'}
                            </span>
                        </button>
                    </div>

                    {/* Backoffice Button */}
                    <Link
                        href="/backoffice"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Backoffice</span>
                    </Link>
                </div>
            </header>

            {/* Main Terminal Split View */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Area: Product Catalog */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
                    {/* Catalog Filter Bar */}
                    <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama produk, SKU, atau scan barcode..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-hidden focus:bg-white focus:border-slate-900 transition"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Category Chips (Large Touch Targets for Tablet) */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {allCategories.map((cat) => {
                                const isActive = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition active:scale-95 ${
                                            isActive
                                                ? 'bg-slate-900 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {filteredProducts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                <Package className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                                <p className="font-semibold text-slate-600 text-base">Tidak ada produk ditemukan</p>
                                <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian lain</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredProducts.map((prod) => {
                                    const inCart = cart.find((item) => item.product_id === prod.id);
                                    return (
                                        <button
                                            key={prod.id}
                                            type="button"
                                            onClick={() => handleAddToCart(prod)}
                                            className={`relative p-3.5 rounded-2xl bg-white border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-97 cursor-pointer ${
                                                inCart
                                                    ? 'border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {/* In-Cart Quantity Indicator */}
                                            {inCart && (
                                                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                                                    {inCart.qty}
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                                                    {prod.category}
                                                </span>
                                                <h3 className="font-semibold text-slate-900 text-sm mt-0.5 line-clamp-2 leading-tight">
                                                    {prod.name}
                                                </h3>
                                                <span className="text-[11px] font-mono text-slate-600 mt-0.5 block">
                                                    {prod.sku}
                                                </span>
                                            </div>

                                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-sm">
                                                    {formatRupiah(prod.price)}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-600">
                                                    Stok: {prod.stock}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Cart Drawer (320px - 380px fixed width on tablet/desktop) */}
                <div className="w-80 md:w-96 shrink-0 h-full">
                    <CartDrawer
                        cart={cart}
                        customerName={customerName}
                        onCustomerNameChange={setCustomerName}
                        onUpdateQty={handleUpdateQty}
                        onRemoveItem={handleRemoveItem}
                        onClearCart={handleClearCart}
                        onCheckout={() => setIsPaymentOpen(true)}
                        subtotal={subtotal}
                        discountAmount={discountAmount}
                        taxAmount={taxAmount}
                        totalAmount={totalAmount}
                    />
                </div>
            </div>

            {/* Modals */}
            <PaymentDialog
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                totalAmount={totalAmount}
                cartItems={cart}
                customerName={customerName}
                onPaymentComplete={handlePaymentComplete}
            />

            <ReceiptDialog
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                order={completedOrder}
                outletName={outlet?.name || 'EXPOS STORE'}
                outletAddress={outlet?.address || 'Cabang Utama'}
            />

            <ShiftDialog
                isOpen={isShiftOpen}
                onClose={() => setIsShiftOpen(false)}
                activeShift={activeShiftState}
                onShiftUpdated={(shift) => {
                    setActiveShiftState(shift);
                    saveActiveShift(shift);
                    if (!shift) {
                        try {
                            localStorage.removeItem('pos_active_cashier');
                        } catch {}
                        setCurrentCashier(null);
                        setIsLocked(true);
                    }
                }}
            />

            <LockScreen
                isOpen={isLocked}
                currentCashier={currentCashier}
                onUnlock={(cashier, token) => {
                    setCurrentCashier(cashier);
                    try {
                        localStorage.setItem('pos_active_cashier', JSON.stringify(cashier));
                    } catch {}
                    setIsLocked(false);
                }}
            />
        </div>
    );
}
