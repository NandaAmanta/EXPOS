<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosIngredientStock extends Model
{
    use HasUuids;

    protected $table = 'pos_ingredient_stocks';

    protected $fillable = [
        'id',
        'outlet_id',
        'ingredient_id',
        'current_stock',
        'min_stock_alert',
    ];

    protected $casts = [
        'current_stock' => 'decimal:3',
        'min_stock_alert' => 'decimal:3',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(PosIngredient::class, 'ingredient_id');
    }

    public function isLowStock(): bool
    {
        return (float) $this->current_stock <= (float) $this->min_stock_alert;
    }
}
