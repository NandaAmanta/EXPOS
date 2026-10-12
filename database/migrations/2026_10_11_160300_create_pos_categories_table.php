<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->foreignUuid('outlet_id')->nullable()->constrained('pos_outlets')->nullOnDelete();
            $table->string('name')->index();
            $table->string('slug')->nullable()->index();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('pos_products', function (Blueprint $table) {
            $table->foreignUuid('category_id')->nullable()->after('category')->constrained('pos_categories')->nullOnDelete();
        });

        // Seed existing categories from pos_products
        $existingCategories = DB::table('pos_products')
            ->whereNotNull('category')
            ->distinct()
            ->pluck('category');

        foreach ($existingCategories as $catName) {
            $trimmed = trim($catName);
            if (empty($trimmed)) continue;

            $catId = Str::uuid()->toString();
            DB::table('pos_categories')->insert([
                'id' => $catId,
                'tenant_id' => 'tenant-uuid-001',
                'name' => $trimmed,
                'slug' => Str::slug($trimmed),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('pos_products')
                ->where('category', $catName)
                ->update(['category_id' => $catId]);
        }
    }

    public function down(): void
    {
        Schema::table('pos_products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });

        Schema::dropIfExists('pos_categories');
    }
};
