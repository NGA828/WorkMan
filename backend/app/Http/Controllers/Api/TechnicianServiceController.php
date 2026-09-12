<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    public function requestCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $profile = TechnicianProfile::firstOrCreate(['user_id' => $request->user()->id]);
        $existing = \App\Models\ServiceCategory::whereRaw('LOWER(name) = ?', [mb_strtolower($data['name'])])->first();

        if ($existing) {
            return response()->json([
                'message' => $existing->approval_status === 'approved'
                    ? 'This category already exists. Select it from the list.'
                    : 'This category is already awaiting administrator review.',
                'category' => $existing,
            ], 422);
        }

        $category = \App\Models\ServiceCategory::create([
            'name' => trim($data['name']),
            'slug' => Str::slug($data['name']) . '-' . Str::lower(Str::random(5)),
            'description' => $data['description'] ?? null,
            'is_active' => false,
            'approval_status' => 'pending',
            'requested_by' => $profile->id,
        ]);

        return response()->json([
            'message' => 'Category submitted for administrator review.',
            'category' => $category,
        ], 201);
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
