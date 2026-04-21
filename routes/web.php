<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PhotoboothController;

Route::get('/', [PhotoboothController::class, 'index'])->name('photobooth.index');
Route::post('/payment/confirm', [PhotoboothController::class, 'confirmPayment'])->name('photobooth.payment.confirm');