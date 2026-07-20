<?php

namespace App\Http\Controllers;

use App\Models\GcashTransaction;
use App\Models\Sale;
use App\Models\ShiftSession;
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

    public function close(Request $request, ShiftSession $shift): RedirectResponse
    {
        if ($shift->cashier_id !== $request->user()->id) {
            abort(403);
        }

        if ($shift->status !== 'open') {
            return back()->withErrors(['shift' => 'This shift is already closed.']);
        }

        $validated = $request->validate([
            'actual_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($shift, $validated) {
            $closedAt = now();

            $cashSalesTotal = Sale::where('cashier_id', $shift->cashier_id)
                ->where('payment_method', 'cash')
                ->whereNull('voided_at')
                ->whereBetween('created_at', [$shift->opened_at, $closedAt])
                ->sum('total');

            $gcashFees = GcashTransaction::where('cashier_id', $shift->cashier_id)
                ->whereBetween('created_at', [$shift->opened_at, $closedAt])
                ->sum('fee');

            $gcashCashIn = GcashTransaction::where('cashier_id', $shift->cashier_id)
                ->where('type', 'cash_in')
                ->whereBetween('created_at', [$shift->opened_at, $closedAt])
                ->sum('amount');

            $gcashCashOut = GcashTransaction::where('cashier_id', $shift->cashier_id)
                ->where('type', 'cash_out')
                ->whereBetween('created_at', [$shift->opened_at, $closedAt])
                ->sum('amount');

            $expectedCash = (float) $shift->starting_cash
                + (float) $cashSalesTotal
                + (float) $gcashFees
                + (float) $gcashCashIn
                - (float) $gcashCashOut;

            $actualCash = $validated['actual_cash'];
            $variance = round($actualCash - $expectedCash, 2);

            $shift->update([
                'expected_cash' => round($expectedCash, 2),
                'actual_cash' => $actualCash,
                'variance' => $variance,
                'status' => 'closed',
                'closed_at' => $closedAt,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return redirect()->route('shifts.summary', $shift)->with('success', 'Shift closed.');
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
