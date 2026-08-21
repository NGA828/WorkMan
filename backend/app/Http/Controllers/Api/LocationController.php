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
     * Technician shares a live GPS position for an accepted booking.
     */
    public function update(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->technician?->user_id === $request->user()->id, 403);

        if (!in_array($booking->status, ['accepted', 'in_progress'], true)) {
            return response()->json([
                'message' => 'Location sharing is only available for accepted bookings.',
            ], 422);
        }

        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $location = BookingLocation::updateOrCreate(
            ['booking_id' => $booking->id],
            [...$data, 'recorded_at' => Carbon::now()]
        );

        return response()->json(['location' => $location]);
    }

    private function authorizeBooking(Request $request, Booking $booking): void
    {
        $isClient = $booking->client_id === $request->user()->id;
        $isTechnician = $booking->technician?->user_id === $request->user()->id;

        abort_unless($isClient || $isTechnician, 403);
    }
}
