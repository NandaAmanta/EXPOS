<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosCategory;
use App\Models\PosOutlet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = PosCategory::where('is_active', true)->orderBy('name')->get();
        return response()->json($categories);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $name = trim($validated['name']);
        $category = PosCategory::firstOrCreate(
            ['name' => $name],
            [
                'id' => Str::uuid()->toString(),
                'tenant_id' => 'tenant-uuid-001',
                'outlet_id' => PosOutlet::query()->value('id'),
                'slug' => Str::slug($name),
                'is_active' => true,
            ]
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Kategori berhasil dibuat.',
                'category' => $category,
            ], 201);
        }

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }
}
