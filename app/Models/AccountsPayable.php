<?php

namespace App\Models;

use Database\Factories\AccountsPayableFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $incurred_date
 * @property Carbon|null $due_date
 * @property Carbon|null $paid_at
 * @property-read float $total Only present on selectRaw() aggregate query results (DashboardController::payablesSummary())
 * @property-read int $count Only present on selectRaw() aggregate query results (DashboardController::payablesSummary())
 */
class AccountsPayable extends Model
{
    /** @use HasFactory<AccountsPayableFactory> */
    use HasFactory;

    protected $fillable = [
        'supplier_id', 'location_id', 'stock_batch_id', 'amount', 'incurred_date',
        'due_date', 'is_paid', 'paid_at', 'payment_method', 'recorded_by', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'incurred_date' => 'date',
            'due_date' => 'date',
            'is_paid' => 'boolean',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Supplier, $this>
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * @return BelongsTo<StockBatch, $this>
     */
    public function stockBatch(): BelongsTo
    {
        return $this->belongsTo(StockBatch::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
