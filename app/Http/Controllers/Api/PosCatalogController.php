<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosCatalogController extends Controller
{
    public function index(Request $request): JsonResponse
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

        return response()->json([
            'outlet' => $outlet,
            'categories' => $categories,
            'products' => $products,
        ]);
    }
}
