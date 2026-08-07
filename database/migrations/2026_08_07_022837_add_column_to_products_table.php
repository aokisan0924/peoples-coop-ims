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
            // Many products (e.g. a Jack 'n Jill Presto piece vs its box) have a
            // completely different barcode printed on the pack than on the piece —
            // 'barcode' above is the piece/base-unit barcode; this is the pack one.
            $table->string('pack_barcode')->nullable()->unique()->after('barcode');
            // Selling price is normally computed from cost_price * markup_percentage,
            // but that formula doesn't hold for every item (e.g. a ₱4-cost item that
            // actually needs to sell at a flat ₱9 for change-making/rounding reasons).
            // When an override is set, it wins over the formula; leave blank to keep
            // using the automatic markup calculation as before.
            $table->decimal('member_piece_price_override', 10, 2)->nullable()->after('markup_percentage');
            $table->decimal('member_pack_price_override', 10, 2)->nullable()->after('member_piece_price_override');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'pack_barcode',
                'member_piece_price_override',
                'member_pack_price_override',
            ]);
        });
    }
};
