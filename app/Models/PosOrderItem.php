<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_order_items';

    protected $fillable = [
        'id',
        'order_id',
        'product_id',
        'sku',
        'product_name',
        'qty',
        'unit_price',
        'selected_variant',
        'notes',
        'subtotal',
    ];

    protected $casts = [
        'qty' => 'integer',
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(PosProduct::class, 'product_id');
    }
}
