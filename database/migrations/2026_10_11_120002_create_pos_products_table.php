<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->foreignUuid('outlet_id')->nullable()->constrained('pos_outlets')->nullOnDelete();
            $table->string('sku')->index();
            $table->string('barcode')->nullable()->index();
            $table->string('name');
            $table->string('category')->default('General')->index();
            $table->decimal('price', 15, 2);
            $table->decimal('cost_price', 15, 2)->default(0);
            $table->integer('stock')->default(0);
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_products');
    }
};
