<?php

namespace App\Http\Controllers\Backoffice;

use App\Http\Controllers\Controller;
use App\Models\PosShift;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftReportController extends Controller
{
    public function index(Request $request): Response
    {
        $shifts = PosShift::with(['user', 'outlet'])
            ->withCount('orders')
            ->latest('opened_at')
            ->limit(50)
            ->get();

        return Inertia::render('backoffice/reports/shifts', [
            'shifts' => $shifts,
        ]);
    }
}
