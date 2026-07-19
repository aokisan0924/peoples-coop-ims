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
        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained();
            $table->foreignId('from_location_id')->constrained('locations');
            $table->foreignId('to_location_id')->constrained('locations');
            $table->unsignedInteger('quantity'); // in base units
            $table->decimal('cost_price', 10, 2); // FIFO avg cost captured at time of shipping
            $table->enum('status', ['in_transit', 'received', 'cancelled'])->default('in_transit');
            $table->foreignId('initiated_by')->constrained('users');
            $table->foreignId('received_by')->nullable()->constrained('users');
            $table->timestamp('initiated_at');
            $table->timestamp('received_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_transfers');
    }
};
