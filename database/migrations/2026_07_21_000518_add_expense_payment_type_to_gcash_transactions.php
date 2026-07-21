<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE gcash_transactions MODIFY COLUMN type ENUM('cash_in', 'cash_out', 'float_adjustment', 'expense_payment') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE gcash_transactions MODIFY COLUMN type ENUM('cash_in', 'cash_out', 'float_adjustment') NOT NULL");
    }
};
