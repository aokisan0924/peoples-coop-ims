<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('stock_batches', 'location_id')) {
            Schema::table('stock_batches', function (Blueprint $table) {
                $table->foreignId('location_id')->nullable()->after('product_id')->constrained();
            });
        }

        // Add the new composite index FIRST, so the product_id foreign key
        // always has a covering index — MySQL won't allow dropping the old
        // one otherwise (error 1553).
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->index(['product_id', 'location_id', 'received_date'], 'stock_batches_product_location_date_index');
        });

        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropIndex(['product_id', 'received_date']);
        });
    }

    public function down(): void
    {
        Schema::table('stock_batches', function (Blueprint $table) {
            $table->index(['product_id', 'received_date']);
        });

        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropIndex('stock_batches_product_location_date_index');
        });

        Schema::table('stock_batches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });
    }
};
