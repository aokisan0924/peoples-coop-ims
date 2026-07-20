<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Location;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    private const CATEGORIES = ['Rent', 'Electricity', 'Water', 'Supplies', 'Salaries', 'Other'];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Expense::with('location', 'recordedBy')->orderByDesc('expense_date');

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
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'expense_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date'],
            'is_paid' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        if ($isOwner) {
            $rules['location_id'] = ['required', 'exists:locations,id'];
        }

        $validated = $request->validate($rules);

        Expense::create([
            'location_id' => $isOwner ? $validated['location_id'] : $user->location_id,
            'category' => $validated['category'],
            'description' => $validated['description'] ?? null,
            'amount' => $validated['amount'],
            'expense_date' => $validated['expense_date'],
            'due_date' => $validated['due_date'] ?? null,
            'is_paid' => $validated['is_paid'] ?? false,
            'paid_at' => ($validated['is_paid'] ?? false) ? now() : null,
            'recorded_by' => $user->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('expenses.index')->with('success', 'Expense recorded.');
    }

    public function markPaid(Request $request, Expense $expense): RedirectResponse
    {
        $user = $request->user();

        if (!$user->seesAllLocations() && $expense->location_id !== $user->location_id) {
            abort(403);
        }

        $expense->update(['is_paid' => true, 'paid_at' => now()]);

        return back()->with('success', 'Marked as paid.');
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
