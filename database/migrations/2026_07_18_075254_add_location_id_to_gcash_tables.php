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
        Schema::table('gcash_float', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('id')->constrained();
        });

        Schema::table('gcash_transactions', function (Blueprint $table) {
            $table->foreignId('location_id')->nullable()->after('id')->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gcash_float', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });

        Schema::table('gcash_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_id');
        });
    }
};
