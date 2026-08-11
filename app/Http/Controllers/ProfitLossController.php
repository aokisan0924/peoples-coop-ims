<?php

namespace App\Http\Controllers;

use App\Models\Location;
use App\Services\ProfitLossService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfitLossController extends Controller
{
    public function __construct(private ProfitLossService $profitLossService) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isOwner = $user->seesAllLocations();

        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->endOfMonth()->toDateString());

        $locationId = $isOwner ? $request->query('location_id') : $user->location_id;
        $locationId = $locationId ? (int) $locationId : null;

        return Inertia::render('reports/profit-loss', [
            'summary' => $this->profitLossService->summary($startDate, $endDate, $locationId),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'isOwner' => $isOwner,
            'locations' => $isOwner ? Location::where('is_active', true)->orderBy('name')->get(['id', 'name']) : [],
            'selectedLocationId' => $locationId,
            'branchBreakdown' => ($isOwner && ! $locationId)
                ? $this->profitLossService->branchBreakdown($startDate, $endDate)
                : null,
        ]);
    }
}
