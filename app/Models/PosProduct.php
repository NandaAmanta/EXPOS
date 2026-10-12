<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosProduct extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_products';

    protected $fillable = [
        'id',
        'tenant_id',
        'outlet_id',
        'sku',
        'barcode',
        'name',
        'category',
        'category_id',
        'price',
        'cost_price',
        'stock',
        'image_url',
        'variants',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock' => 'integer',
        'variants' => 'array',
        'is_active' => 'boolean',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }

    public function categoryModel(): BelongsTo
    {
        return $this->belongsTo(PosCategory::class, 'category_id');
    }

    public function recipes(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PosRecipe::class, 'product_id');
    }

    public function branchStocks(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(PosProductStock::class, 'product_id');
    }

    public function hasRecipe(): bool
    {
        return $this->recipes()->exists();
    }

    /**
     * Menghitung HPP teoretis berdasarkan Bill of Materials (BOM)
     */
    public function calculatedCogs(?string $variantName = null): float
    {
        $recipes = $this->recipes()
            ->with('ingredient')
            ->when($variantName, function ($query, $variant) {
                $query->where(function ($q) use ($variant) {
                    $q->whereNull('variant_name')->orWhere('variant_name', $variant);
                });
            })
            ->get();

        if ($recipes->isEmpty()) {
            return (float) $this->cost_price;
        }

        $totalCogs = 0;
        foreach ($recipes as $recipe) {
            $costPerUnit = (float) ($recipe->ingredient?->cost_per_unit ?? 0);
            $totalCogs += (float) $recipe->quantity * $costPerUnit;
        }

        return $totalCogs;
    }
}
