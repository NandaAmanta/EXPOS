<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->index()->default('default-tenant');
            $table->foreignUuid('outlet_id')->constrained('pos_outlets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('starting_cash', 15, 2)->default(0);
            $table->decimal('expected_cash', 15, 2)->nullable();
            $table->decimal('actual_cash', 15, 2)->nullable();
            $table->decimal('difference', 15, 2)->nullable();
            $table->enum('status', ['open', 'closed'])->default('open')->index();
            $table->text('notes')->nullable();
            $table->timestamp('opened_at');
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_shifts');
    }
};
