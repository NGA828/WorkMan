<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AiDiagnosisController extends Controller
{
    public function diagnose(Request $request): JsonResponse
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'problem' => ['nullable', 'string', 'max:2000'],
        ]);

        $provider = config('services.ai.provider', 'openrouter');
        $model = config('services.ai.model');
        $apiKey = config('services.ai.key');

        if (!$apiKey || !$model || in_array(trim((string) $apiKey), ['your_openrouter_key', 'your_groq_key'], true)) {
            return response()->json([
                'message' => 'AI diagnosis is not configured. Add a real provider key to AI_API_KEY in backend/.env, then restart Laravel.',
            ], 503);
        }

        $image = $data['image'];
        $mime = $image->getMimeType();
        $imageData = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($image->getRealPath()));
        $prompt = <<<PROMPT
You are WorkMan's cautious home-services triage assistant. Analyze the attached problem image.
Suggest one likely service category from: Plumbing, Electrical work, Phone repair, Appliance repair,
Construction, Cleaning, Car repair, or Other. Do not make a final diagnosis, do not claim certainty,
and do not recommend dangerous repairs. Mention visible observations, ask useful questions for a
qualified technician, and flag safety concerns. The client's description is:
{$data['problem']}

Return ONLY valid JSON with this exact shape:
{"category":"...","confidence":"low|medium|high","summary":"...","observations":["..."],"questions":["..."],"safety_notes":["..."]}
PROMPT;

        $endpoint = $provider === 'groq'
            ? 'https://api.groq.com/openai/v1/chat/completions'
            : 'https://openrouter.ai/api/v1/chat/completions';

        $http = Http::timeout(45);
        $caBundle = config('services.ai.ca_bundle');
        if ($caBundle) {
            $caBundle = str_starts_with($caBundle, DIRECTORY_SEPARATOR)
                || preg_match('/^[A-Za-z]:[\\\\\/]/', $caBundle)
                ? $caBundle
                : base_path($caBundle);

            if (is_file($caBundle)) {
                $http = $http->withOptions(['verify' => $caBundle]);
            }
        }

        $response = $http
            ->withToken($apiKey)
            ->acceptJson()
            ->withHeaders($provider === 'openrouter' ? [
                'HTTP-Referer' => config('app.url'),
                'X-Title' => config('app.name', 'WorkMan'),
            ] : [])
            ->post($endpoint, [
                'model' => $model,
                'temperature' => 0.2,
                'max_tokens' => 700,
                'messages' => [[
                    'role' => 'user',
                    'content' => [
                        ['type' => 'text', 'text' => $prompt],
                        ['type' => 'image_url', 'image_url' => ['url' => $imageData]],
                    ],
                ]],
            ]);

        if ($response->failed()) {
            report(new \RuntimeException('AI diagnosis provider failed: ' . $response->body()));
            $providerMessage = data_get($response->json(), 'error.message');
            $message = match ($response->status()) {
                401 => 'The AI provider rejected the API key. Check AI_API_KEY in backend/.env.',
                402 => 'The AI provider has no available credits or free quota for this key.',
                404 => 'The configured AI model is unavailable. Check AI_MODEL in backend/.env.',
                429 => 'The AI provider rate limit was reached. Please try again shortly.',
                default => $providerMessage
                    ? 'The AI provider rejected the request: ' . \Illuminate\Support\Str::limit($providerMessage, 180)
                    : 'The AI diagnosis provider is temporarily unavailable.',
            };
            return response()->json([
                'message' => $message . ' You can continue booking without AI.',
            ], 502);
        }

        $content = data_get($response->json(), 'choices.0.message.content');
        $content = is_array($content)
            ? collect($content)->pluck('text')->filter()->implode("\n")
            : (string) $content;
        $content = trim(preg_replace('/^```(?:json)?|```$/m', '', $content));
        $diagnosis = json_decode($content, true);

        if (!is_array($diagnosis) || !isset($diagnosis['category'], $diagnosis['summary'])) {
            return response()->json([
                'message' => 'The AI returned an unreadable diagnosis. Please try another image.',
            ], 502);
        }

        return response()->json([
            'diagnosis' => [
                'category' => Str::limit((string) $diagnosis['category'], 80, ''),
                'confidence' => in_array($diagnosis['confidence'] ?? null, ['low', 'medium', 'high'], true)
                    ? $diagnosis['confidence']
                    : 'low',
                'summary' => Str::limit((string) $diagnosis['summary'], 500),
                'observations' => array_values(array_slice((array) ($diagnosis['observations'] ?? []), 0, 5)),
                'questions' => array_values(array_slice((array) ($diagnosis['questions'] ?? []), 0, 5)),
                'safety_notes' => array_values(array_slice((array) ($diagnosis['safety_notes'] ?? []), 0, 5)),
            ],
        ]);
    }
}
