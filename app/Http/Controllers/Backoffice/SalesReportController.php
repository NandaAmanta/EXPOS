<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOrder;
use App\Models\PosPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesReportController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $cashierId = $request->query('cashier_id');
        $outletId = $request->query('outlet_id', $request->session()->get('active_outlet_id', 'all'));
        $orderType = $request->query('order_type');
        $paymentMethod = $request->query('payment_method');
        $perPage = (int) $request->query('per_page', 15);
        if (!in_array($perPage, [10, 15, 25, 50, 100])) {
            $perPage = 15;
        }

        // Date Range resolution
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        // Backward compatibility for single 'date' query parameter
        if (!$startDate && !$endDate && $request->has('date')) {
            $legacyDate = $request->query('date');
            if ($legacyDate === 'all') {
                $startDate = null;
                $endDate = null;
            } else {
                $startDate = $legacyDate;
                $endDate = $legacyDate;
            }
        } elseif (!$startDate && !$endDate && !$request->has('start_date') && !$request->has('end_date')) {
            // Default to today
            $startDate = Carbon::today()->toDateString();
            $endDate = Carbon::today()->toDateString();
        }

        $query = PosOrder::query()
            ->with(['items.product', 'payments', 'user', 'outlet', 'shift.user'])
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->when($startDate && $startDate !== 'all', fn ($q) => $q->whereDate('transacted_at', '>=', $startDate))
            ->when($endDate && $endDate !== 'all', fn ($q) => $q->whereDate('transacted_at', '<=', $endDate))
            ->when($cashierId, function ($q, $cashierId) {
                $q->where(function ($sub) use ($cashierId) {
                    $sub->where('user_id', $cashierId)
                        ->orWhereHas('shift', fn ($sq) => $sq->where('user_id', $cashierId));
                });
            })
            ->when($orderType, fn ($q) => $q->where('order_type', $orderType))
            ->when($paymentMethod, function ($q, $method) {
                $q->whereHas('payments', fn ($pq) => $pq->where('payment_method', $method));
            })
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('order_number', 'like', "%{$search}%")
                        ->orWhere('customer_name', 'like', "%{$search}%")
                        ->orWhere('table_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest('transacted_at');

        // Summary Calculations (Calculated on ALL filtered rows before pagination)
        $summaryQuery = (clone $query);
        $totalRevenue = (clone $summaryQuery)->sum('total_amount');
        $totalSubtotal = (clone $summaryQuery)->sum('subtotal');
        $totalDiscount = (clone $summaryQuery)->sum('discount_amount');
        $totalCharges = (clone $summaryQuery)->sum('charges_amount');
        $totalTax = (clone $summaryQuery)->sum('tax_amount');
        $totalOrders = (clone $summaryQuery)->count();

        // Payment Method breakdown across the filtered dataset
        $filteredOrderIds = (clone $summaryQuery)->pluck('id');
        $paymentBreakdown = PosPayment::whereIn('order_id', $filteredOrderIds)
            ->selectRaw('payment_method, SUM(amount) as sum_amount, SUM(change_amount) as sum_change')
            ->groupBy('payment_method')
            ->get()
            ->keyBy('payment_method');

        $cashTotal = 0;
        if ($paymentBreakdown->has('CASH')) {
            $c = $paymentBreakdown->get('CASH');
            $cashTotal = (float) $c->sum_amount - (float) $c->sum_change;
        }
        $qrisTotal = $paymentBreakdown->has('QRIS') ? (float) $paymentBreakdown->get('QRIS')->sum_amount : 0;
        $debitTotal = $paymentBreakdown->has('DEBIT') ? (float) $paymentBreakdown->get('DEBIT')->sum_amount : 0;

        // Paginated Orders with withQueryString()
        $paginatedOrders = $query->paginate($perPage)->withQueryString();

        $ordersTransformed = $paginatedOrders->through(function ($order) {
            $cashierName = $order->user?->name 
                ?? $order->shift?->user?->name 
                ?? 'Kasir';
            
            $cashierRole = $order->user?->role 
                ?? $order->shift?->user?->role 
                ?? 'Staff';

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'order_type' => $order->order_type,
                'table_number' => $order->table_number,
                'customer_name' => $order->customer_name,
                'notes' => $order->notes,
                'subtotal' => (float) $order->subtotal,
                'discount_amount' => (float) $order->discount_amount,
                'charges_amount' => (float) ($order->charges_amount ?? 0),
                'charges_detail' => $order->charges_detail,
                'tax_rate' => $order->tax_rate !== null ? (float) $order->tax_rate : null,
                'tax_name' => $order->tax_name,
                'tax_amount' => (float) $order->tax_amount,
                'total_amount' => (float) $order->total_amount,
                'payment_status' => $order->payment_status,
                'transacted_at' => $order->transacted_at?->toISOString(),
                'erp_sync_status' => $order->erp_sync_status,
                'cashier_id' => $order->user_id ?? $order->shift?->user_id,
                'cashier_name' => $cashierName,
                'cashier_role' => ucfirst($cashierRole),
                'outlet_name' => $order->outlet?->name ?? 'Cabang Utama',
                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'sku' => $item->sku,
                    'product_name' => $item->product_name,
                    'qty' => $item->qty,
                    'unit_price' => (float) $item->unit_price,
                    'subtotal' => (float) $item->subtotal,
                    'selected_variant' => $item->selected_variant,
                    'notes' => $item->notes,
                ]),
                'payments' => $order->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'payment_method' => $p->payment_method,
                    'amount' => (float) $p->amount,
                    'change_amount' => (float) $p->change_amount,
                    'reference_number' => $p->reference_number,
                ]),
            ];
        });

        // Available Cashiers list for filter dropdown
        $cashiers = User::query()
            ->where('is_active', true)
            ->whereIn('role', ['cashier', 'admin', 'manager', 'supervisor'])
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        $outlets = \App\Models\PosOutlet::where('is_active', true)->get(['id', 'code', 'name']);

        return Inertia::render('backoffice/reports/sales', [
            'orders' => $ordersTransformed,
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_subtotal' => (float) $totalSubtotal,
                'total_discount' => (float) $totalDiscount,
                'total_charges' => (float) $totalCharges,
                'total_tax' => (float) $totalTax,
                'total_orders' => (int) $totalOrders,
                'cash_total' => (float) $cashTotal,
                'qris_total' => (float) $qrisTotal,
                'debit_total' => (float) $debitTotal,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'cashiers' => $cashiers,
            'outlets' => $outlets,
            'filters' => [
                'search' => $search,
                'outlet_id' => $outletId ?? 'all',
                'start_date' => $startDate,
                'end_date' => $endDate,
                'cashier_id' => $cashierId,
                'order_type' => $orderType,
                'payment_method' => $paymentMethod,
                'per_page' => $perPage,
            ],
        ]);
    }
}
