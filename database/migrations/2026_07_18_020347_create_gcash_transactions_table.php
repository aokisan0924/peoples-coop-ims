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
        Schema::create('gcash_transactions', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['cash_in', 'cash_out', 'float_adjustment']);
            $table->decimal('amount', 12, 2); // the GCash amount transacted (not including fee)
            $table->decimal('fee', 10, 2)->default(0); // service fee charged to customer, kept as store revenue
            $table->string('customer_name')->nullable();
            $table->string('reference_number')->nullable(); // GCash app reference number
            $table->foreignId('cashier_id')->constrained('users');
            $table->decimal('float_balance_after', 12, 2); // snapshot for audit trail
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gcash_transactions');
    }
};
