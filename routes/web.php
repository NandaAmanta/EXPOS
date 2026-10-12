<?php

use App\Http\Controllers\Backoffice\CategoryController;
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

// POS Frontoffice Cashier Terminal (Multi-Branch, Local-First)
Route::get('/pos', [TerminalController::class, 'fallback'])->name('pos.terminal');
Route::get('/pos/{outlet_id}', [TerminalController::class, 'index'])->name('pos.terminal.outlet');

use App\Http\Controllers\Backoffice\OutletSelectionController;
use App\Http\Middleware\EnsureOutletSelected;

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        if (!$request->session()->has('active_outlet_id')) {
            return redirect()->route('backoffice.select-outlet');
        }
        return redirect()->route('backoffice.dashboard');
    })->name('dashboard');

    Route::prefix('backoffice')->name('backoffice.')->group(function () {
        // Pemilihan Cabang Saat Login / Masuk Backoffice
        Route::get('/select-outlet', [OutletSelectionController::class, 'selectOutlet'])->name('select-outlet');
        Route::post('/set-outlet', [OutletSelectionController::class, 'setOutlet'])->name('set-outlet');

        // Modul Backoffice yang mensyaratkan cabang terpilih
        Route::middleware([EnsureOutletSelected::class])->group(function () {
            Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        // Products Management
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::put('/products/{id}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{id}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Categories Management
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');

        // Reports
        Route::get('/reports/sales', [SalesReportController::class, 'index'])->name('reports.sales');
        Route::get('/reports/shifts', [ShiftReportController::class, 'index'])->name('reports.shifts');

        // Users & Role Permissions Management
        Route::get('/users', [\App\Http\Controllers\Backoffice\UserController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\Backoffice\UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [\App\Http\Controllers\Backoffice\UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{id}', [\App\Http\Controllers\Backoffice\UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/roles', [\App\Http\Controllers\Backoffice\UserController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{id}', [\App\Http\Controllers\Backoffice\UserController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{id}', [\App\Http\Controllers\Backoffice\UserController::class, 'destroyRole'])->name('roles.destroy');

        // Master Pajak Management
        Route::get('/taxes', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'indexTaxes'])->name('taxes.index');
        Route::post('/taxes', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'storeTax'])->name('taxes.store');
        Route::put('/taxes/{id}', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'updateTax'])->name('taxes.update');
        Route::delete('/taxes/{id}', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'destroyTax'])->name('taxes.destroy');

        // Master Biaya Tambahan (Additional Charges)
        Route::get('/charges', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'indexCharges'])->name('charges.index');
        Route::post('/charges', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'storeCharge'])->name('charges.store');
        Route::put('/charges/{id}', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'updateCharge'])->name('charges.update');
        Route::delete('/charges/{id}', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'destroyCharge'])->name('charges.destroy');

        // Master Bahan Baku & Stok Bahan
        Route::get('/ingredients', [\App\Http\Controllers\Backoffice\InventoryController::class, 'indexIngredients'])->name('ingredients.index');
        Route::post('/ingredients', [\App\Http\Controllers\Backoffice\InventoryController::class, 'storeIngredient'])->name('ingredients.store');
        Route::put('/ingredients/{id}', [\App\Http\Controllers\Backoffice\InventoryController::class, 'updateIngredient'])->name('ingredients.update');
        Route::delete('/ingredients/{id}', [\App\Http\Controllers\Backoffice\InventoryController::class, 'destroyIngredient'])->name('ingredients.destroy');

        // Master Formula Resep Menu (Bill of Materials)
        Route::get('/recipes', [\App\Http\Controllers\Backoffice\InventoryController::class, 'indexRecipes'])->name('recipes.index');
        Route::post('/recipes', [\App\Http\Controllers\Backoffice\InventoryController::class, 'storeRecipe'])->name('recipes.store');
        Route::delete('/recipes/{id}', [\App\Http\Controllers\Backoffice\InventoryController::class, 'destroyRecipe'])->name('recipes.destroy');

        // Mutasi & Kartu Stok (Stock Movements)
        Route::get('/inventory/movements', [\App\Http\Controllers\Backoffice\InventoryController::class, 'indexMovements'])->name('inventory.movements');
        Route::post('/inventory/adjust', [\App\Http\Controllers\Backoffice\InventoryController::class, 'adjustStock'])->name('inventory.adjust');

        // Legacy redirect for taxes-charges
        Route::get('/taxes-charges', [\App\Http\Controllers\Backoffice\TaxChargeController::class, 'index'])->name('taxes-charges.index');
        });
    });
});

require __DIR__.'/settings.php';
