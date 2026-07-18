<?php

namespace Tests\Unit;

use App\Models\Product;
use App\Models\StockBatch;
use App\Services\StockDeductionService;
use RuntimeException;
use Tests\TestCase;

class StockDeductionServiceTest extends TestCase
{
    private StockDeductionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new StockDeductionService();
    }

    public function test_deducts_from_oldest_batch_first(): void
    {
        $product = Product::factory()->create();

        $oldBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        $newBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 15.00, // different cost, so we can tell which batch was actually consumed
            'received_date' => now()->subDays(2),
        ]);

        $this->service->deduct($product, 15);

        $oldBatch->refresh();
        $newBatch->refresh();

        // The older batch should be depleted first (20 - 15 = 5 remaining)
        $this->assertEquals(5, $oldBatch->remaining_qty);
        // The newer batch should be untouched
        $this->assertEquals(20, $newBatch->remaining_qty);
    }

    public function test_spans_multiple_batches_when_oldest_is_insufficient(): void
    {
        $product = Product::factory()->create();

        $oldBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        $newBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 15.00,
            'received_date' => now()->subDays(2),
        ]);

        // Deduct 15 — should fully consume the old batch (10) and take 5 from the new one
        $this->service->deduct($product, 15);

        $oldBatch->refresh();
        $newBatch->refresh();

        $this->assertEquals(0, $oldBatch->remaining_qty);
        $this->assertEquals(15, $newBatch->remaining_qty);
    }

    public function test_returns_weighted_average_cost_of_units_consumed(): void
    {
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 20.00,
            'received_date' => now()->subDays(2),
        ]);

        // Deduct 15: 10 units @ ₱10 + 5 units @ ₱20 = ₱100 + ₱100 = ₱200 total / 15 units = ₱13.33 avg
        $avgCost = $this->service->deduct($product, 15);

        $this->assertEqualsWithDelta(13.33, $avgCost, 0.01);
    }

    public function test_throws_when_insufficient_stock_across_all_batches(): void
    {
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 5,
            'remaining_qty' => 5,
            'received_date' => now(),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/short by 10/');

        $this->service->deduct($product, 15); // only 5 available, asking for 15
    }

    public function test_ignores_fully_depleted_batches(): void
    {
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 10,
            'remaining_qty' => 0, // already fully sold
            'received_date' => now()->subDays(10),
        ]);

        $freshBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'received_date' => now(),
        ]);

        $this->service->deduct($product, 5);

        $freshBatch->refresh();
        $this->assertEquals(5, $freshBatch->remaining_qty);
    }

    public function test_restore_creates_a_new_batch_rather_than_reversing_old_ones(): void
    {
        $product = Product::factory()->create();

        $this->service->restore($product->id, 20, 12.50, 'Test void');

        $batch = StockBatch::where('product_id', $product->id)->first();

        $this->assertNotNull($batch);
        $this->assertEquals(20, $batch->remaining_qty);
        $this->assertEquals(20, $batch->received_qty);
        $this->assertEquals(12.50, $batch->cost_price);
        $this->assertNull($batch->supplier_id); // restored stock has no supplier
    }
}
