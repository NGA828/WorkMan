<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\WorkmanNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * List the authenticated client's transport payments.
     */
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::where('client_id', $request->user()->id)
            ->with('booking:id,scheduled_at,status,technician_profile_id')
            ->latest()
            ->paginate(15);

        return response()->json(['payments' => $payments]);
    }

    /**
     * Create a transport-fee payment for an accepted booking.
     *
     * The service price itself is agreed after diagnosis; only the
     * transport fee is paid through WorkMan.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'provider' => ['nullable', 'in:mtn_momo,orange_money'],
        ]);

        $booking = Booking::where('id', $data['booking_id'])
            ->where('client_id', $request->user()->id)
            ->firstOrFail();

        if (!in_array($booking->status, ['accepted', 'in_progress', 'done'], true)) {
            return response()->json([
                'message' => 'Transport can be paid once the technician has accepted the booking.',
            ], 422);
        }

        if (!$booking->transport_fee || $booking->transport_fee <= 0) {
            return response()->json([
                'message' => 'This booking does not have a transport fee yet.',
            ], 422);
        }

        $existing = $booking->payments()->whereIn('status', ['pending', 'paid'])->latest()->first();

        if ($existing) {
            return response()->json(['payment' => $existing]);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'client_id' => $request->user()->id,
            'reference' => 'WM-' . strtoupper(Str::random(12)),
            'amount' => $booking->transport_fee,
            'currency' => 'XAF',
            'purpose' => 'transport_fee',
            'status' => 'pending',
            'provider' => $data['provider'] ?? null,
        ]);

        return response()->json(['payment' => $payment], 201);
    }

    /**
     * Confirm a transport payment through the selected mobile money provider.
     *
     * In production this endpoint would verify the provider's webhook or poll
     * the provider API. For local development it simulates a successful
     * confirmation so the full booking flow can be exercised end to end.
     */
    public function confirm(Request $request, Payment $payment): JsonResponse
    {
        abort_unless($payment->client_id === $request->user()->id, 403);

        if ($payment->status === 'paid') {
            return response()->json(['payment' => $payment]);
        }

        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'provider_transaction_id' => 'SIM-' . strtoupper(Str::random(10)),
        ]);

        $payment->booking()->update(['transport_payment_status' => 'paid']);

        $technicianUserId = $payment->booking?->technician?->user_id;

        if ($technicianUserId) {
            WorkmanNotification::create([
                'id' => (string) Str::uuid(),
                'type' => 'payment.paid',
                'notifiable_type' => User::class,
                'notifiable_id' => $technicianUserId,
                'data' => [
                    'message' => 'Transport fee received for booking #' . $payment->booking_id . '.',
                    'booking_id' => $payment->booking_id,
                ],
            ]);
        }

        return response()->json(['payment' => $payment->fresh()]);
    }
}
