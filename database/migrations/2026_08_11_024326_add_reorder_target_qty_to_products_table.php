<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The low-stock threshold alone only tells you THAT something is low —
     * it doesn't say how much to buy. This adds the target level to restock
     * up to, so the system can show a concrete "buy X more" number instead
     * of just a warning.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('reorder_target_qty')->nullable()->after('low_stock_threshold');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('reorder_target_qty');
        });
    }
};
