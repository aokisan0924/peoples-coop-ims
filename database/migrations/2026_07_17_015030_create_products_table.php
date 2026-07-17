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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique();       // internal SKU, auto-generated if no barcode
            $table->string('barcode')->nullable()->unique(); // scanned/manufacturer barcode
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();

            // Base unit = smallest sellable unit (e.g. "piece")
            $table->foreignId('base_unit_id')->constrained('units');

            // Optional pack selling option
            $table->foreignId('pack_unit_id')->nullable()->constrained('units');
            $table->unsignedInteger('pack_conversion_factor')->nullable(); // e.g. 10 pieces per pack

            $table->decimal('piece_price', 10, 2);
            $table->decimal('pack_price', 10, 2)->nullable();
            $table->decimal('cost_price', 10, 2)->default(0); // last known cost, for reference

            $table->unsignedInteger('low_stock_threshold')->default(0); // in base units
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
