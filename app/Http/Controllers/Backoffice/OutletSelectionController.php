<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OutletSelectionController extends Controller
{
    /**
     * Tampilkan layar pemilihan gerai cabang
     */
    public function selectOutlet(Request $request): Response
    {
        $user = $request->user();
        $isGlobalAdmin = in_array($user?->role, ['admin', 'owner']);

        if ($isGlobalAdmin) {
            $outlets = PosOutlet::where('is_active', true)->get();
        } else {
            $outlets = $user->assignedOutlets()->where('is_active', true)->get();
            if ($outlets->isEmpty() && $user->outlet_id) {
                $outlets = PosOutlet::where('id', $user->outlet_id)->where('is_active', true)->get();
            }
            if ($outlets->isEmpty()) {
                $outlets = PosOutlet::where('is_active', true)->get();
            }
        }

        return Inertia::render('backoffice/select-outlet', [
            'outlets' => $outlets,
            'can_select_all' => $isGlobalAdmin,
            'current_outlet_id' => $request->session()->get('active_outlet_id'),
        ]);
    }

    /**
     * Simpan cabang yang dipilih ke session
     */
    public function setOutlet(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|string',
            'redirect_to' => 'nullable|string',
        ]);

        $outletId = $validated['outlet_id'];
        $user = $request->user();
        $isGlobalAdmin = in_array($user?->role, ['admin', 'owner']);

        if ($outletId === 'all') {
            if (!$isGlobalAdmin) {
                return back()->with('error', 'Hanya administrator yang dapat mengakses konsolidasi semua cabang.');
            }
            $request->session()->put('active_outlet_id', 'all');
        } else {
            $outlet = PosOutlet::where('id', $outletId)->where('is_active', true)->firstOrFail();
            $request->session()->put('active_outlet_id', $outlet->id);
        }

        if (!empty($validated['redirect_to'])) {
            return redirect($validated['redirect_to']);
        }

        return redirect()->route('backoffice.dashboard');
    }
}
