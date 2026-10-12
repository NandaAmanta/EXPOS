<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PosCashMovement;
use App\Models\PosOrder;
use App\Models\PosOutlet;
use App\Models\PosPayment;
use App\Models\PosShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PosShiftController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $outletId = $request->query('outlet_id') ?: PosOutlet::query()->value('id');

        $activeShift = PosShift::with(['user', 'cashMovements.user'])
            ->where('status', 'open')
            ->when($outletId, fn ($q) => $q->where('outlet_id', $outletId))
            ->latest('opened_at')
            ->first();

        return response()->json([
            'shift' => $activeShift,
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'nullable|uuid',
            'starting_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $outletId = $validated['outlet_id'] ?? PosOutlet::query()->value('id');

        // Check if there is already an open shift
        $existing = PosShift::where('status', 'open')
            ->where('outlet_id', $outletId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Shift is already open.',
                'shift' => $existing,
            ], 200);
        }

        $shift = PosShift::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => 'tenant-uuid-001',
            'outlet_id' => $outletId,
            'user_id' => $request->user()?->id,
            'starting_cash' => $validated['starting_cash'],
            'status' => 'open',
            'notes' => $validated['notes'] ?? null,
            'opened_at' => now(),
        ]);

        return response()->json([
            'message' => 'Shift opened successfully.',
            'shift' => $shift,
        ], 201);
    }

    public function cashMovement(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shift_id' => 'required|uuid|exists:pos_shifts,id',
            'type' => 'required|in:in,out',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
            'user_id' => 'nullable|uuid',
        ]);

        $shift = PosShift::findOrFail($validated['shift_id']);
        if ($shift->status !== 'open') {
            return response()->json(['message' => 'Shift is not open.'], 422);
        }

        $movement = PosCashMovement::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => $shift->tenant_id ?? 'tenant-uuid-001',
            'outlet_id' => $shift->outlet_id,
            'shift_id' => $shift->id,
            'user_id' => $validated['user_id'] ?? $request->user()?->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'reason' => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Cash movement recorded successfully.',
            'cash_movement' => $movement,
        ], 201);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $shift = PosShift::findOrFail($id);

        if ($shift->status === 'closed') {
            return response()->json(['message' => 'Shift already closed.', 'shift' => $shift]);
        }

        $validated = $request->validate([
            'actual_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        // Auto-associate any orders during this shift window that may have missed shift_id
        PosOrder::where('outlet_id', $shift->outlet_id)
            ->where('transacted_at', '>=', $shift->opened_at)
            ->whereNull('shift_id')
            ->update(['shift_id' => $shift->id]);

        // Calculate cash collected during shift
        $orderIds = $shift->orders()->pluck('id');
        $cashSales = PosPayment::whereIn('order_id', $orderIds)
            ->where('payment_method', 'CASH')
            ->sum('amount');

        // Calculate petty cash in and out
        $cashIn = $shift->cashMovements()->where('type', 'in')->sum('amount');
        $cashOut = $shift->cashMovements()->where('type', 'out')->sum('amount');

        $expectedCash = (float) $shift->starting_cash + (float) $cashSales + (float) $cashIn - (float) $cashOut;
        $actualCash = (float) $validated['actual_cash'];
        $difference = $actualCash - $expectedCash;

        $shift->update([
            'status' => 'closed',
            'expected_cash' => $expectedCash,
            'actual_cash' => $actualCash,
            'difference' => $difference,
            'notes' => $validated['notes'] ?? $shift->notes,
            'closed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Shift closed successfully.',
            'shift' => $shift,
        ]);
    }
}
