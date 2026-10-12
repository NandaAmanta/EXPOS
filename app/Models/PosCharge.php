<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PosCharge extends Model
{
    use HasFactory;

    protected $table = 'pos_charges';

    protected $fillable = [
        'name',
        'type',
        'rate',
        'is_taxable',
        'applies_to',
        'is_auto_apply',
        'is_active',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
        'is_taxable' => 'boolean',
        'is_auto_apply' => 'boolean',
        'is_active' => 'boolean',
    ];
}
