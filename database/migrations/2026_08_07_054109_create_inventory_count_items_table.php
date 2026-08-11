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
        Schema::create('inventory_count_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_count_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->integer('expected_qty'); // what the system thought was on the shelf, snapshotted when this item was added
            $table->integer('counted_qty'); // what was physically counted
            $table->integer('variance'); // counted_qty - expected_qty; negative = shrinkage, positive = found extra
            $table->decimal('unit_cost_at_count', 10, 2); // product's cost_price at time of count, for valuing the adjustment
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_count_items');
    }
};
