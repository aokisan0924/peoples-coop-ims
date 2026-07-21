<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Collapse any pre-existing duplicates before the constraint is added —
        // keeps the lowest id per location, merges the rest of the balance into
        // it (so no money silently vanishes), then removes the extras.
        $duplicateLocationIds = DB::table('gcash_float')
            ->whereNotNull('location_id')
            ->select('location_id')
            ->groupBy('location_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('location_id');

        foreach ($duplicateLocationIds as $locationId) {
            $rows = DB::table('gcash_float')->where('location_id', $locationId)->orderBy('id')->get();
            $keeper = $rows->first();
            $mergedBalance = $rows->sum('balance');

            DB::table('gcash_float')->where('id', $keeper->id)->update(['balance' => $mergedBalance]);
            DB::table('gcash_float')->where('location_id', $locationId)->where('id', '!=', $keeper->id)->delete();
        }

        Schema::table('gcash_float', function (Blueprint $table) {
            $table->unique('location_id');
        });
    }

    public function down(): void
    {
        Schema::table('gcash_float', function (Blueprint $table) {
            $table->dropUnique(['location_id']);
        });
    }
};
