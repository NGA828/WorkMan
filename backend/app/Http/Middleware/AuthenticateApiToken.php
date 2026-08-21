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
        if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);
        $request->setUserResolver(fn () => $user);
        return $next($request);
    }
}
