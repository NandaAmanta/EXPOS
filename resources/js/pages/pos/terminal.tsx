import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    cacheProducts,
    getLocalProducts,
    saveLocalOrder,
    saveActiveShift,
    getLocalActiveShift,
    parkLocalOrder,
    getParkedOrders,
    cacheTaxes,
    getLocalTaxes,
    cacheCharges,
    getLocalCharges,
} from '@/lib/db';
import { syncManager } from '@/lib/syncWorker';
import { formatRupiah } from '@/lib/printer';
import CartDrawer from './components/cart-drawer';
import PaymentDialog from './components/payment-dialog';
import ReceiptDialog from './components/receipt-dialog';
import ShiftDialog from './components/shift-dialog';
import LockScreen from './components/lock-screen';
import VariantDialog from './components/variant-dialog';
import ParkedDialog from './components/parked-dialog';
import type {
    PosOutlet,
    PosProduct,
    PosShift,
    CartItem,
    PosOrderPayload,
    PosPaymentPayload,
    CashierUser,
    ProductVariant,
    ParkedOrder,
    PosTax,
    PosCharge,
    AppliedCharge,
} from '@/types/pos';
import {
    Search,
    RefreshCw,
    Clock,
    LayoutDashboard,
    Package,
    UserCheck,
    Layers,
    Store,
    ChevronDown,
    MapPin,
    X,
} from 'lucide-react';

interface TerminalProps {
    outlet: PosOutlet | null;
    initial_products: PosProduct[];
    categories: string[];
    active_shift: PosShift | null;
    taxes?: PosTax[];
    charges?: PosCharge[];
    outlets?: PosOutlet[];
}

export default function Terminal({
    outlet,
    initial_products,
    categories,
    active_shift,
    taxes,
    charges,
    outlets = [],
}: TerminalProps) {
    const [products, setProducts] = useState<PosProduct[]>(initial_products || []);
    const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState<string>('');
    const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
    const [tableNumber, setTableNumber] = useState<string>('');
    const [orderNotes, setOrderNotes] = useState<string>('');

    // Flexible Discount
    const [discountType, setDiscountType] = useState<'percent' | 'nominal'>('percent');
    const [discountValue, setDiscountValue] = useState<number>(0);

    // Taxes & Additional Charges state (fallback to local cache)
    const [taxesList, setTaxesList] = useState<PosTax[]>(() => {
        if (taxes && taxes.length > 0) return taxes;
        return getLocalTaxes();
    });

    const [chargesList, setChargesList] = useState<PosCharge[]>(() => {
        if (charges && charges.length > 0) return charges;
        return getLocalCharges();
    });

    // Parked Orders Count
    const [parkedCount, setParkedCount] = useState<number>(0);

    // Modals
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isParkedOpen, setIsParkedOpen] = useState(false);
    const [variantDialogProduct, setVariantDialogProduct] = useState<PosProduct | null>(null);
    const [completedOrder, setCompletedOrder] = useState<PosOrderPayload | null>(null);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);

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

    const refreshParkedCount = useCallback(async () => {
        try {
            const list = await getParkedOrders();
            setParkedCount(list.length);
        } catch {
            setParkedCount(0);
        }
    }, []);

    // Initialize local IndexedDB cache, active shift, taxes, charges, and sync listener
    useEffect(() => {
        let isMounted = true;

        const initLocalState = async () => {
            if (initial_products && initial_products.length > 0) {
                await cacheProducts(initial_products);
            }
            const cachedProducts = await getLocalProducts();
            if (isMounted && cachedProducts.length > 0) {
                setProducts(cachedProducts);
            } else if (isMounted && initial_products && initial_products.length > 0) {
                setProducts(initial_products);
            }

            if (!active_shift) {
                const localShift = await getLocalActiveShift();
                if (isMounted && localShift) {
                    setActiveShiftState(localShift);
                }
            }

            if (taxes && taxes.length > 0) {
                cacheTaxes(taxes);
                if (isMounted) setTaxesList(taxes);
            } else {
                const localTaxes = getLocalTaxes();
                if (isMounted && localTaxes.length > 0) setTaxesList(localTaxes);
            }

            if (charges && charges.length > 0) {
                cacheCharges(charges);
                if (isMounted) setChargesList(charges);
            } else {
                const localCharges = getLocalCharges();
                if (isMounted && localCharges.length > 0) setChargesList(localCharges);
            }
        };

        initLocalState();
        refreshParkedCount();

        const unsubscribe = syncManager.subscribe((state) => {
            if (isMounted) setSyncState(state);
        });

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [initial_products, active_shift, taxes, charges, refreshParkedCount]);

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

    const discountAmount = useMemo(() => {
        if (discountType === 'percent') {
            return Math.round(subtotal * (discountValue / 100));
        }
        return Math.min(subtotal, discountValue);
    }, [subtotal, discountType, discountValue]);

    const netSubtotal = useMemo(() => {
        return Math.max(0, subtotal - discountAmount);
    }, [subtotal, discountAmount]);

    // Dynamic Additional Charges applied based on orderType (Dine In vs Takeaway vs Delivery)
    const appliedCharges = useMemo<AppliedCharge[]>(() => {
        if (cart.length === 0) return [];
        return chargesList
            .filter((c) => c.is_active && c.is_auto_apply)
            .filter((c) => c.applies_to === 'all' || c.applies_to === orderType)
            .map((c) => {
                const rateNum = typeof c.rate === 'string' ? parseFloat(c.rate) : c.rate;
                const amount =
                    c.type === 'percent'
                        ? Math.round(netSubtotal * (rateNum / 100))
                        : rateNum;
                return {
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    rate: rateNum,
                    amount,
                    is_taxable: c.is_taxable,
                };
            })
            .filter((c) => c.amount > 0);
    }, [chargesList, orderType, netSubtotal, cart.length]);

    const totalChargesAmount = useMemo(() => {
        return appliedCharges.reduce((acc, c) => acc + c.amount, 0);
    }, [appliedCharges]);

    // Active Tax rule (e.g., PB1 10%)
    const activeTax = useMemo<PosTax | null>(() => {
        return taxesList.find((t) => t.is_active && t.is_auto_apply) || null;
    }, [taxesList]);

    const taxAmount = useMemo(() => {
        if (!activeTax || cart.length === 0) return 0;
        const taxRateNum =
            typeof activeTax.rate === 'string' ? parseFloat(activeTax.rate) : activeTax.rate;
        if (taxRateNum <= 0) return 0;

        // Sum taxable charges (e.g. Service Charge PB1 inclusion)
        const taxableCharges = appliedCharges
            .filter((c) => c.is_taxable)
            .reduce((acc, c) => acc + c.amount, 0);

        const taxBase = netSubtotal + taxableCharges;

        if (activeTax.type === 'inclusive') {
            return Math.round(taxBase - taxBase / (1 + taxRateNum / 100));
        }

        return Math.round(taxBase * (taxRateNum / 100));
    }, [activeTax, cart.length, netSubtotal, appliedCharges]);

    const totalAmount = useMemo(() => {
        if (cart.length === 0) return 0;
        const exclusiveTax = activeTax?.type === 'exclusive' ? taxAmount : 0;
        return Math.max(0, netSubtotal + totalChargesAmount + exclusiveTax);
    }, [cart.length, netSubtotal, totalChargesAmount, activeTax, taxAmount]);

    // Cart handlers
    const handleAddToCart = useCallback(
        (product: PosProduct, variant?: ProductVariant | null, itemNotes?: string) => {
            const unitPrice =
                variant?.price !== undefined && variant?.price !== null
                    ? variant.price
                    : variant?.additional_price
                    ? (typeof product.price === 'string' ? parseFloat(product.price) : product.price) +
                      variant.additional_price
                    : typeof product.price === 'string'
                    ? parseFloat(product.price)
                    : product.price;

            const variantName = variant?.name || undefined;
            const itemKey = `${product.id}__${variantName || ''}__${itemNotes || ''}`;

            setCart((prev) => {
                const existingIndex = prev.findIndex(
                    (item) =>
                        (item.cart_item_id ||
                            `${item.product_id}__${item.selected_variant || ''}__${item.item_notes || ''}`) === itemKey
                );

                if (existingIndex > -1) {
                    const next = [...prev];
                    const existing = next[existingIndex];
                    const newQty = existing.qty + 1;
                    next[existingIndex] = {
                        ...existing,
                        qty: newQty,
                        subtotal: newQty * existing.price,
                    };
                    return next;
                }

                return [
                    ...prev,
                    {
                        cart_item_id: itemKey,
                        product_id: product.id,
                        sku: product.sku,
                        name: product.name,
                        price: unitPrice,
                        qty: 1,
                        subtotal: unitPrice,
                        selected_variant: variantName,
                        item_notes: itemNotes,
                    },
                ];
            });
        },
        []
    );

    const handleProductClick = (product: PosProduct) => {
        if (product.variants && product.variants.length > 0) {
            setVariantDialogProduct(product);
        } else {
            handleAddToCart(product);
        }
    };

    const handleUpdateQty = useCallback((itemKey: string, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    const key =
                        item.cart_item_id ||
                        `${item.product_id}__${item.selected_variant || ''}__${item.item_notes || ''}`;
                    if (key === itemKey) {
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

    const handleRemoveItem = useCallback((itemKey: string) => {
        setCart((prev) =>
            prev.filter(
                (item) =>
                    (item.cart_item_id ||
                        `${item.product_id}__${item.selected_variant || ''}__${item.item_notes || ''}`) !== itemKey
            )
        );
    }, []);

    const handleClearCart = useCallback(() => {
        setCart([]);
        setCustomerName('');
        setTableNumber('');
        setOrderNotes('');
        setDiscountValue(0);
        setTaxAmount(0);
    }, []);

    // Hold / Park current cart
    const handleHoldOrder = async () => {
        if (cart.length === 0) return;
        const parkedOrder: ParkedOrder = {
            id: crypto.randomUUID(),
            order_number: `HOLD-${Date.now().toString().slice(-4)}`,
            customer_name: customerName,
            order_type: orderType,
            table_number: tableNumber,
            notes: orderNotes,
            items: cart,
            discount_type: discountType,
            discount_value: discountValue,
            created_at: new Date().toISOString(),
        };

        await parkLocalOrder(parkedOrder);
        await refreshParkedCount();
        handleClearCart();
    };

    // Recall / Resume parked order
    const handleRecallOrder = (order: ParkedOrder) => {
        setCart(order.items);
        setOrderType(order.order_type);
        setTableNumber(order.table_number || '');
        setCustomerName(order.customer_name || '');
        setOrderNotes(order.notes || '');
        setDiscountType(order.discount_type || 'percent');
        setDiscountValue(order.discount_value || 0);
        refreshParkedCount();
    };

    // Payment completion -> Local-First Save -> Print & Sync
    const handlePaymentComplete = async (payments: PosPaymentPayload[]) => {
        const orderId = crypto.randomUUID();
        const orderNumber = `POS-${Date.now().toString().slice(-6)}`;

        const orderPayload: PosOrderPayload = {
            id: orderId,
            order_number: orderNumber,
            order_type: orderType,
            table_number: orderType === 'dine_in' ? tableNumber || null : null,
            notes: orderNotes || null,
            customer_name: customerName || null,
            outlet_id: outlet?.id || null,
            cashier_id: currentCashier?.id || null,
            shift_id: activeShiftState?.id || null,
            subtotal,
            tax_rate: activeTax ? (typeof activeTax.rate === 'string' ? parseFloat(activeTax.rate) : activeTax.rate) : null,
            tax_name: activeTax?.name || null,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            charges_amount: totalChargesAmount,
            charges_detail: appliedCharges,
            total_amount: totalAmount,
            payment_status: 'paid',
            items: cart.map((c) => ({
                product_id: c.product_id,
                sku: c.sku,
                product_name: c.name,
                qty: c.qty,
                unit_price: c.price,
                subtotal: c.subtotal,
                selected_variant: c.selected_variant || null,
                notes: c.item_notes || null,
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
        const catSet = new Set<string>(['Semua']);
        if (categories && Array.isArray(categories)) {
            categories.forEach((c) => catSet.add(c));
        }
        products.forEach((p) => {
            if (p.category) catSet.add(p.category);
        });
        return Array.from(catSet);
    }, [categories, products]);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900 font-sans select-none">
            <Head title={`Kasir POS - ${outlet?.name || 'Terminal'}`} />

            {/* Top Bar (Clean, Tablet-Friendly) */}
            <header className="h-16 bg-slate-900 text-white px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
                {/* Brand & Outlet info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
                            EX
                        </div>
                        <span className="font-extrabold text-base text-white tracking-tight hidden sm:inline">EXPOS</span>
                    </div>

                    {/* Outlet Indicator / Switcher Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (outlets && outlets.length > 1) {
                                setIsBranchModalOpen(true);
                            }
                        }}
                        className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition ${
                            outlets && outlets.length > 1
                                ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 hover:border-emerald-500/50 cursor-pointer text-slate-200 shadow-xs'
                                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 cursor-default'
                        }`}
                        title={outlets && outlets.length > 1 ? 'Klik untuk berpindah cabang gerai kasir' : 'Cabang Operasional Aktif'}
                    >
                        <Store className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div className="text-left">
                            <span className="text-xs font-bold text-white block leading-tight truncate max-w-[110px] sm:max-w-[170px]">
                                {outlet?.name || 'Cabang Utama'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block -mt-0.5">
                                {outlet?.code || 'POS'}
                            </span>
                        </div>
                        {outlets && outlets.length > 1 && (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                        )}
                    </button>

                    {/* Active Operator Switch */}
                    <button
                        onClick={() => setIsLocked(true)}
                        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition active:scale-95"
                        title="Klik untuk ganti kasir / kunci layar"
                    >
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">{currentCashier ? currentCashier.name : 'Pilih Kasir'}</span>
                        <span className="sm:hidden">{currentCashier ? currentCashier.name.split(' ')[0] : 'Kasir'}</span>
                    </button>

                    {/* Shift Badge Button */}
                    <button
                        onClick={() => setIsShiftOpen(true)}
                        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition active:scale-95 ${
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
                            <span className="flex items-center gap-1.5 text-emerald-400 font-medium" title="Terhubung ke server">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Online
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 text-amber-400 font-medium" title="Mode Offline (Data tersimpan di perangkat lokal)">
                                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
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
                                <Package className="w-12 h-12 stroke-[1.5] mb-2 opacity-40 text-slate-400" />
                                <p className="font-semibold text-slate-600 text-base">Tidak ada produk ditemukan</p>
                                <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian lain</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredProducts.map((prod) => {
                                    // Total in cart for this product
                                    const inCartQty = cart
                                        .filter((item) => item.product_id === prod.id)
                                        .reduce((sum, item) => sum + item.qty, 0);

                                    return (
                                        <button
                                            key={prod.id}
                                            type="button"
                                            onClick={() => handleProductClick(prod)}
                                            className={`relative p-3 rounded-2xl bg-white border text-left flex flex-col justify-between transition-all hover:shadow-md active:scale-97 cursor-pointer ${
                                                inCartQty > 0
                                                    ? 'border-emerald-600 ring-1 ring-emerald-600 shadow-xs'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {/* Product Image / Placeholder */}
                                            <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2.5 relative flex items-center justify-center border border-slate-100 shrink-0">
                                                {prod.image_url ? (
                                                    <img
                                                        src={prod.image_url}
                                                        alt={prod.name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <Package className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                                                )}

                                                {/* In-Cart Indicator */}
                                                {inCartQty > 0 && (
                                                    <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                                                        {inCartQty}
                                                    </div>
                                                )}

                                                {/* Variant Badge */}
                                                {prod.variants && prod.variants.length > 0 && (
                                                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-semibold tracking-wide backdrop-blur-xs">
                                                        {prod.variants.length} Varian
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                                                    {prod.category}
                                                </span>
                                                <h3 className="font-semibold text-slate-900 text-xs mt-0.5 line-clamp-2 leading-tight">
                                                    {prod.name}
                                                </h3>
                                                <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                                                    {prod.sku}
                                                </span>
                                            </div>

                                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                                <span className="font-bold text-slate-900 text-xs">
                                                    {formatRupiah(prod.price)}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-500">
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
                        orderType={orderType}
                        onOrderTypeChange={setOrderType}
                        tableNumber={tableNumber}
                        onTableNumberChange={setTableNumber}
                        orderNotes={orderNotes}
                        onOrderNotesChange={setOrderNotes}
                        onUpdateQty={handleUpdateQty}
                        onRemoveItem={handleRemoveItem}
                        onClearCart={handleClearCart}
                        onHoldOrder={handleHoldOrder}
                        onOpenParkedOrders={() => setIsParkedOpen(true)}
                        parkedOrdersCount={parkedCount}
                        onCheckout={() => setIsPaymentOpen(true)}
                        subtotal={subtotal}
                        discountType={discountType}
                        discountValue={discountValue}
                        onDiscountChange={(type, val) => {
                            setDiscountType(type);
                            setDiscountValue(val);
                        }}
                        discountAmount={discountAmount}
                        taxAmount={taxAmount}
                        totalAmount={totalAmount}
                        appliedCharges={appliedCharges}
                        activeTax={activeTax}
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
                outletId={outlet?.id}
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

            <VariantDialog
                isOpen={Boolean(variantDialogProduct)}
                onClose={() => setVariantDialogProduct(null)}
                product={variantDialogProduct}
                onSelectVariant={(product, variant, notes) => {
                    handleAddToCart(product, variant, notes);
                }}
            />

            <ParkedDialog
                isOpen={isParkedOpen}
                onClose={() => setIsParkedOpen(false)}
                onRecallOrder={handleRecallOrder}
            />

            {/* Modal Pindah Cabang Terminal Kasir POS */}
            {isBranchModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <Store className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        Pindah Cabang Terminal Kasir
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Pilih cabang gerai yang ingin dioperasikan saat ini:
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

                        {/* List Branches */}
                        <div className="p-5 overflow-y-auto space-y-3 bg-white">
                            {outlets.map((item) => {
                                const isCurrent = outlet?.id === item.id;
                                return (
                                    <Link
                                        key={item.id}
                                        href={`/pos/${item.id}`}
                                        onClick={() => setIsBranchModalOpen(false)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                                            isCurrent
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
                                                        {item.name}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono font-bold shrink-0">
                                                        {item.code}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                                                            Aktif Sekarang
                                                        </span>
                                                    )}
                                                </div>
                                                {item.address && (
                                                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">{item.address}</span>
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

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
                            <span>
                                Gerai aktif: <strong className="text-slate-900 font-bold">{outlet?.name || '-'}</strong>
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
        </div>
    );
}
