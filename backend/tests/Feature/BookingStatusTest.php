<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class BookingStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_technician_can_start_an_accepted_booking_with_zero_transport_fee(): void
    {
        [$token, $booking] = $this->makeAcceptedBooking('0.00', 'unpaid');

        $this->withToken($token)
            ->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'in_progress'])
            ->assertOk()
            ->assertJsonPath('booking.status', 'in_progress');
    }

    public function test_technician_must_wait_for_a_positive_transport_fee_to_be_released(): void
    {
        [$token, $booking] = $this->makeAcceptedBooking('1500.00', 'unpaid');

        $this->withToken($token)
            ->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'in_progress'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'This booking cannot move to that status right now.');
    }

    public function test_technician_can_start_after_transport_fee_is_released(): void
    {
        [$token, $booking] = $this->makeAcceptedBooking('1500.00', 'released');

        $this->withToken($token)
            ->patchJson("/api/bookings/{$booking->id}/status", ['status' => 'in_progress'])
            ->assertOk()
            ->assertJsonPath('booking.status', 'in_progress');
    }

    /**
     * @return array{string, Booking}
     */
    private function makeAcceptedBooking(string $transportFee, string $paymentStatus): array
    {
        $token = 'test-api-token';
        $technicianUser = User::create([
            'name' => 'Test Technician',
            'role' => 'provider',
            'email' => 'technician@example.test',
            'password' => Hash::make('password'),
            'api_token_hash' => hash('sha256', $token),
        ]);
        $technician = TechnicianProfile::create(['user_id' => $technicianUser->id]);
        $client = User::create([
            'name' => 'Test Client',
            'role' => 'client',
            'email' => 'client@example.test',
            'password' => Hash::make('password'),
        ]);

        $booking = Booking::create([
            'client_id' => $client->id,
            'technician_profile_id' => $technician->id,
            'scheduled_at' => now()->addDay(),
            'status' => 'accepted',
            'transport_fee' => $transportFee,
            'transport_payment_status' => $paymentStatus,
        ]);

        return [$token, $booking];
    }
}
