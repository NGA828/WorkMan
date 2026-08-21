<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'role' => ['required', 'in:client,provider'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $token = Str::random(64);
        $user = User::create([...$data, 'password' => Hash::make($data['password']), 'api_token_hash' => hash('sha256', $token)]);
        return $this->response($user, $token, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Those details do not match our records.'], 422);
        }
        $token = Str::random(64);
        $user->update(['api_token_hash' => hash('sha256', $token)]);
        return $this->response($user, $token);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->userFromRequest($request);
        return $user ? response()->json(['user' => $user]) : response()->json(['message' => 'Unauthenticated.'], 401);
    }

    public function logout(Request $request): JsonResponse
    {
        if ($user = $this->userFromRequest($request)) $user->update(['api_token_hash' => null]);
        return response()->json(['message' => 'Signed out successfully.']);
    }

    private function userFromRequest(Request $request): ?User
    {
        $header = $request->bearerToken();
        return $header ? User::where('api_token_hash', hash('sha256', $header))->first() : null;
    }

    private function response(User $user, string $token, int $status = 200): JsonResponse
    {
        return response()->json(['user' => $user->only(['id', 'name', 'role', 'email']), 'token' => $token], $status);
    }
}
