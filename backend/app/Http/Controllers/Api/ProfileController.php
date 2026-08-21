<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    /**
     * Return the profile that matches the authenticated user's role.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $profile = $user->role === 'provider'
            ? $user->technicianProfile
            : $user->clientProfile;

        return response()->json([
            'user' => $user->only(['id', 'name', 'role', 'email']),
            'profile' => $profile,
        ]);
    }

    /**
     * Update the profile that matches the authenticated user's role.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $name = $request->validate(['name' => ['sometimes', 'string', 'max:100']]);

        if (isset($name['name'])) {
            $user->update(['name' => $name['name']]);
        }

        if ($user->role === 'provider') {
            $data = $request->validate([
                'bio' => ['nullable', 'string', 'max:2000'],
                'years_experience' => ['nullable', 'integer', 'min:0', 'max:80'],
                'phone' => ['nullable', 'string', 'max:30'],
            ]);

            $profile = TechnicianProfile::updateOrCreate(
                ['user_id' => $user->id],
                $data
            );
        } else {
            $data = $request->validate([
                'phone' => ['nullable', 'string', 'max:30'],
                'address' => ['nullable', 'string', 'max:255'],
                'city' => ['nullable', 'string', 'max:100'],
            ]);

            $profile = ClientProfile::updateOrCreate(
                ['user_id' => $user->id],
                $data
            );
        }

        return response()->json([
            'user' => $user->only(['id', 'name', 'role', 'email']),
            'profile' => $profile,
        ]);
    }

    /**
     * Technician flips the quick "available / unavailable" switch.
     * Unavailable technicians disappear from client search results.
     */
    public function availability(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_available' => ['required', 'boolean'],
        ]);

        $profile = TechnicianProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            ['is_available' => $data['is_available']]
        );

        return response()->json(['profile' => $profile]);
    }
}
