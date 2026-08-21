<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use App\Models\ServiceCategory;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Platform-wide counters for the admin dashboard.
     */
    public function summary(): JsonResponse
    {
        return response()->json([
            'users' => User::count(),
            'clients' => User::where('role', 'client')->count(),
            'technicians' => User::where('role', 'provider')->count(),
            'pending_verification' => TechnicianProfile::where('verification_status', 'pending')->count(),
            'approved_technicians' => TechnicianProfile::where('verification_status', 'approved')->count(),
            'categories' => ServiceCategory::where('is_active', true)->count(),
            'bookings' => Booking::count(),
            'reviews' => Review::count(),
        ]);
    }

    /**
     * All registered users.
     */
    public function users(): JsonResponse
    {
        $users = User::query()
            ->select('id', 'name', 'email', 'role', 'created_at')
            ->latest()
            ->paginate(25);

        return response()->json(['users' => $users]);
    }

    /**
     * Technician applications, ordered by most recent.
     */
    public function technicians(): JsonResponse
    {
        $technicians = TechnicianProfile::with('user:id,name,email')
            ->latest()
            ->paginate(25);

        return response()->json(['technicians' => $technicians]);
    }

    /**
     * Approve or reject a technician's verification.
     */
    public function verify(Request $request, TechnicianProfile $technician): JsonResponse
    {
        $data = $request->validate([
            'verification_status' => ['required', 'in:approved,rejected,pending'],
        ]);

        $technician->update($data);

        return response()->json([
            'technician' => $technician->load('user:id,name,email'),
        ]);
    }

    /**
     * Service categories (all, including inactive).
     */
    public function categories(): JsonResponse
    {
        return response()->json(['categories' => ServiceCategory::latest()->get()]);
    }

    public function createCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:service_categories,name'],
            'slug' => ['required', 'alpha_dash', 'max:100', 'unique:service_categories,slug'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        return response()->json(['category' => ServiceCategory::create($data)], 201);
    }

    public function updateCategory(Request $request, ServiceCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', 'unique:service_categories,name,' . $category->id],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $category->update($data);

        return response()->json(['category' => $category]);
    }

    public function deleteCategory(ServiceCategory $category): JsonResponse
    {
        if ($category->services()->exists()) {
            return response()->json([
                'message' => 'This category has services attached and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    /**
     * Every booking on the platform, for monitoring.
     */
    public function bookings(): JsonResponse
    {
        $bookings = Booking::with([
            'client:id,name',
            'technician.user:id,name',
            'service:id,name',
        ])
            ->latest()
            ->paginate(25);

        return response()->json(['bookings' => $bookings]);
    }

    /**
     * Every review on the platform, for moderation.
     */
    public function reviews(): JsonResponse
    {
        $reviews = Review::with(['client:id,name', 'technician.user:id,name'])
            ->latest()
            ->paginate(25);

        return response()->json(['reviews' => $reviews]);
    }

    /**
     * Remove an inappropriate or fraudulent review.
     */
    public function destroyReview(Review $review): JsonResponse
    {
        $technician = $review->technician;

        $review->delete();

        if ($technician) {
            $summary = Review::where('technician_profile_id', $technician->id)
                ->selectRaw('AVG(rating) as average, COUNT(*) as total')
                ->first();

            $technician->update([
                'average_rating' => $summary && $summary->total > 0
                    ? round((float) $summary->average, 2)
                    : 0,
                'reviews_count' => $summary ? (int) $summary->total : 0,
            ]);
        }

        return response()->json(['message' => 'Review removed.']);
    }
}
