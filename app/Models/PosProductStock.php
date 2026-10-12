<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosProductStock extends Model
{
    use HasUuids;

    protected $table = 'pos_product_stocks';

    protected $fillable = [
        'id',
        'outlet_id',
        'product_id',
        'current_stock',
        'min_stock_alert',
        'price_override',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'min_stock_alert' => 'integer',
        'price_override' => 'decimal:2',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(PosProduct::class, 'product_id');
    }

    public function isLowStock(): bool
    {
        return $this->current_stock <= $this->min_stock_alert;
    }
}
