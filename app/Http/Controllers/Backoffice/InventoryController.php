<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosIngredient;
use App\Models\PosIngredientStock;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use App\Models\PosRecipe;
use App\Models\PosStockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Master Bahan Baku & Stok Gerai
     */
    public function indexIngredients(Request $request): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');
        $outletId = $request->query('outlet_id', $request->session()->get('active_outlet_id', 'all'));

        $outlets = PosOutlet::where('is_active', true)->get();

        $query = PosIngredient::query()
            ->with(['stocks.outlet'])
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->when($category, fn ($q, $cat) => $q->where('category', $cat))
            ->orderBy('category')
            ->orderBy('name');

        $ingredients = $query->get()->map(function ($ing) use ($outletId) {
            $totalStock = $ing->stocks->sum('current_stock');
            $outletStock = null;
            if ($outletId && $outletId !== 'all') {
                $found = $ing->stocks->firstWhere('outlet_id', $outletId);
                $outletStock = $found ? (float) $found->current_stock : 0;
            }

            return [
                'id' => $ing->id,
                'sku' => $ing->sku,
                'name' => $ing->name,
                'category' => $ing->category,
                'unit' => $ing->unit,
                'cost_per_unit' => (float) $ing->cost_per_unit,
                'is_active' => (bool) $ing->is_active,
                'total_stock' => (float) $totalStock,
                'outlet_stock' => $outletStock,
                'stocks' => $ing->stocks->map(fn ($s) => [
                    'outlet_id' => $s->outlet_id,
                    'outlet_name' => $s->outlet?->name,
                    'outlet_code' => $s->outlet?->code,
                    'current_stock' => (float) $s->current_stock,
                    'min_stock_alert' => (float) $s->min_stock_alert,
                    'is_low' => $s->isLowStock(),
                ]),
            ];
        });

        $categories = PosIngredient::distinct()->pluck('category')->filter()->values();

        return Inertia::render('backoffice/inventory/ingredients', [
            'ingredients' => $ingredients,
            'categories' => $categories,
            'outlets' => $outlets,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'outlet_id' => $outletId ?? 'all',
            ],
        ]);
    }

    public function storeIngredient(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:pos_ingredients,sku|max:50',
            'name' => 'required|string|max:150',
            'category' => 'required|string|max:50',
            'unit' => 'required|string|max:20',
            'cost_per_unit' => 'required|numeric|min:0',
            'initial_stocks' => 'nullable|array',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $ing = PosIngredient::create([
                'sku' => strtoupper($validated['sku']),
                'name' => $validated['name'],
                'category' => $validated['category'],
                'unit' => strtolower($validated['unit']),
                'cost_per_unit' => $validated['cost_per_unit'],
                'is_active' => true,
            ]);

            $outlets = PosOutlet::where('is_active', true)->get();
            foreach ($outlets as $outlet) {
                $initialStock = isset($validated['initial_stocks'][$outlet->id])
                    ? (float) $validated['initial_stocks'][$outlet->id]
                    : 0;

                PosIngredientStock::create([
                    'outlet_id' => $outlet->id,
                    'ingredient_id' => $ing->id,
                    'current_stock' => $initialStock,
                    'min_stock_alert' => 100,
                ]);

                if ($initialStock > 0) {
                    PosStockMovement::create([
                        'outlet_id' => $outlet->id,
                        'item_type' => 'ingredient',
                        'item_id' => $ing->id,
                        'type' => 'purchase',
                        'quantity' => $initialStock,
                        'balance_before' => 0,
                        'balance_after' => $initialStock,
                        'notes' => 'Stok awal bahan baku',
                        'user_id' => $request->user()?->id,
                    ]);
                }
            }
        });

        return back()->with('success', 'Bahan baku berhasil ditambahkan');
    }

    public function updateIngredient(Request $request, string $id): RedirectResponse
    {
        $ing = PosIngredient::findOrFail($id);

        $validated = $request->validate([
            'sku' => "required|string|unique:pos_ingredients,sku,{$id}|max:50",
            'name' => 'required|string|max:150',
            'category' => 'required|string|max:50',
            'unit' => 'required|string|max:20',
            'cost_per_unit' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $ing->update([
            'sku' => strtoupper($validated['sku']),
            'name' => $validated['name'],
            'category' => $validated['category'],
            'unit' => strtolower($validated['unit']),
            'cost_per_unit' => $validated['cost_per_unit'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back()->with('success', 'Data bahan baku berhasil diperbarui');
    }

    public function destroyIngredient(string $id): RedirectResponse
    {
        $ing = PosIngredient::findOrFail($id);

        if ($ing->recipes()->exists()) {
            return back()->with('error', 'Bahan baku tidak dapat dihapus karena masih digunakan dalam resep menu.');
        }

        $ing->delete();
        return back()->with('success', 'Bahan baku berhasil dihapus');
    }

    /**
     * Resep Menu & Bill of Materials (BOM)
     */
    public function indexRecipes(Request $request): Response
    {
        $search = $request->query('search');

        $products = PosProduct::query()
            ->with(['recipes.ingredient'])
            ->when($search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(function ($prod) {
                return [
                    'id' => $prod->id,
                    'sku' => $prod->sku,
                    'name' => $prod->name,
                    'category' => $prod->category,
                    'price' => (float) $prod->price,
                    'variants' => $prod->variants ?? [],
                    'calculated_cogs' => (float) $prod->calculatedCogs(),
                    'recipes' => $prod->recipes->map(fn ($r) => [
                        'id' => $r->id,
                        'ingredient_id' => $r->ingredient_id,
                        'ingredient_name' => $r->ingredient?->name,
                        'ingredient_sku' => $r->ingredient?->sku,
                        'variant_name' => $r->variant_name,
                        'quantity' => (float) $r->quantity,
                        'unit' => $r->unit,
                        'cost' => (float) $r->calculatedCost(),
                    ]),
                ];
            });

        $ingredients = PosIngredient::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'sku', 'name', 'unit', 'cost_per_unit']);

        return Inertia::render('backoffice/inventory/recipes', [
            'products' => $products,
            'ingredients' => $ingredients,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function storeRecipe(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|uuid|exists:pos_products,id',
            'variant_name' => 'nullable|string|max:100',
            'ingredient_id' => 'required|uuid|exists:pos_ingredients,id',
            'quantity' => 'required|numeric|min:0.001',
            'unit' => 'required|string|max:20',
            'notes' => 'nullable|string|max:255',
        ]);

        PosRecipe::create($validated);

        return back()->with('success', 'Bahan racikan resep berhasil ditambahkan ke menu');
    }

    public function destroyRecipe(string $id): RedirectResponse
    {
        $recipe = PosRecipe::findOrFail($id);
        $recipe->delete();

        return back()->with('success', 'Bahan resep berhasil dihapus dari menu');
    }

    /**
     * Mutasi Stok & Kartu Stok
     */
    public function indexMovements(Request $request): Response
    {
        $outletId = $request->query('outlet_id', $request->session()->get('active_outlet_id', 'all'));
        $itemType = $request->query('item_type');
        $movementType = $request->query('type');

        $outlets = PosOutlet::where('is_active', true)->get();

        $query = PosStockMovement::query()
            ->with(['outlet', 'user', 'ingredient', 'product'])
            ->when($outletId && $outletId !== 'all', fn ($q) => $q->where('outlet_id', $outletId))
            ->when($itemType, fn ($q) => $q->where('item_type', $itemType))
            ->when($movementType, fn ($q) => $q->where('type', $movementType))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('backoffice/inventory/movements', [
            'movements' => $query,
            'outlets' => $outlets,
            'filters' => [
                'outlet_id' => $outletId ?? 'all',
                'item_type' => $itemType,
                'type' => $movementType,
            ],
        ]);
    }

    /**
     * Penyesuaian Stok (Stock Opname, Pembelian, atau Waste)
     */
    public function adjustStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'outlet_id' => 'required|uuid|exists:pos_outlets,id',
            'item_type' => 'required|in:ingredient,product',
            'item_id' => 'required|uuid',
            'type' => 'required|in:purchase,adjustment,waste',
            'quantity' => 'required|numeric',
            'notes' => 'required|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request) {
            $outletId = $validated['outlet_id'];
            $itemId = $validated['item_id'];
            $type = $validated['type'];
            $inputQty = (float) $validated['quantity'];
            $notes = $validated['notes'];

            if ($validated['item_type'] === 'ingredient') {
                $stock = PosIngredientStock::firstOrCreate(
                    ['outlet_id' => $outletId, 'ingredient_id' => $itemId],
                    ['current_stock' => 0, 'min_stock_alert' => 100]
                );

                $balanceBefore = (float) $stock->current_stock;
                // Jika adjustment opname, inputQty bisa merupakan stok fisik baru
                // atau selisih. Di sini jika 'adjustment', kita treat inputQty sebagai delta, atau if waste delta negatif
                $delta = $type === 'waste' ? -abs($inputQty) : $inputQty;
                $balanceAfter = $balanceBefore + $delta;

                $stock->update(['current_stock' => $balanceAfter]);

                PosStockMovement::create([
                    'outlet_id' => $outletId,
                    'item_type' => 'ingredient',
                    'item_id' => $itemId,
                    'type' => $type,
                    'quantity' => $delta,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'notes' => $notes,
                    'user_id' => $request->user()?->id,
                ]);
            } else {
                $prod = PosProduct::findOrFail($itemId);
                $stock = \App\Models\PosProductStock::firstOrCreate(
                    ['outlet_id' => $outletId, 'product_id' => $itemId],
                    ['current_stock' => (int) $prod->stock, 'min_stock_alert' => 5]
                );

                $balanceBefore = (float) $stock->current_stock;
                $delta = $type === 'waste' ? -abs($inputQty) : $inputQty;
                $balanceAfter = $balanceBefore + $delta;

                $stock->update(['current_stock' => $balanceAfter]);
                $prod->increment('stock', (int) $delta);

                PosStockMovement::create([
                    'outlet_id' => $outletId,
                    'item_type' => 'product',
                    'item_id' => $itemId,
                    'type' => $type,
                    'quantity' => $delta,
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'notes' => $notes,
                    'user_id' => $request->user()?->id,
                ]);
            }
        });

        return back()->with('success', 'Penyesuaian stok berhasil disimpan');
    }
}
