<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PosCategory;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $outletId = $request->query('outlet_id');
        $outlet = $outletId
            ? PosOutlet::where('id', $outletId)->where('is_active', true)->first()
            : PosOutlet::where('is_active', true)->first();

        $products = PosProduct::query()
            ->where('is_active', true)
            ->when($outlet, fn ($q) => $q->with(['branchStocks' => fn ($b) => $b->where('outlet_id', $outlet->id)]))
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($prod) {
                if ($prod->relationLoaded('branchStocks')) {
                    $branchStock = $prod->branchStocks->first();
                    if ($branchStock) {
                        $prod->stock = $branchStock->current_stock;
                        if ($branchStock->price_override !== null) {
                            $prod->price = (float) $branchStock->price_override;
                        }
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

        $taxes = \App\Models\PosTax::where('is_active', true)->get();
        $charges = \App\Models\PosCharge::where('is_active', true)->get();

        return response()->json([
            'outlet' => $outlet,
            'categories' => $categories,
            'products' => $products,
            'taxes' => $taxes,
            'charges' => $charges,
        ]);
    }
}
