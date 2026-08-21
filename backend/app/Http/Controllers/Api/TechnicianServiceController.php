<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianServiceController extends Controller
{
    /**
     * List the services offered by the authenticated technician.
     */
    public function index(Request $request): JsonResponse
    {
        $profile = $request->user()->technicianProfile;

        return response()->json([
            'services' => $profile ? $profile->services()->with('category')->get() : [],
        ]);
    }

    /**
     * Add a service to the technician's professional profile.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_category_id' => ['required', 'exists:service_categories,id'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'starting_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $profile = TechnicianProfile::firstOrCreate(['user_id' => $request->user()->id]);

        $service = $profile->services()->create($data);

        return response()->json(['service' => $service->load('category')], 201);
    }

    /**
     * Remove a service from the technician's professional profile.
     */
    public function destroy(Request $request, Service $service): JsonResponse
    {
        abort_unless($service->technicianProfile?->user_id === $request->user()->id, 403);

        $service->delete();

        return response()->json(['message' => 'Service removed.']);
    }
}
