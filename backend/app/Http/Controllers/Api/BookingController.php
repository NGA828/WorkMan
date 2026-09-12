<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\TechnicianProfile;
use App\Models\User;
use App\Models\WorkmanNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    /**
     * List bookings for the authenticated user.
     * Clients see their own requests; technicians see requests made to them.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Booking::query()
            ->with([
                'client:id,name',
                'technician.user:id,name',
                'service:id,name,starting_price',
                'review:id,booking_id,rating',
            ])
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->string('status'));
            });

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } else {
            $query->whereHas('technician', fn ($q) => $q->where('user_id', $user->id));
        }

        return response()->json([
            'bookings' => $query->latest()->paginate(20),
        ]);
    }

    /**
     * View one booking. Available to its client and its technician.
     */
    public function show(Request $request, Booking $booking): JsonResponse
    {
        $userId = (int) $request->user()->id;
        $isClient = (int) $booking->client_id === $userId;
        $isTechnician = (int) $booking->technician?->user_id === $userId;

        abort_unless($isClient || $isTechnician, 403);

        return response()->json([
            'booking' => $booking->load([
                'client:id,name',
                'technician.user:id,name',
                'service:id,name,starting_price',
                'review:id,booking_id,rating,body',
            ]),
        ]);
    }

    /**
     * Client sends a booking request to a verified technician.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'technician_profile_id' => ['required', 'exists:technician_profiles,id'],
            'service_id' => ['required', 'exists:services,id'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'service_city' => ['required', 'string', 'max:100'],
            'service_address' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['nullable', 'integer', 'min:30', 'max:480'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,mp4,mov,webm', 'max:20480'],
        ]);

        $technician = TechnicianProfile::where('id', $data['technician_profile_id'])
            ->where('verification_status', 'approved')
            ->firstOrFail();

        if (!$technician->is_available) {
            return response()->json(['message' => 'This technician is currently unavailable.'], 422);
        }

        if (!$technician->services()->whereKey($data['service_id'])->exists()) {
            return response()->json([
                'message' => 'Please select a service offered by this technician.',
            ], 422);
        }

        $when = Carbon::parse($data['scheduled_at']);
        $duration = (int) ($data['duration_minutes'] ?? 60);

        // Respect the technician's weekly working hours.
        $hours = $technician->workingHours()
            ->where('day_of_week', $when->dayOfWeek)
            ->where('is_available', true)
            ->first();

        if (
            !$hours || !$hours->starts_at || !$hours->ends_at
            || $when->format('H:i:s') < $hours->starts_at
            || $when->copy()->addMinutes($duration)->format('H:i:s') > $hours->ends_at
        ) {
            return response()->json(['message' => 'This technician is not available at that time.'], 422);
        }

        // Avoid double-booking the same time slot.
        $conflict = Booking::where('technician_profile_id', $technician->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->whereBetween('scheduled_at', [
                $when->copy()->subMinutes($duration),
                $when->copy()->addMinutes($duration),
            ])
            ->exists();

        if ($conflict) {
            return response()->json(['message' => 'That time slot has already been requested.'], 422);
        }

        $booking = DB::transaction(function () use ($data, $when, $duration, $request, $technician) {
            $booking = Booking::create([
                ...$data,
                'client_id' => $request->user()->id,
                'scheduled_at' => $when,
                'duration_minutes' => $duration,
                'status' => 'pending',
                'attachment_path' => $request->hasFile('attachment')
                    ? $request->file('attachment')->store('booking-attachments', 'public')
                    : null,
            ]);

            $this->notify(
                $technician->user_id,
                'booking.requested',
                'You have a new booking request from ' . $request->user()->name . '.',
                ['booking_id' => $booking->id]
            );

            return $booking;
        });

        return response()->json([
            'booking' => $booking->load(['technician.user:id,name', 'service:id,name,starting_price']),
        ], 201);
    }

    /**
     * Technician moves a booking through its lifecycle:
     * accept / reject (from pending), start work, finish work.
     */
    public function updateStatus(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->technician?->user_id === $request->user()->id, 403);

        $data = $request->validate([
            'status' => ['required', 'in:accepted,rejected,in_progress,done'],
            'transport_fee' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
        ]);

        $allowed = match ($data['status']) {
            'accepted', 'rejected' => $booking->status === 'pending',
            'in_progress' => $booking->status === 'accepted'
                && (!$booking->transport_fee || $booking->transport_payment_status === 'released'),
            'done' => $booking->status === 'in_progress',
            default => false,
        };

        if (!$allowed) {
            return response()->json([
                'message' => 'This booking cannot move to that status right now.',
            ], 422);
        }

        $booking->status = $data['status'];
        if (array_key_exists('transport_fee', $data)) {
            $booking->transport_fee = $data['transport_fee'];
        }
        $booking->save();

        $clientMessage = match ($data['status']) {
            'accepted' => 'Your booking request was accepted. Pay the transport fee to confirm the visit.',
            'rejected' => 'Your booking request was declined by the technician.',
            'in_progress' => 'The technician is on the way / has started the job. You can track their location live.',
            'done' => 'The technician marked the work as finished. Please confirm completion.',
            default => null,
        };

        if ($clientMessage) {
            $this->notify(
                $booking->client_id,
                'booking.' . $data['status'],
                $clientMessage,
                ['booking_id' => $booking->id]
            );
        }

        return response()->json([
            'booking' => $booking->load(['client:id,name', 'technician.user:id,name', 'service:id,name,starting_price']),
        ]);
    }

    /**
     * Client releases the held transport fee after the technician arrives.
     */
    public function releaseTransport(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->client_id === $request->user()->id, 403);

        if ($booking->status !== 'accepted' || $booking->transport_payment_status !== 'held') {
            return response()->json([
                'message' => 'Transport must be paid and held in escrow before it can be released.',
            ], 422);
        }

        $payment = $booking->payments()
            ->where('purpose', 'transport_fee')
            ->where('status', 'held')
            ->latest()
            ->first();

        if (!$payment) {
            return response()->json(['message' => 'The held transport payment could not be found.'], 422);
        }

        $payment->update(['status' => 'released']);
        $booking->update(['transport_payment_status' => 'released']);

        if ($booking->technician?->user_id) {
            $this->notify(
                $booking->technician->user_id,
                'payment.transport_released',
                'The client released the transport fee. You can now start work.',
                ['booking_id' => $booking->id]
            );
        }

        return response()->json(['booking' => $booking->fresh()]);
    }

    /**
     * Client confirms that the finished work was completed.
     */
    public function confirm(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->client_id === $request->user()->id, 403);

        if ($booking->status !== 'done') {
            return response()->json(['message' => 'Only finished work can be confirmed.'], 422);
        }

        if (
            $booking->transport_fee
            && $booking->transport_fee > 0
            && $booking->transport_payment_status !== 'released'
        ) {
            return response()->json([
                'message' => 'Please release the held transport fee before confirming completion.',
            ], 422);
        }

        $booking->update(['status' => 'completed']);

        if ($booking->technician?->user_id) {
            $this->notify(
                $booking->technician->user_id,
                'booking.completed',
                $request->user()->name . ' confirmed the job as completed.',
                ['booking_id' => $booking->id]
            );
        }

        return response()->json([
            'booking' => $booking->load(['technician.user:id,name']),
        ]);
    }

    /**
     * Client cancels a booking that has not been accepted yet.
     */
    public function cancel(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($booking->client_id === $request->user()->id, 403);

        if ($booking->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $booking->update(['status' => 'cancelled']);

        if ($booking->technician?->user_id) {
            $this->notify(
                $booking->technician->user_id,
                'booking.cancelled',
                $request->user()->name . ' cancelled a pending booking request.',
                ['booking_id' => $booking->id]
            );
        }

        return response()->json([
            'booking' => $booking->load(['technician.user:id,name']),
        ]);
    }

    /**
     * Remove a completed or cancelled booking from the authenticated user's
     * history without allowing either participant to affect the other user's
     * unrelated bookings.
     */
    public function destroy(Request $request, Booking $booking): JsonResponse
    {
        $userId = $request->user()->getKey();
        $isClient = $booking->client()->whereKey($userId)->exists();
        $isTechnician = $booking->technician()->where('user_id', $userId)->exists();

        abort_unless($isClient || $isTechnician, 403);

        if (!in_array($booking->status, ['completed', 'cancelled', 'rejected'], true)) {
            return response()->json([
                'message' => 'Only completed, cancelled, or rejected bookings can be cleared.',
            ], 422);
        }

        $booking->delete();

        return response()->json(['message' => 'Booking cleared from your history.']);
    }

    /**
     * Store an in-app notification for a user.
     */
    private function notify(int $userId, string $type, string $message, array $data = []): void
    {
        WorkmanNotification::create([
            'id' => (string) Str::uuid(),
            'type' => $type,
            'notifiable_type' => User::class,
            'notifiable_id' => $userId,
            'data' => array_merge(['message' => $message], $data),
        ]);
    }
}
