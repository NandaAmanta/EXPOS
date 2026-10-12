<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosIngredient extends Model
{
    use HasUuids;

    protected $table = 'pos_ingredients';

    protected $fillable = [
        'id',
        'tenant_id',
        'sku',
        'name',
        'category',
        'unit',
        'cost_per_unit',
        'is_active',
    ];

    protected $casts = [
        'cost_per_unit' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function stocks(): HasMany
    {
        return $this->hasMany(PosIngredientStock::class, 'ingredient_id');
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(PosRecipe::class, 'ingredient_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(PosStockMovement::class, 'item_id')->where('item_type', 'ingredient');
    }

    public function stockForOutlet(?string $outletId): ?PosIngredientStock
    {
        if (!$outletId) {
            return null;
        }
        return $this->stocks()->where('outlet_id', $outletId)->first();
    }
}
