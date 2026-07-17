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
        Schema::create('stock_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();

            $table->unsignedInteger('received_qty');   // original batch qty, in base units
            $table->unsignedInteger('remaining_qty');  // decremented as sold, FIFO order
            $table->decimal('cost_price', 10, 2);       // cost per base unit for this batch

            $table->date('received_date');
            $table->date('expiry_date')->nullable();

            $table->timestamps();

            $table->index(['product_id', 'received_date']); // speeds up FIFO ordering
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_batches');
    }
};
