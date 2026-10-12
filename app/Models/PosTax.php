<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosTax extends Model
{
    use HasFactory;

    protected $table = 'pos_taxes';

    protected $fillable = [
        'name',
        'code',
        'rate',
        'type',
        'is_auto_apply',
        'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'is_auto_apply' => 'boolean',
        'is_active' => 'boolean',
    ];
}
