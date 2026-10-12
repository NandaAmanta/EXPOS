<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosStockMovement extends Model
{
    use HasUuids;

    protected $table = 'pos_stock_movements';

    protected $fillable = [
        'id',
        'tenant_id',
        'outlet_id',
        'item_type',
        'item_id',
        'type',
        'quantity',
        'balance_before',
        'balance_after',
        'reference_id',
        'reference_type',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'balance_before' => 'decimal:3',
        'balance_after' => 'decimal:3',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(PosIngredient::class, 'item_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(PosProduct::class, 'item_id');
    }
}
