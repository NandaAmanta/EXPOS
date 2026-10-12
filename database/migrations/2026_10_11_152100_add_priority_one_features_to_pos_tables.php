<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Petty cash (Cash In / Cash Out) movements table
        Schema::create('pos_cash_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->foreignUuid('shift_id')->nullable()->constrained('pos_shifts')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['in', 'out'])->index();
            $table->decimal('amount', 15, 2);
            $table->string('reason');
            $table->timestamps();
        });

        // 2. Add order_type, table_number, notes to pos_orders
        Schema::table('pos_orders', function (Blueprint $table) {
            $table->string('order_type')->default('dine_in')->after('order_number'); // dine_in, takeaway, delivery
            $table->string('table_number')->nullable()->after('order_type');
            $table->text('notes')->nullable()->after('table_number');
        });

        // 3. Add variants to pos_products
        Schema::table('pos_products', function (Blueprint $table) {
            $table->json('variants')->nullable()->after('price');
        });

        // 4. Add selected_variant & notes to pos_order_items
        Schema::table('pos_order_items', function (Blueprint $table) {
            $table->string('selected_variant')->nullable()->after('product_name');
            $table->string('notes')->nullable()->after('selected_variant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_cash_movements');

        Schema::table('pos_orders', function (Blueprint $table) {
            $table->dropColumn(['order_type', 'table_number', 'notes']);
        });

        Schema::table('pos_products', function (Blueprint $table) {
            $table->dropColumn('variants');
        });

        Schema::table('pos_order_items', function (Blueprint $table) {
            $table->dropColumn(['selected_variant', 'notes']);
        });
    }
};
