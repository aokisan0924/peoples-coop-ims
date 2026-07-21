<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\Expense;
use App\Models\GcashTransaction;
use App\Models\Sale;
use App\Models\ShiftSession;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ShiftSessionController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $shift = ShiftSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->first();

        return response()->json(['shift' => $shift]);
    }

    public function open(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (!$user->location_id) {
            return back()->withErrors(['location' => 'Your account has no assigned branch.']);
        }

        $existing = ShiftSession::where('cashier_id', $user->id)->where('status', 'open')->first();
        if ($existing) {
            return back()->withErrors(['shift' => 'You already have an open shift. Close it before starting a new one.']);
        }

        $validated = $request->validate([
            'starting_cash' => ['required', 'numeric', 'min:0'],
        ]);

        ShiftSession::create([
            'cashier_id' => $user->id,
            'location_id' => $user->location_id,
            'starting_cash' => $validated['starting_cash'],
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return back()->with('success', 'Shift started.');
    }

    public function summary(Request $request, ShiftSession $shift): Response
    {
        if ($shift->cashier_id !== $request->user()->id && !$request->user()->seesAllLocations()) {
            abort(403);
        }

        return Inertia::render('shifts/summary', [
            'shift' => $shift->load('cashier', 'location'),
        ]);
    }

    /**
     * Read-only preview of what the shift's expected cash total is right now —
     * lets the close-shift modal show a live short/over indicator while the
     * cashier is still counting, using the exact same math close() will use.
     */
    public function expectedCash(Request $request, ShiftSession $shift): JsonResponse
    {
        if ($shift->cashier_id !== $request->user()->id) {
            abort(403);
        }

        if ($shift->status !== 'open') {
            return response()->json(['expected_cash' => (float) $shift->expected_cash, 'cash_paid_out' => 0]);
        }

        $asOf = now();

        return response()->json([
            'expected_cash' => round($this->calculateExpectedCash($shift, $asOf), 2),
            'cash_paid_out' => round($this->calculateCashPaidOut($shift, $asOf), 2),
        ]);
    }

    public function close(Request $request, ShiftSession $shift): RedirectResponse
    {
        if ($shift->cashier_id !== $request->user()->id) {
            abort(403);
        }

        if ($shift->status !== 'open') {
            return back()->withErrors(['shift' => 'This shift is already closed.']);
        }

        $validated = $request->validate([
            'breakdown' => ['required', 'array', 'min:1'],
            'breakdown.*.denomination' => ['required', 'numeric', 'min:0.01'],
            'breakdown.*.count' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($shift, $validated) {
            $closedAt = now();
            $expectedCash = $this->calculateExpectedCash($shift, $closedAt);

            $actualCash = collect($validated['breakdown'])
                ->sum(fn (array $row) => $row['denomination'] * $row['count']);

            $variance = round($actualCash - $expectedCash, 2);

            $shift->update([
                'expected_cash' => round($expectedCash, 2),
                'actual_cash' => round($actualCash, 2),
                'cash_breakdown' => $validated['breakdown'],
                'variance' => $variance,
                'status' => 'closed',
                'closed_at' => $closedAt,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()->route('shifts.summary', $shift)->with('success', 'Shift closed.');
    }

    private function calculateExpectedCash(ShiftSession $shift, CarbonInterface $asOf): float
    {
        $cashSalesTotal = Sale::where('cashier_id', $shift->cashier_id)
            ->where('payment_method', 'cash')
            ->whereNull('voided_at')
            ->whereBetween('created_at', [$shift->opened_at, $asOf])
            ->sum('total');

        $gcashFees = GcashTransaction::where('cashier_id', $shift->cashier_id)
            ->whereBetween('created_at', [$shift->opened_at, $asOf])
            ->sum('fee');

        $gcashCashIn = GcashTransaction::where('cashier_id', $shift->cashier_id)
            ->where('type', 'cash_in')
            ->whereBetween('created_at', [$shift->opened_at, $asOf])
            ->sum('amount');

        $gcashCashOut = GcashTransaction::where('cashier_id', $shift->cashier_id)
            ->where('type', 'cash_out')
            ->whereBetween('created_at', [$shift->opened_at, $asOf])
            ->sum('amount');

        // Paying a bill or a supplier in cash out of the register during a shift
        // reduces the drawer just like a GCash cash-out does. Scoped by BRANCH
        // and time window, not by who recorded the payment — a manager paying
        // the electric bill in cash while a cashier's shift is open still comes
        // out of that same physical till, even though the cashier didn't touch
        // it themselves. Without this, that cashier shows "short" by exactly
        // that amount at close, for no actual discrepancy.
        //
        // Known limitation: if two shifts are ever open simultaneously at the
        // same branch, a single cash payment would get subtracted from both —
        // there's currently no way to attribute a bill payment to one specific
        // till when more than one is active at once.
        $cashPaidOut = $this->calculateCashPaidOut($shift, $asOf);

        return (float) $shift->starting_cash
            + (float) $cashSalesTotal
            + (float) $gcashFees
            + (float) $gcashCashIn
            - (float) $gcashCashOut
            - $cashPaidOut;
    }

    /**
     * Cash paid out of this branch's till for bills/suppliers during the given
     * window — split out from calculateExpectedCash() so the close-shift modal
     * can show the cashier *why* the expected figure is lower, not just a
     * number they have no way to explain.
     */
    private function calculateCashPaidOut(ShiftSession $shift, CarbonInterface $asOf): float
    {
        $cashExpensePayments = Expense::where('location_id', $shift->location_id)
            ->where('payment_method', 'cash')
            ->where('is_paid', true)
            ->whereBetween('paid_at', [$shift->opened_at, $asOf])
            ->sum('amount');

        $cashPayablePayments = AccountsPayable::where('location_id', $shift->location_id)
            ->where('payment_method', 'cash')
            ->where('is_paid', true)
            ->whereBetween('paid_at', [$shift->opened_at, $asOf])
            ->sum('amount');

        return (float) $cashExpensePayments + (float) $cashPayablePayments;
    }

    public function history(Request $request): Response
    {
        $user = $request->user();
        $query = ShiftSession::with('cashier', 'location')->orderByDesc('opened_at');

        if (!$user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('shifts/index', [
            'shifts' => $query->limit(50)->get(),
        ]);
    }
}
