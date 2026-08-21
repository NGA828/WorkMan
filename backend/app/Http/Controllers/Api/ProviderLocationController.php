<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceLocation;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProviderLocationController extends Controller
{
    /**
     * List the technician's service areas.
     */
    public function index(Request $request): JsonResponse
    {
        $profile = TechnicianProfile::where('user_id', $request->user()->id)->first();

        return response()->json([
            'locations' => $profile ? $profile->locations()->get() : [],
        ]);
    }

    /**
     * Add a service area (city + optional neighborhood).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'city' => ['required', 'string', 'max:100'],
            'neighborhood' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $profile = TechnicianProfile::firstOrCreate(['user_id' => $request->user()->id]);

        $duplicate = $profile->locations()
            ->where('city', $data['city'])
            ->where('neighborhood', $data['neighborhood'] ?? null)
            ->exists();

        if ($duplicate) {
            return response()->json(['message' => 'That service area is already listed.'], 422);
        }

        $location = $profile->locations()->create($data);

        return response()->json(['location' => $location], 201);
    }

    /**
     * Remove a service area.
     */
    public function destroy(Request $request, ServiceLocation $location): JsonResponse
    {
        abort_unless($location->technicianProfile?->user_id === $request->user()->id, 403);

        $location->delete();

        return response()->json(['message' => 'Service area removed.']);
    }
}
