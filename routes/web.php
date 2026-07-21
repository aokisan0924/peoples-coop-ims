<?php

use App\Http\Controllers\AccountsPayableController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GcashController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfitLossController;
use App\Http\Controllers\RecurringExpenseController;
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

    // =========================================================================
    // Dashboard — everyone
    // =========================================================================
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // =========================================================================
    // Point of Sale — everyone
    // =========================================================================
    Route::get('pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('pos/queued-receipt/{uuid}', function (string $uuid) {
        return Inertia::render('pos/queued-receipt', ['uuid' => $uuid]);
    })->name('pos.queued-receipt');
    Route::get('pos/sync-review', function () {
        return Inertia::render('pos/sync-review');
    })->name('pos.sync-review');

    // =========================================================================
    // Products — lookup only. Full CRUD lives in the Manager|Owner group below.
    // =========================================================================
    // Product lookup — cashiers need this to ring up sales.
    Route::get('products/search', [ProductController::class, 'search'])->name('products.search');
    // Offline product cache snapshot — pulled periodically by the sync engine on
    // every authenticated device (cashier tills included) so offline search works.
    Route::get('products/offline-snapshot', [ProductController::class, 'offlineSnapshot'])->name('products.offline-snapshot');

    // =========================================================================
    // Stock Receiving — barcode lookup at the receiving counter. Everyone can
    // help receive stock; full stock-batch management is manager-only, below.
    // =========================================================================
    Route::post('stock-batches/lookup-barcode', [StockBatchController::class, 'lookupByBarcode'])
        ->name('stock-batches.lookup-barcode');

    // =========================================================================
    // Sales — everyone rings up; history/void is manager-only, below.
    // =========================================================================
    Route::post('sales', [SaleController::class, 'store'])
        ->middleware('throttle:30,1') // throttled against runaway/looped requests
        ->name('sales.store');
    Route::get('sales/{sale}/receipt', [SaleController::class, 'show'])->name('sales.receipt');
    // My Sales — every cashier can view their own shift history (not other cashiers' sales).
    Route::get('my-sales', [SaleController::class, 'mySales'])->name('sales.mine');

    // =========================================================================
    // GCash — cashiers transact; float reconciliation is manager-only, below.
    // =========================================================================
    Route::get('gcash', [GcashController::class, 'index'])->name('gcash.index');
    Route::post('gcash', [GcashController::class, 'store'])->name('gcash.store');

    // =========================================================================
    // Shifts — open/close/current is everyone; shift history is manager-only, below.
    // =========================================================================
    Route::get('shift/current', [ShiftSessionController::class, 'current'])->name('shifts.current');
    Route::post('shift/open', [ShiftSessionController::class, 'open'])->name('shifts.open');
    Route::get('shift/{shift}/expected-cash', [ShiftSessionController::class, 'expectedCash'])->name('shifts.expected-cash');
    Route::post('shift/{shift}/close', [ShiftSessionController::class, 'close'])->name('shifts.close');
    Route::get('shift/{shift}/summary', [ShiftSessionController::class, 'summary'])->name('shifts.summary');

    // =========================================================================
    // Manager | Owner — pricing, stock records, staff, and financial reports.
    // =========================================================================
    Route::middleware('role:Manager|Owner')->group(function () {

        // ---- Catalog setup ---------------------------------------------------
        // (What a product *is* — suppliers, units, categories, then products
        // themselves. Static routes are registered before their matching
        // resource() call so they aren't swallowed by a {product}/{category}
        // route-model-binding parameter — keep that order when editing.)
        Route::resource('suppliers', SupplierController::class);
        Route::resource('units', UnitController::class)->except(['edit']);

        Route::post('categories/quick-create', [CategoryController::class, 'quickStore'])->name('categories.quick-store');
        Route::resource('categories', CategoryController::class);

        Route::get('products/labels/print', [ProductController::class, 'labelsBatch'])->name('products.labels.batch');
        Route::get('products/{product}/label', [ProductController::class, 'label'])->name('products.label');
        Route::get('products/{product}/barcode', [ProductController::class, 'showBarcode'])->name('products.barcode');
        Route::resource('products', ProductController::class)->except(['search']);

        // ---- Inventory operations --------------------------------------------
        // (What's physically happening to stock — batches in, transfers between
        // branches. Same static-before-resource ordering note applies below.)
        Route::get('stock-batches/by-branch', [StockBatchController::class, 'byBranch'])->name('stock-batches.by-branch');
        Route::resource('stock-batches', StockBatchController::class)->except(['show', 'edit', 'update']);

        Route::get('stock-transfers', [StockTransferController::class, 'index'])->name('stock-transfers.index');
        Route::get('stock-transfers/create', [StockTransferController::class, 'create'])->name('stock-transfers.create');
        Route::post('stock-transfers', [StockTransferController::class, 'store'])->name('stock-transfers.store');
        Route::post('stock-transfers/{transfer}/confirm', [StockTransferController::class, 'confirmReceipt'])->name('stock-transfers.confirm');
        Route::post('stock-transfers/{transfer}/cancel', [StockTransferController::class, 'cancel'])->name('stock-transfers.cancel');

        // ---- Sales oversight --------------------------------------------------
        Route::get('sales', [SaleController::class, 'index'])->name('sales.index');
        Route::post('sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');

        // ---- GCash reconciliation ----------------------------------------------
        Route::post('gcash/adjust-float', [GcashController::class, 'adjustFloat'])->name('gcash.adjust-float');

        // ---- Staff & shift history --------------------------------------------
        Route::get('users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('users/create', [UserManagementController::class, 'create'])->name('users.create');
        Route::post('users', [UserManagementController::class, 'store'])->name('users.store');
        Route::patch('users/{user}/toggle-active', [UserManagementController::class, 'toggleActive'])->name('users.toggle-active');

        Route::get('shifts', [ShiftSessionController::class, 'history'])->name('shifts.history');

        // ---- Financial: expenses, recurring bills, payables, and reports ------
        Route::get('expenses', [ExpenseController::class, 'index'])->name('expenses.index');
        Route::get('expenses/create', [ExpenseController::class, 'create'])->name('expenses.create');
        Route::post('expenses', [ExpenseController::class, 'store'])->name('expenses.store');
        Route::post('expenses/{expense}/mark-paid', [ExpenseController::class, 'markPaid'])->name('expenses.mark-paid');
        Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');

        Route::get('recurring-expenses', [RecurringExpenseController::class, 'index'])->name('recurring-expenses.index');
        Route::get('recurring-expenses/create', [RecurringExpenseController::class, 'create'])->name('recurring-expenses.create');
        Route::post('recurring-expenses', [RecurringExpenseController::class, 'store'])->name('recurring-expenses.store');
        Route::post('recurring-expenses/{recurringExpense}/toggle', [RecurringExpenseController::class, 'toggleActive'])->name('recurring-expenses.toggle');
        Route::delete('recurring-expenses/{recurringExpense}', [RecurringExpenseController::class, 'destroy'])->name('recurring-expenses.destroy');
        Route::post('recurring-expenses/generate', [RecurringExpenseController::class, 'generateThisMonth'])->name('recurring-expenses.generate');

        Route::get('accounts-payable', [AccountsPayableController::class, 'index'])->name('accounts-payable.index');
        Route::post('accounts-payable/{payable}/mark-paid', [AccountsPayableController::class, 'markPaid'])->name('accounts-payable.mark-paid');

        Route::get('reports/profit-loss', [ProfitLossController::class, 'index'])->name('reports.profit-loss');
    });

    // =========================================================================
    // Owner only — branch/location management.
    // =========================================================================
    Route::middleware('role:Owner')->group(function () {
        Route::resource('locations', LocationController::class);
    });
});

require __DIR__.'/settings.php';
