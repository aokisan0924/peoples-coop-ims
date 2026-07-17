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
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['piece_price', 'pack_price']);
            $table->decimal('markup_percentage', 5, 2)->default(18.00)->after('cost_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('piece_price', 10, 2)->after('cost_price');
            $table->decimal('pack_price', 10, 2)->nullable()->after('piece_price');
            $table->dropColumn('markup_percentage');
        });
    }
};
