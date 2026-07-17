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
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Suppliers
    Route::resource('suppliers', SupplierController::class);

    // Units
    Route::resource('units', UnitController::class);

    // Categories
    Route::resource('categories', CategoryController::class);

    // Products
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('products/labels/print', [ProductController::class, 'labelsBatch'])->name('products.labels.batch');
    Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
    Route::get('products/{product}/barcode', [ProductController::class, 'showBarcode'])->name('products.barcode');
    Route::resource('products', ProductController::class);

    // Stock Batches
    Route::resource('stock-batches', StockBatchController::class)->except(['show', 'edit', 'update']);
    Route::post('stock-batches/lookup-barcode', [StockBatchController::class, 'lookupByBarcode'])
        ->name('stock-batches.lookup-barcode');

    // Sales
    Route::post('sales', [SaleController::class, 'store'])->name('sales.store');
    Route::get('sales/{sale}/receipt', [SaleController::class, 'show'])->name('sales.receipt');

    // Point-of-Sale
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');

    // Report
    Route::get('reports/sales', [ReportController::class, 'sales'])->name('reports.sales');
});

require __DIR__.'/settings.php';
