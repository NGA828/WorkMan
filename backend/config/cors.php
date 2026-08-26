<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    // In local development we allow any origin so that Vite preview hosts
    // (e.g. https://*.e2b.app) and the mock API can communicate without CORS
    // errors. In production FRONTEND_URL should be set explicitly.
    'allowed_origins' => env('APP_ENV') === 'production'
        ? [env('FRONTEND_URL', 'http://localhost:5173')]
        : ['*'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
