<?php

namespace App\Http\Controllers;

use App\Models\AccountsPayable;
use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class AccountsPayableController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = AccountsPayable::with('supplier', 'location', 'stockBatch.product')->orderByDesc('incurred_date');

        if (!$user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        $payables = $query->limit(100)->get();

        return Inertia::render('accounts-payable/index', [
            'payables' => $payables,
            'totalUnpaid' => (float) $payables->where('is_paid', false)->sum('amount'),
        ]);
    }

    public function markPaid(Request $request, AccountsPayable $payable): RedirectResponse
    {
        $user = $request->user();

        if (!$user->seesAllLocations() && $payable->location_id !== $user->location_id) {
            abort(403);
        }

        if ($payable->is_paid) {
            return back()->withErrors(['payable' => 'Already marked paid.']);
        }

        $validated = $request->validate([
            'payment_method' => ['required', 'in:cash,gcash'],
        ]);

        try {
            DB::transaction(function () use ($payable, $validated, $user) {
                if ($validated['payment_method'] === 'gcash') {
                    $float = GcashFloat::where('location_id', $payable->location_id)->lockForUpdate()->first();

                    if (!$float) {
                        $float = GcashFloat::create(['location_id' => $payable->location_id, 'balance' => 0]);
                    }

                    $newBalance = (float) $float->balance - (float) $payable->amount;

                    if ($newBalance < 0) {
                        throw new RuntimeException('Insufficient GCash float to pay this supplier. Current float: ₱' . number_format($float->balance, 2));
                    }

                    $float->update(['balance' => $newBalance]);

                    GcashTransaction::create([
                        'type' => 'expense_payment',
                        'amount' => $payable->amount,
                        'fee' => 0,
                        'cashier_id' => $user->id,
                        'location_id' => $payable->location_id,
                        'float_balance_after' => $newBalance,
                        'notes' => "Supplier payment: {$payable->supplier->name}",
                    ]);
                }

                $payable->update([
                    'is_paid' => true,
                    'paid_at' => now(),
                    'payment_method' => $validated['payment_method'],
                ]);
            });
        } catch (RuntimeException $e) {
            return back()->withErrors(['payable' => $e->getMessage()]);
        }

        return back()->with('success', 'Marked as paid.');
    }
}
