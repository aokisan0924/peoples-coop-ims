<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = User::with('location', 'roles')->orderBy('name');

        // Manager only sees users at their own branch; Owner sees everyone
        if (!$user->seesAllLocations()) {
            $query->where('location_id', $user->location_id);
        }

        return Inertia::render('users/index', [
            'users' => $query->get(),
            'canAssignManagers' => $user->seesAllLocations(),
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('users/create', [
            // Owner picks any branch; Manager doesn't need to — it's implicit
            'locations' => $user->seesAllLocations()
                ? Location::where('is_active', true)->orderBy('name')->get()
                : [],
            'canAssignManagers' => $user->seesAllLocations(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => [$isOwner ? 'required' : 'nullable', 'in:Manager,Cashier'],
            'location_id' => [$isOwner ? 'required' : 'nullable', 'exists:locations,id'],
        ]);

        $newUser = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
            // Manager can only ever create Cashiers at their own branch —
            // ignore any role/location values a Manager might try to submit
            'location_id' => $isOwner ? $validated['location_id'] : $user->location_id,
        ]);

        $newUser->assignRole($isOwner ? $validated['role'] : 'Cashier');

        return redirect()->route('users.index')->with('success', 'User added.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return back()->withErrors(['user' => 'You cannot remove your own account.']);
        }

        // Manager can only remove users at their own branch
        if (!$currentUser->seesAllLocations() && $user->location_id !== $currentUser->location_id) {
            abort(403);
        }

        $user->delete();

        return redirect()->route('users.index')->with('success', 'User removed.');
    }
}
