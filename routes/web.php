<?php

use App\Http\Controllers\Backoffice\DashboardController;
use App\Http\Controllers\Backoffice\ProductController;
use App\Http\Controllers\Backoffice\SalesReportController;
use App\Http\Controllers\Backoffice\ShiftReportController;
use App\Http\Controllers\Pos\TerminalController;
use Illuminate\Support\Facades\Route;

// Redirect root to POS terminal
Route::get('/', function () {
    return redirect()->route('pos.terminal');
})->name('home');

// POS Frontoffice Cashier Terminal (PWA Ready, Local-First)
Route::get('/pos', [TerminalController::class, 'index'])->name('pos.terminal');

// Protected Backoffice Admin & Reports
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return redirect()->route('backoffice.dashboard');
    })->name('dashboard');

    Route::prefix('backoffice')->name('backoffice.')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Products Management
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::put('/products/{id}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Reports
        Route::get('/reports/sales', [SalesReportController::class, 'index'])->name('reports.sales');
        Route::get('/reports/shifts', [ShiftReportController::class, 'index'])->name('reports.shifts');
    });
});

require __DIR__.'/settings.php';
