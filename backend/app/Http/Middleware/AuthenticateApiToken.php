<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $user = $token ? User::where('api_token_hash', hash('sha256', $token))->first() : null;

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Prevent deactivated accounts from using the API.
        if (isset($user->is_active) && !$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated. Please contact support.'], 403);
        }

        $request->setUserResolver(fn () => $user);
        return $next($request);
    }
}
