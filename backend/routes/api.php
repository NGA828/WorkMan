<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware(['auth.api', 'throttle:api'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/client/dashboard', fn () => response()->json(['role' => 'client']))->middleware('role:client');
    Route::get('/provider/dashboard', fn () => response()->json(['role' => 'provider']))->middleware('role:provider');
    Route::get('/admin/dashboard', fn () => response()->json(['role' => 'admin']))->middleware('role:admin');
});
