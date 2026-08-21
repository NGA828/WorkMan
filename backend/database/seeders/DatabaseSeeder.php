<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\BookingLocation;
use App\Models\ClientProfile;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\ServiceLocation;
use App\Models\TechnicianProfile;
use App\Models\User;
use App\Models\WorkmanNotification;
use App\Models\WorkingHour;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seeds WorkMan with a fully explorable demo environment.
 *
 * Demo accounts (password for all of them: "password"):
 *   admin@workman.local   — Administrator
 *   client@workman.local  — Client (Awa Diallo)
 *   jean@workman.local    — Client (Jean Mbarga)
 *   michael@workman.local — Technician (Plumbing, verified)
 *   fatou@workman.local   — Technician (Electrical, verified)
 *   samuel@workman.local  — Technician (Carpentry, verified)
 *   eric@workman.local    — Technician (Gas, awaiting verification)
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ---------------------------------------------------------------- roles
        $admin = $this->user('Admin User', 'admin', 'admin@workman.local');

        $awa = $this->user('Awa Diallo', 'client', 'client@workman.local');
        $jean = $this->user('Jean Mbarga', 'client', 'jean@workman.local');

        ClientProfile::create([
            'user_id' => $awa->id,
            'phone' => '+237 655 12 34 56',
            'address' => 'Rue Joffre, Akwa',
            'city' => 'Douala',
        ]);

        ClientProfile::create([
            'user_id' => $jean->id,
            'phone' => '+237 677 98 76 54',
            'address' => 'Boulevard de la Liberté',
            'city' => 'Douala',
        ]);

        // ---------------------------------------------------------- categories
        $categories = [
            'plumbing' => ['Plumbing', 'Leaks, repairs & installations'],
            'electrical' => ['Electrical work', 'Safe fixes for every circuit'],
            'carpentry' => ['Carpentry', 'Furniture, fittings & more'],
            'gas' => ['Gas delivery', 'Reliable delivery to your door'],
            'laundry' => ['Laundry', 'Fresh clothes, less effort'],
        ];

        $categoryModels = [];

        foreach ($categories as $slug => [$name, $description]) {
            $categoryModels[$slug] = ServiceCategory::create([
                'name' => $name,
                'slug' => $slug,
                'description' => $description,
            ]);
        }

        // ---------------------------------------------------------- technicians
        $michael = $this->technician(
            'Michael Kone',
            'michael@workman.local',
            'Plumber with 8 years of experience fixing leaks, installing pipes and renovating bathrooms across Douala.',
            8,
            'approved',
            true,
            '+237 699 11 22 33',
        );

        $fatou = $this->technician(
            'Fatou Ndiaye',
            'fatou@workman.local',
            'Licensed electrician. Wiring, circuit repairs and safety checks for homes and small businesses.',
            6,
            'approved',
            true,
            '+237 688 44 55 66',
        );

        $samuel = $this->technician(
            'Samuel Bate',
            'samuel@workman.local',
            'Carpenter specialised in custom furniture, fittings and wooden repairs. Based in Yaoundé.',
            10,
            'approved',
            true,
            '+237 677 77 88 99',
        );

        $eric = $this->technician(
            'Eric Talla',
            'eric@workman.local',
            'Gas delivery and installation. Waiting for administrator verification.',
            3,
            'pending',
            true,
            '+237 690 12 34 56',
        );

        // Services offered
        Service::create([
            'technician_profile_id' => $michael->id,
            'service_category_id' => $categoryModels['plumbing']->id,
            'name' => 'Leak repair',
            'description' => 'Fixing leaking pipes, taps and joints.',
            'starting_price' => 5000,
        ]);

        Service::create([
            'technician_profile_id' => $michael->id,
            'service_category_id' => $categoryModels['plumbing']->id,
            'name' => 'Pipe installation',
            'description' => 'New pipe runs for kitchens and bathrooms.',
            'starting_price' => 15000,
        ]);

        Service::create([
            'technician_profile_id' => $fatou->id,
            'service_category_id' => $categoryModels['electrical']->id,
            'name' => 'Circuit repair',
            'description' => 'Diagnosing and repairing electrical circuits.',
            'starting_price' => 8000,
        ]);

        Service::create([
            'technician_profile_id' => $samuel->id,
            'service_category_id' => $categoryModels['carpentry']->id,
            'name' => 'Custom furniture',
            'description' => 'Made-to-measure furniture for your home.',
            'starting_price' => 25000,
        ]);

        Service::create([
            'technician_profile_id' => $eric->id,
            'service_category_id' => $categoryModels['gas']->id,
            'name' => 'Gas bottle delivery',
            'description' => '12.5 kg gas bottles delivered to your door.',
            'starting_price' => 7000,
        ]);

        // Service areas
        $this->location($michael, 'Douala', 'Akwa', 4.0544, 9.6961);
        $this->location($michael, 'Douala', 'Bonamoussadi', 4.0746, 9.6866);
        $this->location($fatou, 'Douala', 'Bonapriso', 4.0286, 9.7053);
        $this->location($fatou, 'Douala', 'Makepe', 4.0609, 9.7082);
        $this->location($samuel, 'Yaoundé', 'Bastos', 3.8870, 11.5050);
        $this->location($eric, 'Douala', 'Ndokoti', 4.0610, 9.7160);

        // Weekly working hours (0 = Sunday … 6 = Saturday)
        $this->hours($michael, [
            [0, null, null, false],
            [1, '08:00', '18:00', true],
            [2, '08:00', '18:00', true],
            [3, '08:00', '18:00', true],
            [4, '08:00', '18:00', true],
            [5, '08:00', '18:00', true],
            [6, '08:00', '14:00', true],
        ]);

        $this->hours($fatou, [
            [0, null, null, false],
            [1, '09:00', '17:00', true],
            [2, '09:00', '17:00', true],
            [3, '09:00', '17:00', true],
            [4, '09:00', '17:00', true],
            [5, '09:00', '17:00', true],
            [6, '09:00', '13:00', true],
        ]);

        $this->hours($samuel, [
            [0, null, null, false],
            [1, '08:00', '17:00', true],
            [2, '08:00', '17:00', true],
            [3, '08:00', '17:00', true],
            [4, '08:00', '17:00', true],
            [5, '08:00', '17:00', true],
            [6, null, null, false],
        ]);

        $this->hours($eric, [
            [0, null, null, false],
            [1, '08:00', '18:00', true],
            [2, '08:00', '18:00', true],
            [3, '08:00', '18:00', true],
            [4, '08:00', '18:00', true],
            [5, '08:00', '18:00', true],
            [6, '08:00', '16:00', true],
        ]);

        // -------------------------------------------------------- reviews/bookings

        // Three completed bookings for Michael, each reviewed.
        $b1 = $this->booking($awa, $michael, $michael->services()->first(), Carbon::now()->subDays(6)->setTime(10, 0), 'completed', 1500, 'paid');
        $b2 = $this->booking($jean, $michael, $michael->services()->first(), Carbon::now()->subDays(4)->setTime(14, 0), 'completed', 1500, 'paid');
        $b3 = $this->booking($awa, $michael, $michael->services()->first(), Carbon::now()->subDays(2)->setTime(11, 0), 'completed', 1500, 'paid');

        $this->review($b1, $awa, $michael, 5, 'Very professional and arrived on time.');
        $this->review($b2, $jean, $michael, 5, 'Fixed the leak quickly. Highly recommend.');
        $this->review($b3, $awa, $michael, 4, 'Good work, slightly later than agreed.');

        $this->refreshRating($michael);

        // A completed booking for Fatou with a review.
        $b4 = $this->booking($jean, $fatou, $fatou->services()->first(), Carbon::now()->subDays(8)->setTime(9, 0), 'completed', 1200, 'paid');
        $this->review($b4, $jean, $fatou, 5, 'Very careful with the wiring, everything works perfectly.');

        $this->refreshRating($fatou);

        // Pending booking: Michael has a request to accept or reject.
        $this->booking($awa, $michael, $michael->services()->first(), Carbon::tomorrow()->setTime(10, 0), 'pending', null, 'unpaid');

        // Accepted booking: Awa can pay Fatou's transport fee.
        $this->booking($awa, $fatou, $fatou->services()->first(), Carbon::today()->setTime(15, 0), 'accepted', 1500, 'unpaid');

        // Finished booking awaiting Awa's confirmation, then a review.
        $this->booking($awa, $samuel, $samuel->services()->first(), Carbon::yesterday()->setTime(12, 0), 'done', 2500, 'paid');

        // In-progress booking with live location, for the tracking demo.
        $bInProgress = $this->booking($jean, $fatou, $fatou->services()->first(), Carbon::now()->subHour()->setTime(8, 0), 'in_progress', 1500, 'paid');

        BookingLocation::create([
            'booking_id' => $bInProgress->id,
            'latitude' => 4.0420,
            'longitude' => 9.7010,
            'recorded_at' => Carbon::now()->subMinutes(2),
        ]);

        Payment::create([
            'booking_id' => $bInProgress->id,
            'client_id' => $jean->id,
            'reference' => 'WM-' . strtoupper(Str::random(12)),
            'amount' => 1500,
            'currency' => 'XAF',
            'purpose' => 'transport_fee',
            'status' => 'paid',
            'provider' => 'mtn_momo',
            'provider_transaction_id' => 'SIM-' . strtoupper(Str::random(10)),
            'paid_at' => Carbon::now()->subMinutes(5),
        ]);

        // ------------------------------------------------------------ messaging
        $conversation = Conversation::create([
            'client_id' => $awa->id,
            'technician_profile_id' => $michael->id,
            'last_message_at' => Carbon::now()->subMinutes(30),
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $awa->id,
            'body' => 'Hello, I have a leaking pipe. Are you available this afternoon?',
            'created_at' => Carbon::now()->subHour(),
            'updated_at' => Carbon::now()->subHour(),
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'sender_id' => $michael->user_id,
            'body' => 'Yes, I can come around 3 PM. Transport is 1,500 FCFA from Akwa.',
            'created_at' => Carbon::now()->subMinutes(30),
            'updated_at' => Carbon::now()->subMinutes(30),
        ]);

        // --------------------------------------------------------- notifications
        $this->notify($michael->user_id, 'booking.requested', 'You have a new booking request from Awa Diallo.');
        $this->notify($awa->id, 'booking.accepted', 'Your booking request was accepted.');
        $this->notify($awa->id, 'booking.done', 'The technician marked the work as finished. Please confirm completion.');
        $this->notify($michael->user_id, 'payment.paid', 'Transport fee received for a booking.');
    }

    // ------------------------------------------------------------ helper methods

    private function user(string $name, string $role, string $email): User
    {
        return User::create([
            'name' => $name,
            'role' => $role,
            'email' => $email,
            'password' => Hash::make('password'),
            'api_token_hash' => null,
        ]);
    }

    private function technician(
        string $name,
        string $email,
        string $bio,
        int $years,
        string $verification,
        bool $available,
        string $phone,
    ): TechnicianProfile {
        $user = $this->user($name, 'provider', $email);

        return TechnicianProfile::create([
            'user_id' => $user->id,
            'bio' => $bio,
            'years_experience' => $years,
            'phone' => $phone,
            'verification_status' => $verification,
            'is_available' => $available,
        ]);
    }

    private function location(TechnicianProfile $profile, string $city, string $neighborhood, float $lat, float $lng): void
    {
        ServiceLocation::create([
            'technician_profile_id' => $profile->id,
            'city' => $city,
            'neighborhood' => $neighborhood,
            'latitude' => $lat,
            'longitude' => $lng,
        ]);
    }

    private function hours(TechnicianProfile $profile, array $days): void
    {
        foreach ($days as [$day, $starts, $ends, $available]) {
            WorkingHour::create([
                'technician_profile_id' => $profile->id,
                'day_of_week' => $day,
                'starts_at' => $starts ? $starts . ':00' : null,
                'ends_at' => $ends ? $ends . ':00' : null,
                'is_available' => $available,
            ]);
        }
    }

    private function booking(
        User $client,
        TechnicianProfile $technician,
        ?Service $service,
        Carbon $when,
        string $status,
        ?float $transportFee,
        string $paymentStatus,
    ): Booking {
        return Booking::create([
            'client_id' => $client->id,
            'technician_profile_id' => $technician->id,
            'service_id' => $service?->id,
            'scheduled_at' => $when,
            'duration_minutes' => 60,
            'notes' => 'Seeded demo booking.',
            'transport_fee' => $transportFee,
            'transport_payment_status' => $paymentStatus,
            'status' => $status,
        ]);
    }

    private function review(Booking $booking, User $client, TechnicianProfile $technician, int $rating, string $body): void
    {
        Review::create([
            'booking_id' => $booking->id,
            'client_id' => $client->id,
            'technician_profile_id' => $technician->id,
            'rating' => $rating,
            'body' => $body,
        ]);
    }

    private function refreshRating(TechnicianProfile $technician): void
    {
        $summary = $technician->reviews()
            ->selectRaw('AVG(rating) as average, COUNT(*) as total')
            ->first();

        $technician->update([
            'average_rating' => $summary && $summary->total > 0
                ? round((float) $summary->average, 2)
                : 0,
            'reviews_count' => $summary ? (int) $summary->total : 0,
        ]);
    }

    private function notify(int $userId, string $type, string $message): void
    {
        WorkmanNotification::create([
            'id' => (string) Str::uuid(),
            'type' => $type,
            'notifiable_type' => User::class,
            'notifiable_id' => $userId,
            'data' => ['message' => $message],
        ]);
    }
}
