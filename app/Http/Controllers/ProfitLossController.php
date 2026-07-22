<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Services\ProfitLossService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfitLossController extends Controller
{
    public function __construct(private ProfitLossService $profitLoss) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());

        $locationId = $isOwner
            ? ($request->filled('location_id') ? (int) $request->query('location_id') : null)
            : $user->location_id;

        return Inertia::render('reports/profit-loss', [
            'summary' => $this->profitLoss->summary($startDate, $endDate, $locationId),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'isOwner' => $isOwner,
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'selectedLocationId' => $locationId,
            'branchBreakdown' => ($isOwner && ! $locationId) ? $this->profitLoss->branchBreakdown($startDate, $endDate) : null,
        ]);
    }
}
