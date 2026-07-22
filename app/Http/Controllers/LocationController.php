<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('locations/index', [
            'locations' => Location::orderByDesc('is_main')->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('locations/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        Location::create($validated);

        return redirect()->route('locations.index')->with('success', 'Branch added.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): void
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Location $location): Response
    {
        return Inertia::render('locations/edit', ['location' => $location]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Location $location): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ]);

        // is_main is intentionally never editable through this form —
        // it's a one-time designation set at creation, not a togglable field.
        $location->update($validated);

        return redirect()->route('locations.index')->with('success', 'Branch updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Location $location): RedirectResponse
    {
        if ($location->is_main) {
            return back()->withErrors(['location' => 'Cannot delete the main branch.']);
        }

        if ($location->users()->exists() || $location->stockBatches()->exists() || $location->sales()->exists()) {
            return back()->withErrors(['location' => 'Cannot delete a branch with existing users, stock, or sales. Deactivate it instead.']);
        }

        $location->delete();

        return redirect()->route('locations.index')->with('success', 'Branch removed.');
    }
}
