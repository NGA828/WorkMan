<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianDiscoveryController extends Controller
{
    /**
     * Public search over verified technicians.
     *
     * Filters: q (name), category, city, min_rating, available (today).
     */
    public function index(Request $request): JsonResponse
    {
        $query = TechnicianProfile::query()
            ->where('verification_status', 'approved')
            ->with(['user:id,name', 'services.category', 'locations']);

        if ($request->filled('q')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->string('q') . '%');
            });
        }

        if ($request->filled('category')) {
            $query->whereHas('services', function ($q) use ($request) {
                $q->where('service_category_id', $request->integer('category'));
            });
        }

        if ($request->filled('city')) {
            $query->whereHas('locations', function ($q) use ($request) {
                $q->where('city', 'like', '%' . $request->string('city') . '%');
            });
        }

        if ($request->filled('min_rating')) {
            $query->where('average_rating', '>=', $request->float('min_rating'));
        }

        if ($request->boolean('available')) {
            $query->where('is_available', true)
                ->whereHas('workingHours', function ($q) {
                    $q->where('is_available', true)
                        ->where('day_of_week', now()->dayOfWeek);
                });
        }

        return response()->json([
            'technicians' => $query->orderByDesc('average_rating')->paginate(12),
        ]);
    }

    /**
     * Public technician profile page.
     */
    public function show(TechnicianProfile $technician): JsonResponse
    {
        abort_unless($technician->verification_status === 'approved', 404);

        return response()->json([
            'technician' => $technician->load([
                'user:id,name',
                'services.category',
                'locations',
                'workingHours',
            ]),
        ]);
    }

    /**
     * Save a technician to the client's favorites.
     */
    public function favorite(Request $request, TechnicianProfile $technician): JsonResponse
    {
        abort_unless($technician->verification_status === 'approved', 404);

        $favorite = Favorite::firstOrCreate([
            'client_id' => $request->user()->id,
            'technician_profile_id' => $technician->id,
        ]);

        return response()->json(['favorite' => true, 'id' => $favorite->id], 201);
    }

    /**
     * Remove a technician from the client's favorites.
     */
    public function unfavorite(Request $request, TechnicianProfile $technician): JsonResponse
    {
        Favorite::where('client_id', $request->user()->id)
            ->where('technician_profile_id', $technician->id)
            ->delete();

        return response()->json(['favorite' => false]);
    }

    /**
     * List the client's favorited technicians.
     */
    public function favorites(Request $request): JsonResponse
    {
        $technicians = $request->user()
            ->favorites()
            ->with([
                'technician.user:id,name',
                'technician.services.category',
                'technician.locations',
            ])
            ->get()
            ->pluck('technician');

        return response()->json(['technicians' => $technicians]);
    }
}
