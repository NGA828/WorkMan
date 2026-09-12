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
     * Create a payment for an eligible booking. Amounts are always calculated
     * server-side from the booking, never trusted from the client.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'provider' => ['nullable', 'in:mtn_momo,orange_money'],
            'phone' => ['required', 'string', 'max:30'],
            'purpose' => ['nullable', 'in:transport_fee,service_fee'],
        ]);

        $booking = Booking::where('id', $data['booking_id'])
            ->where('client_id', $request->user()->id)
            ->firstOrFail();

        $purpose = $data['purpose'] ?? 'transport_fee';

        if ($purpose === 'transport_fee' && $booking->status !== 'accepted') {
            return response()->json([
                'message' => 'Transport can be paid once the technician has accepted the booking.',
            ], 422);
        }

        if ($purpose === 'service_fee' && $booking->status !== 'completed') {
            return response()->json([
                'message' => 'The service can be paid after you approve the completed work.',
            ], 422);
        }

        $amount = $purpose === 'service_fee'
            ? $booking->service?->starting_price
            : $booking->transport_fee;

        if (!$amount || $amount <= 0) {
            return response()->json([
                'message' => 'This booking does not have a payable amount yet.',
            ], 422);
        }

        $existing = $booking->payments()
            ->where('purpose', $purpose)
            ->whereIn('status', ['pending', 'paid', 'held', 'released'])
            ->latest()
            ->first();

        if ($existing) {
            return response()->json(['payment' => $existing]);
        }

        $payment = Payment::create([
            'booking_id' => $booking->id,
            'client_id' => $request->user()->id,
            'reference' => 'WM-' . strtoupper(Str::random(12)),
            'amount' => $amount,
            'currency' => 'XAF',
            'purpose' => $purpose,
            'status' => 'pending',
            'provider' => $data['provider'] ?? null,
            'phone' => $data['phone'],
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
            'status' => $payment->purpose === 'transport_fee' ? 'held' : 'paid',
            'paid_at' => now(),
            'provider_transaction_id' => 'SIM-' . strtoupper(Str::random(10)),
        ]);

        if ($payment->purpose === 'transport_fee') {
            $payment->booking()->update(['transport_payment_status' => 'held']);
        } else {
            $payment->booking()->update(['service_payment_status' => 'paid']);
        }

        $technicianUserId = $payment->booking?->technician?->user_id;

        if ($technicianUserId) {
            WorkmanNotification::create([
                'id' => (string) Str::uuid(),
                'type' => 'payment.paid',
                'notifiable_type' => User::class,
                'notifiable_id' => $technicianUserId,
                'data' => [
                    'message' => $payment->purpose === 'transport_fee'
                        ? 'Transport fee received and held in escrow for booking #' . $payment->booking_id . '.'
                        : 'Service payment received for booking #' . $payment->booking_id . '.',
                    'booking_id' => $payment->booking_id,
                ],
            ]);
        }

        return response()->json(['payment' => $payment->fresh()]);
    }
}
