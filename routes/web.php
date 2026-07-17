<?php

use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::resource('suppliers', SupplierController::class);
});

require __DIR__.'/settings.php';
