<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosCategory;
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

        $categories = PosCategory::where('is_active', true)->orderBy('name')->get();

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
            'image' => 'nullable|image|max:2048',
            'variants' => 'nullable',
        ]);

        $imageUrl = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $imageUrl = '/storage/' . $path;
        }

        $variants = null;
        if ($request->filled('variants')) {
            $variants = is_string($request->input('variants'))
                ? json_decode($request->input('variants'), true)
                : $request->input('variants');
        }

        $outletId = PosOutlet::query()->value('id');
        $categoryName = trim($validated['category']);
        $cat = PosCategory::firstOrCreate(
            ['name' => $categoryName],
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => 'tenant-uuid-001',
                'outlet_id' => $outletId,
                'slug' => Str::slug($categoryName),
                'is_active' => true,
            ]
        );

        PosProduct::create([
            'id' => Str::uuid()->toString(),
            'tenant_id' => 'tenant-uuid-001',
            'outlet_id' => $outletId,
            'sku' => $validated['sku'],
            'barcode' => $validated['barcode'] ?? null,
            'name' => $validated['name'],
            'category' => $cat->name,
            'category_id' => $cat->id,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'stock' => $validated['stock'],
            'image_url' => $imageUrl,
            'variants' => $variants,
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
            'image' => 'nullable|image|max:2048',
            'variants' => 'nullable',
            'is_active' => 'nullable|boolean',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validated['image_url'] = '/storage/' . $path;
        }

        if ($request->has('variants')) {
            $variants = $request->input('variants');
            $validated['variants'] = is_string($variants)
                ? (json_decode($variants, true) ?: null)
                : $variants;
        }

        $categoryName = trim($validated['category']);
        $cat = PosCategory::firstOrCreate(
            ['name' => $categoryName],
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => 'tenant-uuid-001',
                'outlet_id' => $product->outlet_id,
                'slug' => Str::slug($categoryName),
                'is_active' => true,
            ]
        );
        $validated['category'] = $cat->name;
        $validated['category_id'] = $cat->id;

        unset($validated['image']);

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
