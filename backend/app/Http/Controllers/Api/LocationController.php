<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LocationController extends Controller
{
    /**
     * Read the technician's last shared position for a booking.
     * Available to both the client and the technician.
     */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeBooking($request, $booking);

        return response()->json(['location' => $booking->location]);
    }

    /**
     * A participant shares their live GPS position for an accepted booking.
     */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        [$isClient, $isTechnician] = $this->participantRoles($request, $booking);
        abort_unless($isTechnician || $isClient, 403);

        if (!in_array($booking->status, ['accepted', 'in_progress'], true)) {
            return response()->json([
                'message' => 'Location sharing is only available for accepted bookings.',
            ], 422);
        }

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $location = BookingLocation::firstOrNew(['booking_id' => $booking->id]);
        if ($isTechnician) {
            $location->fill([...$data, 'recorded_at' => Carbon::now()]);
        } else {
            $location->fill([
                'client_latitude' => $data['latitude'],
                'client_longitude' => $data['longitude'],
                'client_recorded_at' => Carbon::now(),
            ]);
        }
        $location->save();

        return response()->json(['location' => $location]);
    }

    /**
     * Stop sharing the authenticated participant's location for this booking.
     */
    public function destroy(Request $request, Booking $booking): JsonResponse
    {
        [$isClient, $isTechnician] = $this->participantRoles($request, $booking);
        abort_unless($isTechnician || $isClient, 403);

        $location = $booking->location;
        if (!$location) {
            return response()->json(['location' => null]);
        }

        if ($isTechnician) {
            $location->forceFill([
                'latitude' => null,
                'longitude' => null,
                'recorded_at' => null,
            ]);
        } else {
            $location->forceFill([
                'client_latitude' => null,
                'client_longitude' => null,
                'client_recorded_at' => null,
            ]);
        }

        if (
            $location->latitude === null
            && $location->longitude === null
            && $location->client_latitude === null
            && $location->client_longitude === null
        ) {
            $location->delete();
        } else {
            $location->save();
        }

        return response()->json(['location' => $booking->fresh('location')->location]);
    }

    private function authorizeBooking(Request $request, Booking $booking): void
    {
        [$isClient, $isTechnician] = $this->participantRoles($request, $booking);

        abort_unless($isClient || $isTechnician, 403);
    }

    /**
     * Resolve access through the relationships so ID casts cannot reject a valid
     * participant when the database driver returns numeric IDs as strings.
     *
     * @return array{bool, bool}
     */
    private function participantRoles(Request $request, Booking $booking): array
    {
        $userId = $request->user()->getKey();

        return [
            $booking->client()->whereKey($userId)->exists(),
            $booking->technician()->where('user_id', $userId)->exists(),
        ];
    }
}
