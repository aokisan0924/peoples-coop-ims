<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'sku', 'barcode', 'category_id',
        'base_unit_id', 'pack_unit_id', 'pack_conversion_factor',
        'cost_price', 'markup_percentage',
        'low_stock_threshold', 'is_active',
    ];

    protected function casts(): array {
        return [
            'cost_price' => 'decimal:2',
            'markup_percentage' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo {
        return $this->belongsTo(Category::class);
    }

    public function baseUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

        public function packUnit(): BelongsTo {
        return $this->belongsTo(Unit::class, 'pack_unit_id');
    }

    public function stockBatches(): HasMany {
        return $this->hasMany(StockBatch::class);
    }

    // Total stock on hand, summed across all FIFO batches, in base units
    public function getTotalStockAttribute(): int {
        return $this->stockBatches()->sum('remaining_qty');
    }

    public function totalStockAt(int $locationId): int
    {
        return $this->stockBatches()->where('location_id', $locationId)->sum('remaining_qty');
    }

    public function getIsLowStockAttribute(): bool {
        return $this->total_stock <= $this->low_stock_threshold;
    }

    /**
     * Core pricing calculation, reused for piece and pack, member and non-member.
     */
    public function calculatePrice(float $baseCost, bool $isMember = true): float {
        $markup = (float) ($this->markup_percentage ?? config('pricing.default_markup'));
        $memberPrice = $baseCost * (1 + $markup / 100);

        if ($isMember) {
            return round($memberPrice, 2);
        }

        $vatRate = config('pricing.vat_rate');
        return round($memberPrice * (1 + $vatRate / 100), 2);
    }

    public function getMemberPiecePriceAttribute(): float {
        return $this->calculatePrice((float) $this->cost_price, isMember: true);
    }

    public function getNonMemberPiecePriceAttribute(): float {
        return $this->calculatePrice((float) $this->cost_price, isMember: false);
    }

    public function getMemberPackPriceAttribute(): ?float {
        if (!$this->pack_conversion_factor) {
            return null;
        }

        $packCost = (float) $this->cost_price * $this->pack_conversion_factor;
        return $this->calculatePrice($packCost, isMember: true);
    }

    public function getNonMemberPackPriceAttribute(): ?float {
        if (!$this->pack_conversion_factor) {
            return null;
        }

        $packCost = (float) $this->cost_price * $this->pack_conversion_factor;
        return $this->calculatePrice($packCost, isMember: false);
    }
}
