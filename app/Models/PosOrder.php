<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOrder extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_orders';

    protected $fillable = [
        'id',
        'tenant_id',
        'outlet_id',
        'user_id',
        'shift_id',
        'order_number',
        'customer_name',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'total_amount',
        'payment_status',
        'transacted_at',
        'erp_sync_status',
        'erp_reference_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'transacted_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(PosOutlet::class, 'outlet_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(PosShift::class, 'shift_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosOrderItem::class, 'order_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(PosPayment::class, 'order_id');
    }
}
