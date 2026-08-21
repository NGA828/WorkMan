<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClientProfile;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Register a new client or technician account.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'role' => ['required', 'in:client,provider'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city' => ['nullable', 'string', 'max:100'],
        ]);

        $token = Str::random(64);

        $user = DB::transaction(function () use ($data, $token) {
            $user = User::create([
                'name' => $data['name'],
                'role' => $data['role'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'api_token_hash' => hash('sha256', $token),
            ]);

            if ($user->role === 'provider') {
                // New technicians start unverified and only become
                // discoverable once an administrator approves them.
                TechnicianProfile::create([
                    'user_id' => $user->id,
                    'phone' => $data['phone'] ?? null,
                    'verification_status' => 'pending',
                ]);
            } else {
                ClientProfile::create([
                    'user_id' => $user->id,
                    'phone' => $data['phone'] ?? null,
                    'city' => $data['city'] ?? null,
                ]);
            }

            return $user;
        });

        return $this->tokenResponse($user, $token, 201);
    }

    /**
     * Log an existing user in and issue a fresh API token.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Those details do not match our records.'], 422);
        }

        $token = Str::random(64);
        $user->update(['api_token_hash' => hash('sha256', $token)]);

        return $this->tokenResponse($user, $token);
    }

    /**
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => $user->only(['id', 'name', 'role', 'email']),
        ]);
    }

    /**
     * Invalidate the current API token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->update(['api_token_hash' => null]);

        return response()->json(['message' => 'Signed out successfully.']);
    }

    private function tokenResponse(User $user, string $token, int $status = 200): JsonResponse
    {
        return response()->json([
            'user' => $user->only(['id', 'name', 'role', 'email']),
            'token' => $token,
        ], $status);
    }
}
