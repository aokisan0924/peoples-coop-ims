<?php

namespace App\Models;

use Database\Factories\ShiftSessionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property array<int, array{denomination: float, count: int}>|null $cash_breakdown
 * @property Carbon $opened_at
 * @property Carbon|null $closed_at
 */
class ShiftSession extends Model
{
    /** @use HasFactory<ShiftSessionFactory> */
    use HasFactory;

    protected $fillable = [
        'cashier_id', 'location_id', 'starting_cash', 'expected_cash', 'actual_cash',
        'cash_breakdown', 'variance', 'status', 'opened_at', 'closed_at', 'notes',
    ];

    protected function casts(): array
    {
        return [
            'starting_cash' => 'decimal:2',
            'expected_cash' => 'decimal:2',
            'actual_cash' => 'decimal:2',
            'cash_breakdown' => 'array',
            'variance' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
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
