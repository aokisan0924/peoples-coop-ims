<?php

namespace App\Http\Controllers;

use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GcashController extends Controller
{
    public function index(): Response
    {
        $float = GcashFloat::first();
        $today = Carbon::today();

        $todayStats = GcashTransaction::whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) as total_cash_in,
                COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0) as total_cash_out,
                COALESCE(SUM(fee), 0) as total_fees,
                COUNT(*) as transaction_count
            ")
            ->first();

        return Inertia::render('gcash/index', [
            'floatBalance' => (float) $float->balance,
            'todayStats' => [
                'total_cash_in' => (float) $todayStats->total_cash_in,
                'total_cash_out' => (float) $todayStats->total_cash_out,
                'total_fees' => (float) $todayStats->total_fees,
                'transaction_count' => (int) $todayStats->transaction_count,
            ],
            'recentTransactions' => GcashTransaction::with('cashier')
                ->orderByDesc('created_at')
                ->limit(30)
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:cash_in,cash_out'],
            'amount' => ['required', 'numeric', 'min:1'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            // Lock the float row so concurrent terminals can't both read the same
            // stale balance and both succeed, corrupting the running total.
            $float = GcashFloat::lockForUpdate()->first();

            $amount = $validated['amount'];
            $fee = $validated['fee'] ?? 0;

            // Cash-In: customer's cash comes in, our GCash goes out to them → float decreases.
            // Cash-Out: customer's GCash comes in to us, our cash goes out to them → float increases.
            $delta = $validated['type'] === 'cash_in' ? -$amount : $amount;
            $newBalance = (float) $float->balance + $delta;

            if ($validated['type'] === 'cash_in' && $newBalance < 0) {
                throw new \RuntimeException('Insufficient GCash float for this Cash-In. Current float: ₱' . number_format($float->balance, 2));
            }

            $float->update(['balance' => $newBalance]);

            GcashTransaction::create([
                'type' => $validated['type'],
                'amount' => $amount,
                'fee' => $fee,
                'customer_name' => $validated['customer_name'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
                'cashier_id' => $request->user()->id,
                'float_balance_after' => $newBalance,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'GCash transaction recorded.');
    }

    /**
     * Manager-only: reconcile the system's tracked float against the actual
     * GCash app balance (e.g. after loading more funds, or correcting drift).
     */
    public function adjustFloat(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'new_balance' => ['required', 'numeric', 'min:0'],
            'notes' => ['required', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $request) {
            $float = GcashFloat::lockForUpdate()->first();
            $oldBalance = (float) $float->balance;
            $adjustment = $validated['new_balance'] - $oldBalance;

            $float->update(['balance' => $validated['new_balance']]);

            GcashTransaction::create([
                'type' => 'float_adjustment',
                'amount' => abs($adjustment),
                'fee' => 0,
                'customer_name' => null,
                'reference_number' => null,
                'cashier_id' => $request->user()->id,
                'float_balance_after' => $validated['new_balance'],
                'notes' => $validated['notes'] . ' (Adjusted by ' . ($adjustment >= 0 ? '+' : '') . number_format($adjustment, 2) . ')',
            ]);
        });

        return back()->with('success', 'Float balance reconciled.');
    }
}
