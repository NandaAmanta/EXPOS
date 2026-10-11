<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessPosOrderSync;
use App\Models\PosOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PosSyncController extends Controller
{
    public function batchSync(Request $request): JsonResponse
    {
        $request->validate([
            'orders' => 'required|array',
            'orders.*.id' => 'required|uuid',
            'orders.*.order_number' => 'required|string',
            'orders.*.total_amount' => 'required|numeric',
            'orders.*.items' => 'required|array',
            'orders.*.created_at' => 'required|string',
        ]);

        $orders = $request->input('orders', []);
        $syncedIds = [];
        $tenantId = $request->user()?->tenant_id ?? 'tenant-uuid-001';

        foreach ($orders as $orderData) {
            $orderId = $orderData['id'];

            try {
                // Idempotency guard: process only if not already saved
                if (!PosOrder::where('id', $orderId)->exists()) {
                    ProcessPosOrderSync::dispatchSync($orderData, $tenantId);
                }

                $syncedIds[] = $orderId;
            } catch (\Throwable $e) {
                Log::error("POS batch sync error on order {$orderId}: " . $e->getMessage());
                // Still record existing if duplicate constraint happened
                if (PosOrder::where('id', $orderId)->exists()) {
                    $syncedIds[] = $orderId;
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'synced_ids' => $syncedIds,
            'count' => count($syncedIds),
        ]);
    }
}
