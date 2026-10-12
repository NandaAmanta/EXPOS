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
        $outletId = $request->query('outlet_id', $request->session()->get('active_outlet_id', 'all'));

        $outlets = \App\Models\PosOutlet::where('is_active', true)->get(['id', 'code', 'name']);

        $todayOrders = PosOrder::whereDate('transacted_at', $today)
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId));

        $todaySales = (clone $todayOrders)->sum('total_amount');
        $todayOrderCount = (clone $todayOrders)->count();

        $orderIdsToday = (clone $todayOrders)->pluck('id');
        $todayItemsCount = PosOrderItem::whereIn('order_id', $orderIdsToday)->sum('qty');

        $activeShift = PosShift::with(['user', 'outlet'])
            ->where('status', 'open')
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->latest('opened_at')
            ->first();

        $recentOrders = PosOrder::with(['items', 'payments', 'outlet'])
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->latest('transacted_at')
            ->limit(10)
            ->get();

        $lowStockProducts = PosProduct::where('is_active', true)
            ->where('stock', '<=', 20)
            ->orderBy('stock')
            ->limit(5)
            ->get();

        $lowStockIngredients = \App\Models\PosIngredientStock::with(['ingredient', 'outlet'])
            ->whereColumn('current_stock', '<=', 'min_stock_alert')
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->limit(5)
            ->get();

        $topSelling = PosOrderItem::query()
            ->when($outletId && $outletId !== 'all', function ($q) use ($outletId) {
                $q->whereHas('order', fn ($oq) => $oq->where('outlet_id', $outletId));
            })
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

        // 30 Days Daily Sales Trend
        $daysCount = 30;
        $trendStartDate = Carbon::today()->subDays($daysCount - 1);
        $dailyStats = PosOrder::query()
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->where('transacted_at', '>=', $trendStartDate->copy()->startOfDay())
            ->selectRaw("DATE(transacted_at) as date, COUNT(*) as orders_count, SUM(total_amount) as total_sales")
            ->groupBy('date')
            ->get()
            ->keyBy('date');

        $salesTrend = [];
        $current = $trendStartDate->copy();
        $todayEnd = Carbon::today();

        while ($current->lte($todayEnd)) {
            $dateKey = $current->toDateString();
            $stat = $dailyStats->get($dateKey);
            $salesTrend[] = [
                'date' => $dateKey,
                'label' => $current->format('d M'),
                'day_name' => $current->format('D'),
                'revenue' => $stat ? (float) $stat->total_sales : 0,
                'orders' => $stat ? (int) $stat->orders_count : 0,
            ];
            $current->addDay();
        }

        // Hourly Sales Trend for Today (08:00 - 22:00)
        $todayHourlyStats = PosOrder::query()
            ->whereDate('transacted_at', $today)
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->selectRaw("HOUR(transacted_at) as hour, COUNT(*) as orders_count, SUM(total_amount) as total_sales")
            ->groupBy('hour')
            ->get()
            ->keyBy('hour');

        $hourlyTrend = [];
        for ($h = 8; $h <= 22; $h++) {
            $stat = $todayHourlyStats->get($h);
            $hourlyTrend[] = [
                'hour' => sprintf('%02d:00', $h),
                'label' => sprintf('%02d:00', $h),
                'revenue' => $stat ? (float) $stat->total_sales : 0,
                'orders' => $stat ? (int) $stat->orders_count : 0,
            ];
        }

        // Quick Stats for Chart
        $last7DaysTrend = array_slice($salesTrend, -7);
        $revenue7d = array_sum(array_column($last7DaysTrend, 'revenue'));
        $orders7d = array_sum(array_column($last7DaysTrend, 'orders'));
        $revenue30d = array_sum(array_column($salesTrend, 'revenue'));
        $orders30d = array_sum(array_column($salesTrend, 'orders'));

        $maxDailyRevenue = 0;
        $peakDate = null;
        foreach ($salesTrend as $day) {
            if ($day['revenue'] > $maxDailyRevenue) {
                $maxDailyRevenue = $day['revenue'];
                $peakDate = $day['label'];
            }
        }

        $chartSummary = [
            'revenue_7d' => (float) $revenue7d,
            'orders_7d' => (int) $orders7d,
            'revenue_30d' => (float) $revenue30d,
            'orders_30d' => (int) $orders30d,
            'peak_revenue' => (float) $maxDailyRevenue,
            'peak_date' => $peakDate,
        ];

        return Inertia::render('backoffice/dashboard', [
            'summary' => $summary,
            'sales_trend' => $salesTrend,
            'hourly_trend' => $hourlyTrend,
            'chart_summary' => $chartSummary,
            'recent_orders' => $recentOrders,
            'low_stock_products' => $lowStockProducts,
            'low_stock_ingredients' => $lowStockIngredients,
            'top_selling' => $topSelling,
            'outlets' => $outlets,
            'selected_outlet_id' => $outletId ?? 'all',
        ]);
    }
}
