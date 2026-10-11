<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosPayment extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_payments';

    protected $fillable = [
        'id',
        'order_id',
        'payment_method',
        'amount',
        'change_amount',
        'reference_number',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'order_id');
    }
}
