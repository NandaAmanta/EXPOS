<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosOutlet;
use App\Models\PosProduct;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->query('search');
        $category = $request->query('category');

        $products = PosProduct::query()
            ->when($search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($category, fn ($q, $cat) => $q->where('category', $cat))
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        $categories = PosProduct::distinct()->pluck('category')->values();

        return Inertia::render('backoffice/products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:pos_products,sku',
            'barcode' => 'nullable|string',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $outletId = PosOutlet::query()->value('id');

        PosProduct::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => 'tenant-uuid-001',
            'outlet_id' => $outletId,
            'sku' => $validated['sku'],
            'barcode' => $validated['barcode'] ?? null,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'stock' => $validated['stock'],
            'is_active' => true,
        ]);

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    public function update(Request $request, string $id): RedirectResponse
    {
        $product = PosProduct::findOrFail($id);

        $validated = $request->validate([
            'sku' => 'required|string|unique:pos_products,sku,' . $product->id,
            'barcode' => 'nullable|string',
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $product->update($validated);

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(string $id): RedirectResponse
    {
        $product = PosProduct::findOrFail($id);
        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
