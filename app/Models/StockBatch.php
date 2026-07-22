<?php

namespace App\Models;

use Database\Factories\StockBatchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property Carbon $received_date
 * @property Carbon|null $expiry_date
 */
class StockBatch extends Model
{
    /** @use HasFactory<StockBatchFactory> */
    use HasFactory;

    protected $fillable = [
        'product_id', 'location_id', 'supplier_id', 'received_qty', 'remaining_qty',
        'cost_price', 'received_date', 'expiry_date',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'received_date' => 'date',
            'expiry_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
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
}
