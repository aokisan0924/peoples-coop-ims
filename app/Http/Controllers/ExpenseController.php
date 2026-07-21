<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\GcashFloat;
use App\Models\GcashTransaction;
use App\Models\Location;
use App\Models\RecurringExpense;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class ExpenseController extends Controller
{
    private const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Internet', 'Supplies', 'Salaries', 'Other'];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Expense::with('location', 'recordedBy', 'supplier')->orderByDesc('expense_date');

        if (!$user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('expenses/index', [
            'expenses' => $query->limit(100)->get(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (!$isOwner && !$user->location_id) {
            abort(403, 'Only branch-assigned Managers can record expenses.');
        }

        return Inertia::render('expenses/create', [
            'categories' => self::CATEGORIES,
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'isOwner' => $isOwner,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (!$isOwner && !$user->location_id) {
            return back()->withErrors(['location' => 'Only branch-assigned Managers can record expenses.']);
        }

        $rules = [
            'category' => ['required', 'string', 'max:100'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'is_paid' => ['boolean'],
            'payment_method' => ['required', 'in:cash,gcash'],
            'notes' => ['nullable', 'string', 'max:500'],
            'is_recurring_template' => ['boolean'],
            'recurring_day_of_month' => ['required_if:is_recurring_template,true', 'nullable', 'integer', 'min:1', 'max:31'],
        ];

        if ($isOwner) {
            $rules['location_id'] = ['required', 'exists:locations,id'];
        }

        $validated = $request->validate($rules);
        $locationId = $isOwner ? $validated['location_id'] : $user->location_id;
        $isPaidNow = $validated['is_paid'] ?? false;

        // "Recurring monthly bill" describes a pattern (this category recurs
        // every month on roughly this day), not a specific dated instance — so
        // this branch creates the template only. The actual monthly Expense
        // rows get generated from it via RecurringExpenseController, same as
        // any other template.
        if ($validated['is_recurring_template'] ?? false) {
            RecurringExpense::create([
                'location_id' => $locationId,
                'category' => $validated['category'],
                'description' => $validated['description'] ?? null,
                'estimated_amount' => $validated['amount'],
                'day_of_month' => $validated['recurring_day_of_month'],
                'is_active' => true,
                'created_by' => $user->id,
            ]);

            return redirect()->route('expenses.index')->with('success', 'Recurring bill template added — it\'ll show up as pending each month.');
        }

        try {
            $expense = DB::transaction(function () use ($validated, $user, $locationId, $isPaidNow) {
                $expense = Expense::create([
                    'location_id' => $locationId,
                    'supplier_id' => $validated['supplier_id'] ?? null,
                    'category' => $validated['category'],
                    'description' => $validated['description'] ?? null,
                    'amount' => $validated['amount'],
                    'expense_date' => $validated['expense_date'],
                    'due_date' => $validated['due_date'] ?? null,
                    'is_paid' => $isPaidNow,
                    'payment_method' => $validated['payment_method'],
                    'paid_at' => $isPaidNow ? now() : null,
                    'recorded_by' => $user->id,
                    'notes' => $validated['notes'] ?? null,
                ]);

                if ($isPaidNow && $validated['payment_method'] === 'gcash') {
                    $this->deductFromGcashFloat($expense, $locationId, $user->id);
                }

                return $expense;
            });
        } catch (RuntimeException $e) {
            return back()->withErrors(['payment_method' => $e->getMessage()])->withInput();
        }

        return redirect()->route('expenses.index')->with('success', 'Expense recorded.');
    }

    public function markPaid(Request $request, Expense $expense): RedirectResponse
    {
        $user = $request->user();

        if (!$user->seesAllLocations() && $expense->location_id !== $user->location_id) {
            abort(403);
        }

        if ($expense->is_paid) {
            return back()->withErrors(['expense' => 'This expense is already marked paid.']);
        }

        try {
            DB::transaction(function () use ($expense, $user) {
                if ($expense->payment_method === 'gcash') {
                    $this->deductFromGcashFloat($expense, $expense->location_id, $user->id);
                }

                $expense->update(['is_paid' => true, 'paid_at' => now()]);
            });
        } catch (RuntimeException $e) {
            return back()->withErrors(['expense' => $e->getMessage()]);
        }

        return back()->with('success', 'Marked as paid.');
    }

    /**
     * Paying a bill via GCash moves money OUT of the store's own GCash wallet —
     * same direction as a customer Cash-In (float decreases). Logged as its own
     * transaction type so it's distinguishable from customer-facing transactions
     * in the GCash Monitor history.
     */
    private function deductFromGcashFloat(Expense $expense, int $locationId, int $userId): void
    {
        // Guarantee the row exists (safe under concurrency thanks to the unique
        // constraint on location_id — see GcashController for the same pattern),
        // then lock it before reading/updating the balance.
        GcashFloat::firstOrCreate(['location_id' => $locationId], ['balance' => 0]);
        $float = GcashFloat::where('location_id', $locationId)->lockForUpdate()->first();

        $newBalance = (float) $float->balance - (float) $expense->amount;

        if ($newBalance < 0) {
            throw new RuntimeException('Insufficient GCash float to pay this expense. Current float: ₱' . number_format($float->balance, 2));
        }

        $float->update(['balance' => $newBalance]);

        GcashTransaction::create([
            'type' => 'expense_payment',
            'amount' => $expense->amount,
            'fee' => 0,
            'customer_name' => null,
            'reference_number' => null,
            'cashier_id' => $userId,
            'location_id' => $locationId,
            'float_balance_after' => $newBalance,
            'notes' => "Payment for expense: {$expense->category}" . ($expense->description ? " ({$expense->description})" : ''),
        ]);
    }

    public function destroy(Request $request, Expense $expense): RedirectResponse
    {
        $user = $request->user();

        if (!$user->seesAllLocations() && $expense->location_id !== $user->location_id) {
            abort(403);
        }

        $expense->delete();

        return back()->with('success', 'Expense removed.');
    }
}
