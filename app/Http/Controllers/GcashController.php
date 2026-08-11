<?php

namespace App\Http\Controllers;

use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use App\Models\Location;
use App\Models\ShiftSession;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GcashController extends Controller
{
    public function index(Request $request): Response
    {
        $locationId = $request->user()->seesAllLocations()
            ? $request->query('location_id')
            : $request->user()->location_id;

        // Owner has no home branch — show a branch picker instead (handled in Step 4)
        if (! $locationId) {
            return Inertia::render('gcash/select-branch', [
                'locations' => Location::where('is_active', true)->orderBy('name')->get(),
            ]);
        }

        $float = GcashFloat::firstOrCreate(['location_id' => $locationId], ['balance' => 0]);
        $today = Carbon::today();

        $todayStats = GcashTransaction::where('location_id', $locationId)
            ->whereBetween('created_at', [$today->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'cash_in' THEN amount ELSE 0 END), 0) as total_cash_in,
                COALESCE(SUM(CASE WHEN type = 'cash_out' THEN amount ELSE 0 END), 0) as total_cash_out,
                COALESCE(SUM(CASE WHEN type = 'capital_deposit' THEN amount ELSE 0 END), 0) as total_capital_deposits,
                COALESCE(SUM(fee), 0) as total_fees,
                COUNT(*) as transaction_count
            ")
            ->first();

        return Inertia::render('gcash/index', [
            'floatBalance' => (float) $float->balance,
            // Needed so the Reconcile Float form knows which branch it's acting
            // on — required for Owners, who have no location_id of their own.
            'locationId' => (int) $locationId,
            'todayStats' => [
                'total_cash_in' => (float) $todayStats->total_cash_in,
                'total_cash_out' => (float) $todayStats->total_cash_out,
                'total_capital_deposits' => (float) $todayStats->total_capital_deposits,
                'total_fees' => (float) $todayStats->total_fees,
                'transaction_count' => (int) $todayStats->transaction_count,
            ],
            'recentTransactions' => GcashTransaction::with('cashier')
                ->where('location_id', $locationId)
                ->orderByDesc('created_at')
                ->limit(30)
                ->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $locationId = $request->user()->location_id;

        if (! $locationId) {
            return back()->withErrors(['location' => 'Your account has no assigned branch.']);
        }

        // A GCash transaction outside a shift's opened_at/closed_at window is
        // invisible to that shift's cash reconciliation — the physical cash it
        // moves would never be counted as expected in any shift's close-out.
        // Capital deposits go through this same gate: funding the float is
        // still a physical cash event that has to land inside a shift for
        // cash-drawer reconciliation to add up correctly.
        $hasOpenShift = ShiftSession::where('cashier_id', $request->user()->id)
            ->where('status', 'open')
            ->exists();

        if (! $hasOpenShift) {
            return back()->withErrors(['shift' => 'Open your shift before recording GCash transactions.']);
        }

        $validated = $request->validate([
            'type' => ['required', 'in:cash_in,cash_out,capital_deposit'],
            'amount' => ['required', 'numeric', 'min:1'],
            'fee' => ['nullable', 'numeric', 'min:0'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $request, $locationId) {
            // Lock THIS branch's float row only — other branches' floats are untouched
            $float = GcashFloat::where('location_id', $locationId)->lockForUpdate()->first();

            if (! $float) {
                $float = GcashFloat::create(['location_id' => $locationId, 'balance' => 0]);
            }

            $amount = $validated['amount'];
            // Capital deposits aren't a customer transaction, so a service fee
            // doesn't apply — ignore anything submitted regardless of what the
            // frontend sends, rather than trusting the client to omit it.
            $fee = $validated['type'] === 'capital_deposit' ? 0 : ($validated['fee'] ?? 0);
            // cash_out and capital_deposit both add to the float; only cash_in draws it down.
            $delta = $validated['type'] === 'cash_in' ? -$amount : $amount;
            $newBalance = (float) $float->balance + $delta;

            if ($validated['type'] === 'cash_in' && $newBalance < 0) {
                throw new \RuntimeException('Insufficient GCash float for this Cash-In. Current float: ₱'.number_format($float->balance, 2));
            }

            $float->update(['balance' => $newBalance]);

            GcashTransaction::create([
                'type' => $validated['type'],
                'amount' => $amount,
                'fee' => $fee,
                'customer_name' => $validated['customer_name'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
                'cashier_id' => $request->user()->id,
                'location_id' => $locationId,
                'float_balance_after' => $newBalance,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return back()->with('success', 'GCash transaction recorded.');
    }

    /**
     * Manager|Owner: reconcile the system's tracked float against the actual
     * GCash app balance (e.g. after loading more funds, or correcting drift).
     *
     * A Manager can only ever touch their own branch's float — location_id
     * is taken from their account and any value submitted in the request is
     * ignored. An Owner has no home branch, so they must supply which branch
     * they're reconciling (the frontend sends the locationId the "gcash/index"
     * page was rendered for); that value is validated against real locations.
     */
    public function adjustFloat(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->seesAllLocations()) {
            $validated = $request->validate([
                'location_id' => ['required', 'integer', 'exists:locations,id'],
                'new_balance' => ['required', 'numeric', 'min:0'],
                'notes' => ['required', 'string', 'max:500'],
            ]);

            $locationId = (int) $validated['location_id'];
        } else {
            $locationId = $user->location_id;

            if (! $locationId) {
                return back()->withErrors(['location' => 'Your account has no assigned branch.']);
            }

            $validated = $request->validate([
                'new_balance' => ['required', 'numeric', 'min:0'],
                'notes' => ['required', 'string', 'max:500'],
            ]);
        }

        DB::transaction(function () use ($validated, $request, $locationId) {
            $float = GcashFloat::where('location_id', $locationId)->lockForUpdate()->first();

            if (! $float) {
                $float = GcashFloat::create(['location_id' => $locationId, 'balance' => 0]);
            }

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
                'location_id' => $locationId,
                'float_balance_after' => $validated['new_balance'],
                'notes' => $validated['notes'].' (Adjusted by '.($adjustment >= 0 ? '+' : '').number_format($adjustment, 2).')',
            ]);
        });

        return back()->with('success', 'Float balance reconciled.');
    }
}
