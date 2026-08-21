<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceCategoryController;
use App\Http\Controllers\Api\TechnicianDiscoveryController;
use App\Http\Controllers\Api\TechnicianServiceController;
use Illuminate\Support\Facades\Route;
Route::get('/health', HealthController::class); Route::get('/categories', [ServiceCategoryController::class, 'index']); Route::get('/technicians', [TechnicianDiscoveryController::class, 'index']); Route::get('/technicians/{technician}', [TechnicianDiscoveryController::class, 'show']);
Route::post('/auth/register', [AuthController::class, 'register']); Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware(['auth.api','throttle:api'])->group(function () {
 Route::get('/auth/me', [AuthController::class, 'me']); Route::post('/auth/logout', [AuthController::class, 'logout']); Route::get('/profile', [ProfileController::class, 'show']); Route::put('/profile', [ProfileController::class, 'update']);
 Route::get('/bookings', [BookingController::class, 'index']);
 Route::middleware('role:client')->group(function () { Route::post('/bookings', [BookingController::class, 'store']); Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']); Route::get('/favorites', [TechnicianDiscoveryController::class, 'favorites']); Route::post('/technicians/{technician}/favorite', [TechnicianDiscoveryController::class, 'favorite']); Route::delete('/technicians/{technician}/favorite', [TechnicianDiscoveryController::class, 'unfavorite']); });
 Route::middleware('role:provider')->group(function () { Route::get('/provider/services', [TechnicianServiceController::class, 'index']); Route::post('/provider/services', [TechnicianServiceController::class, 'store']); Route::delete('/provider/services/{service}', [TechnicianServiceController::class, 'destroy']); Route::patch('/bookings/{booking}/status', [BookingController::class, 'updateStatus']); });
});
