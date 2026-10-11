<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOrder;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesReportController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $date = $request->query('date', Carbon::today()->toDateString());

        $orders = PosOrder::with(['items', 'payments', 'user'])
            ->when($date, fn ($q) => $q->whereDate('transacted_at', $date))
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%");
                });
            })
            ->latest('transacted_at')
            ->get();

        $totalRevenue = $orders->sum('total_amount');
        $totalOrders = $orders->count();

        return Inertia::render('backoffice/reports/sales', [
            'orders' => $orders,
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => (int) $totalOrders,
                'date' => $date,
            ],
            'filters' => [
                'search' => $search,
                'date' => $date,
            ],
        ]);
    }
}
