<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\MessagingController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProviderLocationController;
use App\Http\Controllers\Api\ProviderWorkingHoursController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ServiceCategoryController;
use App\Http\Controllers\Api\TechnicianDiscoveryController;
use App\Http\Controllers\Api\TechnicianServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public routes — usable without an account
|--------------------------------------------------------------------------
*/

Route::get('/health', HealthController::class);
Route::get('/categories', [ServiceCategoryController::class, 'index']);
Route::get('/technicians', [TechnicianDiscoveryController::class, 'index']);
Route::get('/technicians/{technician}', [TechnicianDiscoveryController::class, 'show']);
Route::get('/technicians/{technician}/reviews', [ReviewController::class, 'index']);

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth.api', 'throttle:api'])->group(function () {
    // Account
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markAllRead']);

    // Bookings — shared between client and technician
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::get('/bookings/{booking}/location', [LocationController::class, 'show']);

    // Payments — created and paid by clients
    Route::get('/payments', [PaymentController::class, 'index']);

    // Private chat
    Route::get('/conversations', [MessagingController::class, 'conversations']);
    Route::post('/conversations', [MessagingController::class, 'create']);
    Route::get('/conversations/{conversation}/messages', [MessagingController::class, 'messages']);
    Route::post('/conversations/{conversation}/messages', [MessagingController::class, 'send']);

    /*
    | Client-only actions
    */
    Route::middleware('role:client')->group(function () {
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::post('/bookings/{booking}/cancel', [BookingController::class, 'cancel']);
        Route::post('/bookings/{booking}/confirm', [BookingController::class, 'confirm']);

        Route::post('/payments', [PaymentController::class, 'store']);
        Route::post('/payments/{payment}/confirm', [PaymentController::class, 'confirm']);

        Route::get('/favorites', [TechnicianDiscoveryController::class, 'favorites']);
        Route::post('/technicians/{technician}/favorite', [TechnicianDiscoveryController::class, 'favorite']);
        Route::delete('/technicians/{technician}/favorite', [TechnicianDiscoveryController::class, 'unfavorite']);
    });

    /*
    | Technician-only actions
    */
    Route::middleware('role:provider')->group(function () {
        // Professional profile: services offered
        Route::get('/provider/services', [TechnicianServiceController::class, 'index']);
        Route::post('/provider/services', [TechnicianServiceController::class, 'store']);
        Route::delete('/provider/services/{service}', [TechnicianServiceController::class, 'destroy']);

        // Professional profile: service areas
        Route::get('/provider/locations', [ProviderLocationController::class, 'index']);
        Route::post('/provider/locations', [ProviderLocationController::class, 'store']);
        Route::delete('/provider/locations/{location}', [ProviderLocationController::class, 'destroy']);

        // Professional profile: weekly working hours
        Route::get('/provider/working-hours', [ProviderWorkingHoursController::class, 'index']);
        Route::put('/provider/working-hours', [ProviderWorkingHoursController::class, 'update']);

        // Quick available / unavailable toggle
        Route::patch('/provider/availability', [ProfileController::class, 'availability']);

        // Booking lifecycle (accept, reject, start, finish)
        Route::patch('/bookings/{booking}/status', [BookingController::class, 'updateStatus']);

        // Live location sharing for accepted bookings
        Route::put('/bookings/{booking}/location', [LocationController::class, 'update']);
    });

    /*
    | Admin-only actions
    */
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/summary', [AdminController::class, 'summary']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/technicians', [AdminController::class, 'technicians']);
        Route::patch('/technicians/{technician}/verification', [AdminController::class, 'verify']);

        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories', [AdminController::class, 'createCategory']);
        Route::patch('/categories/{category}', [AdminController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [AdminController::class, 'deleteCategory']);

        Route::get('/bookings', [AdminController::class, 'bookings']);
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::delete('/reviews/{review}', [AdminController::class, 'destroyReview']);
    });
});
