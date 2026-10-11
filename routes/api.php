<?php

use App\Http\Controllers\Api\PosAuthController;
use App\Http\Controllers\Api\PosCatalogController;
use App\Http\Controllers\Api\PosShiftController;
use App\Http\Controllers\Api\PosSyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('pos')->group(function () {
    // Cashier fast PIN auth & switch
    Route::get('/auth/cashiers', [PosAuthController::class, 'cashiers']);
    Route::post('/auth/verify-pin', [PosAuthController::class, 'verifyPin']);

    // Master data & catalog
    Route::get('/catalog', [PosCatalogController::class, 'index']);

    // Shifts
    Route::get('/shifts/current', [PosShiftController::class, 'current']);
    Route::post('/shifts/open', [PosShiftController::class, 'open']);
    Route::post('/shifts/{id}/close', [PosShiftController::class, 'close']);

    // Batch order sync ingestion (UUID Idempotent)
    Route::post('/orders/batch-sync', [PosSyncController::class, 'batchSync']);
});
