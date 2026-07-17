<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique(); // human-readable, e.g. PC-20260717-0001
            $table->foreignId('cashier_id')->constrained('users');
            $table->boolean('is_member')->default(true); // determines pricing tier used
            $table->decimal('subtotal', 10, 2);
            $table->decimal('vat_amount', 10, 2)->default(0); // 0 if member, 12% if non-member
            $table->decimal('total', 10, 2);
            $table->enum('payment_method', ['cash', 'gcash'])->default('cash');
            $table->decimal('amount_tendered', 10, 2)->nullable(); // for cash, to compute change
            $table->decimal('change_given', 10, 2)->nullable();
            $table->string('gcash_reference')->nullable(); // reference number if paid via GCash
            $table->timestamp('voided_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
