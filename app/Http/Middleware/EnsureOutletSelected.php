<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOutletSelected
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip for select-outlet and set-outlet endpoints
        if ($request->routeIs('backoffice.select-outlet') || $request->routeIs('backoffice.set-outlet')) {
            return $next($request);
        }

        // If active_outlet_id is not yet set in session, redirect to select-outlet
        if (!$request->session()->has('active_outlet_id')) {
            return redirect()->route('backoffice.select-outlet');
        }

        return $next($request);
    }
}
