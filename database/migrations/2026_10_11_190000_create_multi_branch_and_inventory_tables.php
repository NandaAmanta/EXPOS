<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add receipt header & footer to pos_outlets if not yet present
        Schema::table('pos_outlets', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_outlets', 'receipt_header')) {
                $table->text('receipt_header')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('pos_outlets', 'receipt_footer')) {
                $table->text('receipt_footer')->nullable()->after('receipt_header');
            }
        });

        // 2. Pivot User to Outlets (Multi-Branch Access Assignment)
        Schema::create('user_outlets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->boolean('is_primary')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'outlet_id']);
        });

        // 3. Master Ingredients / Bahan Baku
        Schema::create('pos_ingredients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('category')->default('General')->index();
            $table->string('unit')->default('gram'); // gram, ml, pcs, portion
            $table->decimal('cost_per_unit', 15, 2)->default(0); // HPP per satuan terkecil
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Branch Ingredient Stocks (Stok Bahan Baku per Cabang)
        Schema::create('pos_ingredient_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->foreignUuid('ingredient_id')->constrained('pos_ingredients')->cascadeOnDelete();
            $table->decimal('current_stock', 14, 3)->default(0); // Mendukung desimal pecahan
            $table->decimal('min_stock_alert', 14, 3)->default(100);
            $table->timestamps();

            $table->unique(['outlet_id', 'ingredient_id']);
        });

        // 5. Product Recipes / Bill of Materials (BOM)
        Schema::create('pos_recipes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->constrained('pos_products')->cascadeOnDelete();
            $table->string('variant_name')->nullable()->index(); // Nullable: berlaku untuk semua varian jika null
            $table->foreignUuid('ingredient_id')->constrained('pos_ingredients')->cascadeOnDelete();
            $table->decimal('quantity', 10, 3); // Jumlah takaran bahan
            $table->string('unit')->default('gram');
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        // 6. Branch Product Stocks (Stok Barang Jadi Retail per Cabang)
        Schema::create('pos_product_stocks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('pos_products')->cascadeOnDelete();
            $table->integer('current_stock')->default(0);
            $table->integer('min_stock_alert')->default(5);
            $table->decimal('price_override', 15, 2)->nullable();
            $table->timestamps();

            $table->unique(['outlet_id', 'product_id']);
        });

        // 7. Stock Movements (Kartu Stok / Buku Besar Mutasi Inventaris)
        Schema::create('pos_stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->enum('item_type', ['ingredient', 'product'])->index();
            $table->uuid('item_id')->index();
            $table->enum('type', ['sale', 'purchase', 'transfer_in', 'transfer_out', 'adjustment', 'waste'])->index();
            $table->decimal('quantity', 14, 3); // Positif = Tambah, Negatif = Berkurang
            $table->decimal('balance_before', 14, 3)->default(0);
            $table->decimal('balance_after', 14, 3)->default(0);
            $table->string('reference_id')->nullable()->index(); // Order ID / PO Number
            $table->string('reference_type')->nullable(); // 'pos_order', 'purchase_order', dll
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_stock_movements');
        Schema::dropIfExists('pos_product_stocks');
        Schema::dropIfExists('pos_recipes');
        Schema::dropIfExists('pos_ingredient_stocks');
        Schema::dropIfExists('pos_ingredients');
        Schema::dropIfExists('user_outlets');

        Schema::table('pos_outlets', function (Blueprint $table) {
            $table->dropColumn(['receipt_header', 'receipt_footer']);
        });
    }
};
