<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Services\StockDeductionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class SaleController extends Controller
{
    public function __construct(private StockDeductionService $stockDeduction)
    {
    }

    public function index(): \Inertia\Response
    {
        return Inertia::render('sales/index', [
            'sales' => Sale::with('cashier')
                ->orderByDesc('created_at')
                ->paginate(30),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_uuid' => ['required', 'uuid'],
            'is_member' => ['required', 'boolean'],
            'payment_method' => ['required', 'in:cash,gcash'],
            'amount_tendered' => ['nullable', 'numeric', 'min:0'],
            'gcash_reference' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.unit_type' => ['required', 'in:piece,pack'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $existing = Sale::where('client_uuid', $validated['client_uuid'])->first();
        if ($existing) {
            return response()->json([
                'success' => true,
                'sale' => $existing->load('items.product', 'cashier'),
                'was_duplicate' => true,
            ]);
        }

        try {
            $sale = DB::transaction(function () use ($validated, $request) {
                $subtotal = 0;
                $lineItemsData = [];

                foreach ($validated['items'] as $item) {
                    $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                    // Determine base-unit quantity + unit price based on piece vs pack
                    if ($item['unit_type'] === 'pack') {
                        if (!$product->pack_conversion_factor) {
                            throw new RuntimeException("\"{$product->name}\" has no pack option configured.");
                        }
                        $baseUnitQty = $item['quantity'] * $product->pack_conversion_factor;
                        $unitPrice = $validated['is_member']
                            ? $product->member_pack_price
                            : $product->non_member_pack_price;
                    } else {
                        $baseUnitQty = $item['quantity'];
                        $unitPrice = $validated['is_member']
                            ? $product->member_piece_price
                            : $product->non_member_piece_price;
                    }

                    // FIFO deduction — throws if insufficient stock, which rolls back the whole transaction
                    $avgCost = $this->stockDeduction->deduct($product, $baseUnitQty);

                    $lineTotal = round($unitPrice * $item['quantity'], 2);
                    $subtotal += $lineTotal;

                    $lineItemsData[] = [
                        'product_id' => $product->id,
                        'unit_type' => $item['unit_type'],
                        'quantity' => $item['quantity'],
                        'base_unit_quantity' => $baseUnitQty,
                        'unit_price' => $unitPrice,
                        'line_total' => $lineTotal,
                        'cost_at_sale' => round($avgCost * $baseUnitQty, 2),
                    ];
                }

                // VAT is already baked into non-member unit prices (see Product::calculatePrice),
                // so we back-calculate the VAT portion here purely for reporting/receipt display.
                $vatAmount = 0;
                if (!$validated['is_member']) {
                    $vatRate = config('pricing.vat_rate') / 100;
                    $vatAmount = round($subtotal - ($subtotal / (1 + $vatRate)), 2);
                }

                $total = $subtotal;
                $changeGiven = null;

                if ($validated['payment_method'] === 'cash') {
                    if (($validated['amount_tendered'] ?? 0) < $total) {
                        throw new RuntimeException('Amount tendered is less than the total.');
                    }
                    $changeGiven = round($validated['amount_tendered'] - $total, 2);
                }

                $sale = Sale::create([
                    'receipt_number' => $this->generateReceiptNumber(),
                    'cashier_id' => $request->user()->id,
                    'is_member' => $validated['is_member'],
                    'subtotal' => $subtotal,
                    'vat_amount' => $vatAmount,
                    'total' => $total,
                    'payment_method' => $validated['payment_method'],
                    'amount_tendered' => $validated['amount_tendered'] ?? null,
                    'change_given' => $changeGiven,
                    'gcash_reference' => $validated['gcash_reference'] ?? null,
                ]);

                foreach ($lineItemsData as $data) {
                    $sale->items()->create($data);
                }

                return $sale;
            });

            return response()->json([
                'success' => true,
                'sale' => $sale->load('items.product', 'cashier'),
            ]);
        } catch (RuntimeException $e) {
            // Business-rule failure (insufficient stock, bad tender amount) — safe to show directly to cashier
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    public function void(Request $request, Sale $sale): RedirectResponse
    {
        if ($sale->voided_at) {
            return back()->withErrors(['sale' => 'This sale has already been voided.']);
        }

        $validated = $request->validate([
            'void_reason' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($sale, $validated, $request) {
            foreach ($sale->items as $item) {
                $unitCost = $item->base_unit_quantity > 0
                    ? (float) $item->cost_at_sale / $item->base_unit_quantity
                    : 0;

                $this->stockDeduction->restore(
                    $item->product_id,
                    $item->base_unit_quantity,
                    $unitCost,
                    $validated['void_reason']
                );
            }

            $sale->update([
                'voided_at' => now(),
                'voided_by' => $request->user()->id,
                'void_reason' => $validated['void_reason'],
            ]);
        });

        return back()->with('success', "Sale {$sale->receipt_number} voided and stock restored.");
    }

    public function show(Sale $sale): Response
    {
        return Inertia::render('pos/receipt', [
            'sale' => $sale->load('items.product', 'cashier'),
        ]);
    }



    /**
     * Collision-safe across concurrent terminals: DB-generated sequence number
     * within today's date, wrapped in a retry-safe unique constraint.
     */
    private function generateReceiptNumber(): string
    {
        $prefix = 'PC-' . now()->format('Ymd') . '-';

        $lastNumber = Sale::where('receipt_number', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByDesc('receipt_number')
            ->value('receipt_number');

        $nextSeq = $lastNumber
            ? ((int) substr($lastNumber, -4)) + 1
            : 1;

        return $prefix . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);
    }
}
