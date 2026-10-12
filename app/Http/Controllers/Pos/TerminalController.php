<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\PosCategory;
use App\Models\PosCharge;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use App\Models\PosShift;
use App\Models\PosTax;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TerminalController extends Controller
{
    /**
     * Fallback ketika route /pos diakses tanpa UUID cabang
     */
    public function fallback(Request $request): RedirectResponse
    {
        // 1. Cek cabang aktif dari session Backoffice (jika bukan 'all')
        $sessionOutletId = $request->session()->get('active_outlet_id');
        if ($sessionOutletId && $sessionOutletId !== 'all') {
            $outletExists = PosOutlet::where('id', $sessionOutletId)->where('is_active', true)->exists();
            if ($outletExists) {
                return redirect()->route('pos.terminal.outlet', ['outlet_id' => $sessionOutletId]);
            }
        }

        // 2. Cek cabang yang ditugaskan ke user kasir jika user login
        $user = $request->user();
        if ($user) {
            $assignedOutlet = $user->assignedOutlets()->where('is_active', true)->first();
            if ($assignedOutlet) {
                return redirect()->route('pos.terminal.outlet', ['outlet_id' => $assignedOutlet->id]);
            }
            if ($user->outlet_id) {
                $userOutlet = PosOutlet::where('id', $user->outlet_id)->where('is_active', true)->first();
                if ($userOutlet) {
                    return redirect()->route('pos.terminal.outlet', ['outlet_id' => $userOutlet->id]);
                }
            }
        }

        // 3. Fallback default ke cabang aktif pertama di sistem
        $firstOutlet = PosOutlet::where('is_active', true)->first();
        if ($firstOutlet) {
            return redirect()->route('pos.terminal.outlet', ['outlet_id' => $firstOutlet->id]);
        }

        abort(404, 'Tidak ada cabang gerai aktif yang ditemukan dalam sistem.');
    }

    /**
     * Tampilkan layar kasir POS untuk cabang gerai spesifik berdasarkan UUID
     */
    public function index(Request $request, string $outlet_id): Response|RedirectResponse
    {
        $outlet = PosOutlet::where('id', $outlet_id)->where('is_active', true)->first();

        if (!$outlet) {
            return $this->fallback($request);
        }

        // Sinkronkan session active_outlet_id jika ada session aktif
        if ($request->hasSession()) {
            $request->session()->put('active_outlet_id', $outlet->id);
        }

        // Produk dengan stok spesifik cabang & harga override jika tersedia
        $products = PosProduct::query()
            ->where('is_active', true)
            ->with(['branchStocks' => fn ($q) => $q->where('outlet_id', $outlet->id)])
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($prod) {
                $branchStock = $prod->branchStocks->first();
                if ($branchStock) {
                    $prod->stock = $branchStock->current_stock;
                    if ($branchStock->price_override !== null) {
                        $prod->price = (float) $branchStock->price_override;
                    }
                }
                return $prod;
            });

        $categories = PosCategory::where('is_active', true)
            ->orderBy('name')
            ->pluck('name')
            ->values();

        if ($categories->isEmpty()) {
            $categories = PosProduct::query()
                ->where('is_active', true)
                ->distinct()
                ->pluck('category')
                ->values();
        }

        // Shift kasir yang sedang aktif khusus untuk gerai cabang ini
        $activeShift = PosShift::with(['user', 'cashMovements.user'])
            ->where('status', 'open')
            ->where('outlet_id', $outlet->id)
            ->latest('opened_at')
            ->first();

        // Daftar seluruh cabang aktif untuk modal switcher di POS
        $allOutlets = PosOutlet::where('is_active', true)
            ->select('id', 'name', 'code', 'address', 'phone')
            ->orderBy('name')
            ->get();

        $taxes = PosTax::where('is_active', true)->get();
        $charges = PosCharge::where('is_active', true)->get();

        return Inertia::render('pos/terminal', [
            'outlet' => $outlet,
            'outlets' => $allOutlets,
            'initial_products' => $products,
            'categories' => $categories,
            'active_shift' => $activeShift,
            'taxes' => $taxes,
            'charges' => $charges,
        ]);
    }
}
