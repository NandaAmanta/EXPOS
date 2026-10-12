<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosRecipe extends Model
{
    use HasUuids;

    protected $table = 'pos_recipes';

    protected $fillable = [
        'id',
        'product_id',
        'variant_name',
        'ingredient_id',
        'quantity',
        'unit',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(PosProduct::class, 'product_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(PosIngredient::class, 'ingredient_id');
    }

    public function calculatedCost(): float
    {
        $costPerUnit = (float) ($this->ingredient?->cost_per_unit ?? 0);
        return (float) $this->quantity * $costPerUnit;
    }
}
