<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\StockBatchController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard — everyone
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Point-of-Sale — everyone
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');

    // Product lookup — cashiers need this to ring up sales
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');

    // Barcode lookup for the receiving counter
    Route::post('stock-batches/lookup-barcode', [StockBatchController::class, 'lookupByBarcode'])
        ->name('stock-batches.lookup-barcode');

    // Sales — everyone can ring up; throttled against runaway/looped requests
    Route::post('sales', [SaleController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('sales.store');
    Route::get('sales/{sale}/receipt', [SaleController::class, 'show'])->name('sales.receipt');

    // Everything below changes prices, stock records, or exposes financial reports —
    // manager only.
    Route::middleware('role:Manager')->group(function () {
        // Suppliers
        Route::resource('suppliers', SupplierController::class);

        // Units
        Route::resource('units', UnitController::class);

        // Categories
        Route::resource('categories', CategoryController::class);

        // Products (search stays outside this group, above)
        Route::get('products/labels/print', [ProductController::class, 'labelsBatch'])->name('products.labels.batch');
        Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
        Route::get('products/{product}/barcode', [ProductController::class, 'showBarcode'])->name('products.barcode');
        Route::resource('products', ProductController::class)->except(['search']);

        // Stock Batches (lookup-barcode stays outside this group, above)
        Route::resource('stock-batches', StockBatchController::class)->except(['show', 'edit', 'update']);

        Route::get('sales', [SaleController::class, 'index'])->name('sales.index');
        Route::post('sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');
    });
});

require __DIR__.'/settings.php';
