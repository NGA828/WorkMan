<?php
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceCategoryController;
use App\Http\Controllers\Api\TechnicianServiceController;
use Illuminate\Support\Facades\Route;
Route::get('/health', HealthController::class);
Route::get('/categories', [ServiceCategoryController::class, 'index']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware(['auth.api','throttle:api'])->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']); Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']); Route::put('/profile', [ProfileController::class, 'update']);
    Route::middleware('role:provider')->group(function () { Route::get('/provider/services', [TechnicianServiceController::class, 'index']); Route::post('/provider/services', [TechnicianServiceController::class, 'store']); Route::delete('/provider/services/{service}', [TechnicianServiceController::class, 'destroy']); });
});
