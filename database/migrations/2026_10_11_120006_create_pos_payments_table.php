<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('pos_orders')->cascadeOnDelete();
            $table->string('payment_method'); // CASH, QRIS, DEBIT, TRANSFER
            $table->decimal('amount', 15, 2);
            $table->decimal('change_amount', 15, 2)->default(0);
            $table->string('reference_number')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_payments');
    }
};
