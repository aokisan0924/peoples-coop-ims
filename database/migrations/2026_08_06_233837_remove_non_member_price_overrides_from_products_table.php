<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Non-member price is always member price + VAT — it's never set
     * independently, so a separate override for it doesn't make sense and
     * could contradict the member price if someone filled in both.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'non_member_piece_price_override')) {
                $table->dropColumn('non_member_piece_price_override');
            }
            if (Schema::hasColumn('products', 'non_member_pack_price_override')) {
                $table->dropColumn('non_member_pack_price_override');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('non_member_piece_price_override', 10, 2)->nullable()->after('member_piece_price_override');
            $table->decimal('non_member_pack_price_override', 10, 2)->nullable()->after('member_pack_price_override');
        });
    }
};
