<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GcashController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\ShiftSessionController;
use App\Http\Controllers\StockBatchController;
use App\Http\Controllers\StockTransferController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard — everyone
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Point-of-Sale — everyone
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');

    Route::get('pos/queued-receipt/{uuid}', function (string $uuid) {
        return Inertia::render('pos/queued-receipt', ['uuid' => $uuid]);
    })->name('pos.queued-receipt');

    Route::get('pos/sync-review', function () {
        return Inertia::render('pos/sync-review');
    })->name('pos.sync-review');

    // Product lookup — cashiers need this to ring up sales
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');

    // Offline product cache snapshot — pulled periodically by the sync engine on
    // every authenticated device (cashier tills included) so offline search works.
    Route::get('products/offline-snapshot', [ProductController::class, 'offlineSnapshot'])->name('products.offline-snapshot');

    // Barcode lookup for the receiving counter
    Route::post('stock-batches/lookup-barcode', [StockBatchController::class, 'lookupByBarcode'])
        ->name('stock-batches.lookup-barcode');

    // Sales — everyone can ring up; throttled against runaway/looped requests
    Route::post('sales', [SaleController::class, 'store'])
        ->middleware('throttle:30,1')
        ->name('sales.store');
    Route::get('sales/{sale}/receipt', [SaleController::class, 'show'])->name('sales.receipt');
    // My Sales — every cashier can view their own shift history (not other cashiers' sales)
    Route::get('my-sales', [SaleController::class, 'mySales'])->name('sales.mine');

    // GCash — cashiers can transact, but float reconciliation is manager-only
    Route::get('gcash', [GcashController::class, 'index'])->name('gcash.index');
    Route::post('gcash', [GcashController::class, 'store'])->name('gcash.store');

    Route::get('shift/current', [ShiftSessionController::class, 'current'])->name('shifts.current');
    Route::post('shift/open', [ShiftSessionController::class, 'open'])->name('shifts.open');
    Route::get('shift/{shift}/expected-cash', [ShiftSessionController::class, 'expectedCash'])->name('shifts.expected-cash');
    Route::post('shift/{shift}/close', [ShiftSessionController::class, 'close'])->name('shifts.close');
    Route::get('shift/{shift}/summary', [ShiftSessionController::class, 'summary'])->name('shifts.summary');

    // Everything below changes prices, stock records, or exposes financial reports —
    // manager only.
    Route::middleware('role:Manager|Owner')->group(function () {
        // Suppliers
        Route::resource('suppliers', SupplierController::class);

        // Units
        Route::resource('units', UnitController::class);

        // Categories
        Route::post('categories/quick-create', [CategoryController::class, 'quickStore'])->name('categories.quick-store');
        Route::resource('categories', CategoryController::class);

        // Products (search stays outside this group, above)
        Route::get('products/labels/print', [ProductController::class, 'labelsBatch'])->name('products.labels.batch');
        Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
        Route::get('products/{product}/barcode', [ProductController::class, 'showBarcode'])->name('products.barcode');
        Route::resource('products', ProductController::class)->except(['search']);

        // Stock Batches (lookup-barcode stays outside this group, above)
        Route::get('stock-batches/by-branch', [StockBatchController::class, 'byBranch'])->name('stock-batches.by-branch');
        Route::resource('stock-batches', StockBatchController::class)->except(['show', 'edit', 'update']);

        Route::get('sales', [SaleController::class, 'index'])->name('sales.index');
        Route::post('sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');

        Route::post('gcash/adjust-float', [GcashController::class, 'adjustFloat'])->name('gcash.adjust-float');

        Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('users/create', [UserManagementController::class, 'create'])->name('users.create');
        Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
        Route::delete('users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');

        Route::get('stock-transfers', [StockTransferController::class, 'index'])->name('stock-transfers.index');
        Route::get('stock-transfers/create', [StockTransferController::class, 'create'])->name('stock-transfers.create');
        Route::post('stock-transfers', [StockTransferController::class, 'store'])->name('stock-transfers.store');
        Route::post('stock-transfers/{transfer}/confirm', [StockTransferController::class, 'confirmReceipt'])->name('stock-transfers.confirm');
        Route::post('stock-transfers/{transfer}/cancel', [StockTransferController::class, 'cancel'])->name('stock-transfers.cancel');

        Route::get('shifts', [ShiftSessionController::class, 'history'])->name('shifts.history');
    });



    Route::middleware('role:Owner')->group(function () {
        Route::resource('locations', LocationController::class);
    });
});

require __DIR__.'/settings.php';
