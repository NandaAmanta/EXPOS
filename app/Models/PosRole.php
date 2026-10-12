<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosRole extends Model
{
    use HasFactory;

    protected $table = 'pos_roles';

    protected $fillable = [
        'name',
        'slug',
        'description',
        'permissions',
        'is_system',
    ];

    protected $casts = [
        'permissions' => 'array',
        'is_system' => 'boolean',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'role', 'slug');
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->slug === 'admin') {
            return true;
        }

        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions, true);
    }
}
