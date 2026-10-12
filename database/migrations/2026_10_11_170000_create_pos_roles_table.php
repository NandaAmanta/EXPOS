<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create pos_roles table
        Schema::create('pos_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->json('permissions');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // 2. Add is_active column to users table
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('outlet_id');
            }
        });

        // 3. Seed default core roles
        $now = now();
        $defaultRoles = [
            [
                'name' => 'Owner / Administrator',
                'slug' => 'admin',
                'description' => 'Akses penuh ke semua fitur Backoffice, Laporan, Manajemen Pengguna, dan Terminal POS.',
                'permissions' => json_encode([
                    'pos.access',
                    'pos.discount',
                    'pos.park_order',
                    'pos.shift_manage',
                    'pos.spk_print',
                    'catalog.view',
                    'catalog.manage',
                    'reports.sales',
                    'reports.shifts',
                    'reports.export',
                    'users.manage',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Store Manager',
                'slug' => 'manager',
                'description' => 'Supervisi operasional toko, audit kas shift, melihat laporan omset, dan kelola katalog produk.',
                'permissions' => json_encode([
                    'pos.access',
                    'pos.discount',
                    'pos.park_order',
                    'pos.shift_manage',
                    'pos.spk_print',
                    'catalog.view',
                    'catalog.manage',
                    'reports.sales',
                    'reports.shifts',
                    'reports.export',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Kasir / Cashier',
                'slug' => 'cashier',
                'description' => 'Operasional penjualan harian di terminal POS, penerimaan kas, buka/tutup shift, dan cetak struk.',
                'permissions' => json_encode([
                    'pos.access',
                    'pos.discount',
                    'pos.park_order',
                    'pos.shift_manage',
                    'pos.spk_print',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Dapur / Kitchen',
                'slug' => 'kitchen',
                'description' => 'Melihat antrean pesanan makanan/minuman dan mencetak ulang SPK dapur.',
                'permissions' => json_encode([
                    'pos.spk_print',
                ]),
                'is_system' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        DB::table('pos_roles')->insert($defaultRoles);
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_roles');
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
