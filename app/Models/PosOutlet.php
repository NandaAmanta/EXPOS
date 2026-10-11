<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOutlet extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'pos_outlets';

    protected $fillable = [
        'id',
        'tenant_id',
        'name',
        'code',
        'address',
        'phone',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(PosProduct::class, 'outlet_id');
    }

    public function shifts(): HasMany
    {
        return $this->hasMany(PosShift::class, 'outlet_id');
    }

    public function orders(): HasMany
    {
        return $this->hasMany(PosOrder::class, 'outlet_id');
    }
}
