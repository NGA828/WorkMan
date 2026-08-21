<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ProviderWorkingHoursController extends Controller
{
    /**
     * Return the technician's weekly schedule (7 rows, one per weekday).
     */
    public function index(Request $request): JsonResponse
    {
        $profile = TechnicianProfile::where('user_id', $request->user()->id)->first();

        $existing = $profile
            ? $profile->workingHours()->get()->keyBy('day_of_week')
            : collect();

        $hours = collect(range(0, 6))->map(function (int $day) use ($existing) {
            $row = $existing->get($day);

            return [
                'day_of_week' => $day,
                'starts_at' => $row?->starts_at,
                'ends_at' => $row?->ends_at,
                // Default weekdays to available, weekends to closed.
                'is_available' => $row ? (bool) $row->is_available : ($day < 6),
            ];
        });

        return response()->json(['working_hours' => $hours]);
    }

    /**
     * Replace the technician's weekly schedule in one request.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'working_hours' => ['required', 'array', 'size:7'],
            'working_hours.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'working_hours.*.starts_at' => ['nullable', 'date_format:H:i'],
            'working_hours.*.ends_at' => ['nullable', 'date_format:H:i'],
            'working_hours.*.is_available' => ['required', 'boolean'],
        ]);

        $profile = TechnicianProfile::firstOrCreate(['user_id' => $request->user()->id]);

        foreach ($data['working_hours'] as $row) {
            $profile->workingHours()->updateOrCreate(
                ['day_of_week' => $row['day_of_week']],
                [
                    'starts_at' => $row['starts_at']
                        ? Carbon::createFromFormat('H:i', $row['starts_at'])->format('H:i:s')
                        : null,
                    'ends_at' => $row['ends_at']
                        ? Carbon::createFromFormat('H:i', $row['ends_at'])->format('H:i:s')
                        : null,
                    'is_available' => $row['is_available'],
                ]
            );
        }

        return response()->json([
            'working_hours' => $profile->workingHours()->orderBy('day_of_week')->get(),
        ]);
    }
}
