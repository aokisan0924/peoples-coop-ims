<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\StockBatchController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Suppliers
    Route::resource('suppliers', SupplierController::class);

    // Units
    Route::resource('units', UnitController::class);

    // Categories
    Route::resource('categories', CategoryController::class);

    // Products
    Route::resource('products', ProductController::class);
    Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
    Route::get('products/labels/print', [ProductController::class, 'labelsBatch'])->name('products.labels.batch');
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
    Route::get('products/{product}/barcode', [ProductController::class, 'showBarcode'])->name('products.barcode');
    
    // Stock Batches
    Route::resource('stock-batches', StockBatchController::class)->except(['show', 'edit', 'update']);
    Route::post('stock-batches/lookup-barcode', [StockBatchController::class, 'lookupByBarcode'])
        ->name('stock-batches.lookup-barcode');
});

require __DIR__.'/settings.php';
