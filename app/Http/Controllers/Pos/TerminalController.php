<?php

namespace App\Http\Controllers\Pos;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use App\Models\PosShift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TerminalController extends Controller
{
    public function index(Request $request): Response
    {
        $outlet = PosOutlet::where('is_active', true)->first();

        $products = PosProduct::query()
            ->where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $categories = PosProduct::query()
            ->where('is_active', true)
            ->distinct()
            ->pluck('category')
            ->values();

        $activeShift = PosShift::with('user')
            ->where('status', 'open')
            ->when($outlet, fn ($q) => $q->where('outlet_id', $outlet->id))
            ->latest('opened_at')
            ->first();

        return Inertia::render('pos/terminal', [
            'outlet' => $outlet,
            'initial_products' => $products,
            'categories' => $categories,
            'active_shift' => $activeShift,
        ]);
    }
}
