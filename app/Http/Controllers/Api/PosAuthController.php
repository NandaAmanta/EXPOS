<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosAuthController extends Controller
{
    /**
     * Get active cashier list for fast tablet operator switching
     */
    public function cashiers(Request $request): JsonResponse
    {
        $cashiers = User::query()
            ->select('id', 'name', 'email', 'role')
            ->where('is_active', true)
            ->whereIn('role', ['cashier', 'admin', 'manager'])
            ->orderBy('name')
            ->get();

        return response()->json([
            'cashiers' => $cashiers,
        ]);
    }

    /**
     * Verify cashier PIN (returns token and cashier session)
     */
    public function verifyPin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'pin' => 'required|string',
        ]);

        $user = User::findOrFail($validated['user_id']);

        if (!$user->verifyPin($validated['pin'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'PIN Kasir salah.',
            ], 422);
        }

        // Generate or reuse device token for POS API requests
        $token = $user->createToken('pos-tablet-device', ['pos:operate'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Autentikasi kasir berhasil.',
            'token' => $token,
            'cashier' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
            ],
        ]);
    }
}
