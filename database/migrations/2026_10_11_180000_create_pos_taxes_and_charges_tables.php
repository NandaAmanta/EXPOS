<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create pos_taxes table
        Schema::create('pos_taxes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->decimal('rate', 5, 2)->default(10.00); // e.g. 10.00 for 10%
            $table->string('type')->default('exclusive'); // 'exclusive' or 'inclusive'
            $table->boolean('is_auto_apply')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Create pos_charges table
        Schema::create('pos_charges', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->default('percent'); // 'percent' or 'fixed'
            $table->decimal('rate', 10, 2)->default(5.00); // e.g. 5.00 for 5% or 2000 for Rp 2.000
            $table->boolean('is_taxable')->default(true); // if true, charge is added to tax base
            $table->string('applies_to')->default('all'); // 'all', 'dine_in', 'takeaway', 'delivery'
            $table->boolean('is_auto_apply')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 3. Add charges and tax detail columns to pos_orders
        Schema::table('pos_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_orders', 'charges_amount')) {
                $table->decimal('charges_amount', 12, 2)->default(0)->after('tax_amount');
            }
            if (!Schema::hasColumn('pos_orders', 'charges_detail')) {
                $table->json('charges_detail')->nullable()->after('charges_amount');
            }
            if (!Schema::hasColumn('pos_orders', 'tax_rate')) {
                $table->decimal('tax_rate', 5, 2)->nullable()->after('tax_amount');
            }
            if (!Schema::hasColumn('pos_orders', 'tax_name')) {
                $table->string('tax_name')->nullable()->after('tax_rate');
            }
        });

        // 4. Seed default Tax and Additional Charges
        $now = now();

        DB::table('pos_taxes')->insert([
            [
                'name' => 'PB1 (Pajak Restoran)',
                'code' => 'PB1',
                'rate' => 10.00,
                'type' => 'exclusive',
                'is_auto_apply' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'PPN (Pajak Pertambahan Nilai)',
                'code' => 'PPN',
                'rate' => 11.00,
                'type' => 'exclusive',
                'is_auto_apply' => false,
                'is_active' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);

        DB::table('pos_charges')->insert([
            [
                'name' => 'Biaya Layanan (Service Charge)',
                'type' => 'percent',
                'rate' => 5.00,
                'is_taxable' => true,
                'applies_to' => 'dine_in',
                'is_auto_apply' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Biaya Kemasan (Takeaway)',
                'type' => 'fixed',
                'rate' => 2000.00,
                'is_taxable' => false,
                'applies_to' => 'takeaway',
                'is_auto_apply' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Biaya Antar Internal (Delivery)',
                'type' => 'fixed',
                'rate' => 10000.00,
                'is_taxable' => false,
                'applies_to' => 'delivery',
                'is_auto_apply' => true,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_taxes');
        Schema::dropIfExists('pos_charges');

        Schema::table('pos_orders', function (Blueprint $table) {
            $table->dropColumn(['charges_amount', 'charges_detail', 'tax_rate', 'tax_name']);
        });
    }
};
