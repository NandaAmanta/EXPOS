<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\PosProduct;
use App\Models\PosShift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today();

        $todayOrders = PosOrder::whereDate('transacted_at', $today);
        $todaySales = (clone $todayOrders)->sum('total_amount');
        $todayOrderCount = (clone $todayOrders)->count();

        $orderIdsToday = (clone $todayOrders)->pluck('id');
        $todayItemsCount = PosOrderItem::whereIn('order_id', $orderIdsToday)->sum('qty');

        $activeShift = PosShift::with('user')
            ->where('status', 'open')
            ->latest('opened_at')
            ->first();

        $recentOrders = PosOrder::with(['items', 'payments'])
            ->latest('transacted_at')
            ->limit(10)
            ->get();

        $lowStockProducts = PosProduct::where('is_active', true)
            ->where('stock', '<=', 20)
            ->orderBy('stock')
            ->limit(5)
            ->get();

        $topSelling = PosOrderItem::query()
            ->selectRaw('product_name, sku, SUM(qty) as total_qty, SUM(subtotal) as total_revenue')
            ->groupBy('product_name', 'sku')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        $summary = [
            'today_sales' => (float) $todaySales,
            'today_orders' => (int) $todayOrderCount,
            'today_items' => (int) $todayItemsCount,
            'avg_order_value' => $todayOrderCount > 0 ? (float) ($todaySales / $todayOrderCount) : 0,
            'active_shift' => $activeShift,
        ];

        return Inertia::render('backoffice/dashboard', [
            'summary' => $summary,
            'recent_orders' => $recentOrders,
            'low_stock_products' => $lowStockProducts,
            'top_selling' => $topSelling,
        ]);
    }
}
