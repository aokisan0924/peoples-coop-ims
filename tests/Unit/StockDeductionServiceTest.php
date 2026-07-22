<?php

namespace Tests\Unit;

use App\Models\Location;
use App\Models\Product;
use App\Models\StockBatch;
use App\Services\StockDeductionService;
use RuntimeException;
use Tests\TestCase;

class StockDeductionServiceTest extends TestCase
{
    private StockDeductionService $service;

    private int $locationId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new StockDeductionService;
        $this->locationId = Location::factory()->create()->id;
    }

    public function test_deducts_from_oldest_batch_first(): void
    {
        $product = Product::factory()->create();

        $oldBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        $newBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 15.00,
            'received_date' => now()->subDays(2),
        ]);

        $this->service->deduct($product, 15, $this->locationId);

        $oldBatch->refresh();
        $newBatch->refresh();

        $this->assertEquals(5, $oldBatch->remaining_qty);
        $this->assertEquals(20, $newBatch->remaining_qty);
    }

    public function test_spans_multiple_batches_when_oldest_is_insufficient(): void
    {
        $product = Product::factory()->create();

        $oldBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        $newBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 15.00,
            'received_date' => now()->subDays(2),
        ]);

        $this->service->deduct($product, 15, $this->locationId);

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
            'location_id' => $this->locationId,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'cost_price' => 10.00,
            'received_date' => now()->subDays(10),
        ]);

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 20,
            'remaining_qty' => 20,
            'cost_price' => 20.00,
            'received_date' => now()->subDays(2),
        ]);

        $avgCost = $this->service->deduct($product, 15, $this->locationId);

        $this->assertEqualsWithDelta(13.33, $avgCost, 0.01);
    }

    public function test_throws_when_insufficient_stock_across_all_batches(): void
    {
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 5,
            'remaining_qty' => 5,
            'received_date' => now(),
        ]);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/short by 10/');

        $this->service->deduct($product, 15, $this->locationId);
    }

    public function test_ignores_fully_depleted_batches(): void
    {
        $product = Product::factory()->create();

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 10,
            'remaining_qty' => 0,
            'received_date' => now()->subDays(10),
        ]);

        $freshBatch = StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $this->locationId,
            'received_qty' => 10,
            'remaining_qty' => 10,
            'received_date' => now(),
        ]);

        $this->service->deduct($product, 5, $this->locationId);

        $freshBatch->refresh();
        $this->assertEquals(5, $freshBatch->remaining_qty);
    }

    public function test_ignores_batches_from_other_locations(): void
    {
        $product = Product::factory()->create();
        $otherLocationId = Location::factory()->create()->id;

        StockBatch::factory()->create([
            'product_id' => $product->id,
            'location_id' => $otherLocationId,
            'received_qty' => 50,
            'remaining_qty' => 50,
            'received_date' => now()->subDays(10),
        ]);

        $this->expectException(RuntimeException::class);

        $this->service->deduct($product, 5, $this->locationId);
    }

    public function test_restore_creates_a_new_batch_at_the_correct_location(): void
    {
        $product = Product::factory()->create();

        $this->service->restore($product->id, 20, 12.50, 'Test void', $this->locationId);

        $batch = StockBatch::where('product_id', $product->id)->first();

        $this->assertNotNull($batch);
        $this->assertEquals($this->locationId, $batch->location_id);
        $this->assertEquals(20, $batch->remaining_qty);
        $this->assertEquals(20, $batch->received_qty);
        $this->assertEquals(12.50, $batch->cost_price);
        $this->assertNull($batch->supplier_id);
    }
}
