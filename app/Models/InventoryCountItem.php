<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCountItem extends Model
{
    protected $fillable = ['inventory_count_id', 'product_id', 'expected_qty', 'counted_qty', 'variance', 'unit_cost_at_count'];

    protected function casts(): array
    {
        return ['unit_cost_at_count' => 'decimal:2'];
    }

    public function inventoryCount(): BelongsTo
    {
        return $this->belongsTo(InventoryCount::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
