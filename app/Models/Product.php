<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = [
        'name', 'sku', 'barcode', 'pack_barcode', 'category_id',
        'base_unit_id', 'pack_unit_id', 'pack_conversion_factor',
        'cost_price', 'markup_percentage',
        'member_piece_price_override', 'member_pack_price_override',
        'low_stock_threshold', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'markup_percentage' => 'decimal:2',
            'member_piece_price_override' => 'decimal:2',
            'member_pack_price_override' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function packUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'pack_unit_id');
    }

    /**
     * @return HasMany<StockBatch, $this>
     */
    public function stockBatches(): HasMany
    {
        return $this->hasMany(StockBatch::class);
    }

    /**
     * @return HasMany<SaleItem, $this>
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    // Total stock on hand, summed across all FIFO batches, in base units
    public function getTotalStockAttribute(): int
    {
        return (int) $this->stockBatches()->sum('remaining_qty');
    }

    public function totalStockAt(int $locationId): int
    {
        return (int) $this->stockBatches()->where('location_id', $locationId)->sum('remaining_qty');
    }

    public function getIsLowStockAttribute(): bool
    {
        return $this->total_stock <= $this->low_stock_threshold;
    }

    /**
     * Core pricing calculation, reused for piece and pack, member and non-member.
     */
    public function calculatePrice(float $baseCost, bool $isMember = true): float
    {
        $markup = (float) ($this->markup_percentage ?? config('pricing.default_markup'));
        $memberPrice = $baseCost * (1 + $markup / 100);

        if ($isMember) {
            return round($memberPrice, 2);
        }

        $vatRate = config('pricing.vat_rate');

        return round($memberPrice * (1 + $vatRate / 100), 2);
    }

    public function getMemberPiecePriceAttribute(): float
    {
        if ($this->member_piece_price_override !== null) {
            return (float) $this->member_piece_price_override;
        }

        return $this->calculatePrice((float) $this->cost_price, isMember: true);
    }

    // Non-member price is never set independently — it's always the member
    // price plus VAT, whether that member price came from the markup formula
    // or from a manual override above.
    public function getNonMemberPiecePriceAttribute(): float
    {
        $vatRate = config('pricing.vat_rate');

        return round($this->member_piece_price * (1 + $vatRate / 100), 2);
    }

    public function getMemberPackPriceAttribute(): ?float
    {
        if (! $this->pack_conversion_factor) {
            return null;
        }

        if ($this->member_pack_price_override !== null) {
            return (float) $this->member_pack_price_override;
        }

        $packCost = (float) $this->cost_price * $this->pack_conversion_factor;

        return $this->calculatePrice($packCost, isMember: true);
    }

    public function getNonMemberPackPriceAttribute(): ?float
    {
        if (! $this->pack_conversion_factor) {
            return null;
        }

        $vatRate = config('pricing.vat_rate');

        return round($this->member_pack_price * (1 + $vatRate / 100), 2);
    }
}
