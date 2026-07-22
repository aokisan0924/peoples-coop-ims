<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Location;
use App\Models\RecurringExpense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class RecurringExpenseController extends Controller
{
    private const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Internet', 'Supplies', 'Salaries', 'Other'];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = RecurringExpense::with('location')->orderBy('category');

        if (! $user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('recurring-expenses/index', [
            'templates' => $query->get(),
            'pendingThisMonth' => $this->pendingForUser($user),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        return Inertia::render('recurring-expenses/create', [
            'categories' => self::CATEGORIES,
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'isOwner' => $isOwner,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        if (! $isOwner && ! $user->location_id) {
            return back()->withErrors(['location' => 'Only branch-assigned Managers can add recurring bills.']);
        }

        $rules = [
            'category' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'estimated_amount' => ['required', 'numeric', 'min:0.01'],
            'day_of_month' => ['required', 'integer', 'min:1', 'max:31'],
        ];

        if ($isOwner) {
            $rules['location_id'] = ['required', 'exists:locations,id'];
        }

        $validated = $request->validate($rules);

        RecurringExpense::create([
            'location_id' => $isOwner ? $validated['location_id'] : $user->location_id,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'estimated_amount' => $validated['estimated_amount'],
            'day_of_month' => $validated['day_of_month'],
            'is_active' => true,
            'created_by' => $user->id,
        ]);

        return redirect()->route('recurring-expenses.index')->with('success', 'Recurring bill added.');
    }

    public function toggleActive(Request $request, RecurringExpense $recurringExpense): RedirectResponse
    {
        $user = $request->user();

        if (! $user->seesAllLocations() && $recurringExpense->location_id !== $user->location_id) {
            abort(403);
        }

        $recurringExpense->update(['is_active' => ! $recurringExpense->is_active]);

        return back()->with('success', 'Updated.');
    }

    public function destroy(Request $request, RecurringExpense $recurringExpense): RedirectResponse
    {
        $user = $request->user();

        if (! $user->seesAllLocations() && $recurringExpense->location_id !== $user->location_id) {
            abort(403);
        }

        $recurringExpense->delete();

        return back()->with('success', 'Removed.');
    }

    /**
     * Manually generate this month's unpaid Expense records from active templates
     * for the user's own branch (or, for Owner, every branch). Skips any template
     * that already has a matching Expense recorded this month, so it's safe to
     * click more than once without creating duplicates.
     */
    public function generateThisMonth(Request $request): RedirectResponse
    {
        $user = $request->user();
        $query = RecurringExpense::where('is_active', true);

        if (! $user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        $templates = $query->get();
        $created = 0;

        foreach ($templates as $template) {
            // Keyed to THIS template specifically, not just category+location —
            // two templates sharing a category (e.g. two separate "Supplies"
            // contracts) previously masked each other, and a manually-recorded
            // expense in the same category could block generation entirely.
            $alreadyExists = Expense::where('recurring_expense_id', $template->id)
                ->whereYear('expense_date', now()->year)
                ->whereMonth('expense_date', now()->month)
                ->exists();

            if ($alreadyExists) {
                continue;
            }

            $day = min($template->day_of_month, now()->daysInMonth);
            $dueDate = Carbon::create(now()->year, now()->month, $day);

            Expense::create([
                'location_id' => $template->location_id,
                'recurring_expense_id' => $template->id,
                'category' => $template->category,
                'description' => $template->description,
                'amount' => $template->estimated_amount,
                'expense_date' => now()->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'is_paid' => false,
                'payment_method' => 'cash',
                'recorded_by' => $user->id,
                'notes' => 'Auto-generated from recurring bill template.',
            ]);

            $created++;
        }

        return back()->with('success', "{$created} bill(s) generated for this month.");
    }

    /**
     * Used by both this controller's index and the Dashboard — recurring templates
     * that don't yet have a matching Expense recorded for the current month.
     */
    public function pendingForUser($user)
    {
        $query = RecurringExpense::with('location')->where('is_active', true);

        if (! $user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return $query->get()->filter(function (RecurringExpense $template) {
            return ! Expense::where('recurring_expense_id', $template->id)
                ->whereYear('expense_date', now()->year)
                ->whereMonth('expense_date', now()->month)
                ->exists();
        })->values();
    }
}
