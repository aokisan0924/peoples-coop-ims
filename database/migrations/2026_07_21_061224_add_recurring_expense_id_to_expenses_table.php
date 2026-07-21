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
        Schema::table('expenses', function (Blueprint $table) {
            // Null for manually-recorded expenses; set only when auto-generated
            // from a recurring template by RecurringExpenseController.
            $table->foreignId('recurring_expense_id')->nullable()->after('supplier_id')
                ->constrained('recurring_expenses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_expense_id');
        });
    }
};
