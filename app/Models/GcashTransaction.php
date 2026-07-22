<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property-read float $total_cash_in Only present on selectRaw() aggregate results (GcashController::index())
 * @property-read float $total_cash_out Only present on selectRaw() aggregate results (GcashController::index())
 * @property-read float $total_fees Only present on selectRaw() aggregate results (GcashController::index())
 * @property-read int $transaction_count Only present on selectRaw() aggregate results (GcashController::index())
 * @property-read float $cash_in Only present on selectRaw() aggregate results (DashboardController::gcashOverview())
 * @property-read float $cash_out Only present on selectRaw() aggregate results (DashboardController::gcashOverview())
 */
class GcashTransaction extends Model
{
    protected $fillable = [
        'type', 'amount', 'fee', 'customer_name', 'reference_number',
        'cashier_id', 'location_id', 'float_balance_after', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'fee' => 'decimal:2',
            'float_balance_after' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }
}
