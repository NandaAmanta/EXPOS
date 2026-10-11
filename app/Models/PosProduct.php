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
        'price',
        'cost_price',
        'stock',
        'image_url',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }
}
