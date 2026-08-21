<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MessagingController extends Controller
{
    /**
     * List the authenticated user's conversations, newest activity first.
     */
    public function conversations(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Conversation::query()
            ->with(['client:id,name', 'technician.user:id,name'])
            ->withCount([
                'messages as unread_count' => function ($q) use ($user) {
                    $q->whereNull('read_at')->where('sender_id', '!=', $user->id);
                },
            ]);

        if ($user->role === 'client') {
            $query->where('client_id', $user->id);
        } else {
            $query->whereHas('technician', fn ($q) => $q->where('user_id', $user->id));
        }

        return response()->json([
            'conversations' => $query->orderByDesc('last_message_at')->get(),
        ]);
    }

    /**
     * Start (or reopen) a conversation with a technician.
     */
    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'technician_profile_id' => ['required', 'exists:technician_profiles,id'],
            'booking_id' => ['nullable', 'exists:bookings,id'],
        ]);

        $technician = TechnicianProfile::where('id', $data['technician_profile_id'])
            ->where('verification_status', 'approved')
            ->firstOrFail();

        $conversation = Conversation::firstOrCreate([
            'client_id' => $request->user()->id,
            'technician_profile_id' => $technician->id,
            'booking_id' => $data['booking_id'] ?? null,
        ]);

        return response()->json([
            'conversation' => $conversation->load(['client:id,name', 'technician.user:id,name']),
        ], 201);
    }

    /**
     * Read a conversation thread and mark the other side's messages as read.
     */
    public function messages(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        Message::where('conversation_id', $conversation->id)
            ->where('sender_id', '!=', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => Carbon::now()]);

        return response()->json([
            'messages' => $conversation->messages()
                ->with('sender:id,name,role')
                ->oldest()
                ->get(),
        ]);
    }

    /**
     * Send a message inside a conversation.
     */
    public function send(Request $request, Conversation $conversation): JsonResponse
    {
        $this->authorizeConversation($request, $conversation);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $conversation->update(['last_message_at' => $message->created_at]);

        return response()->json([
            'message' => $message->load('sender:id,name,role'),
        ], 201);
    }

    private function authorizeConversation(Request $request, Conversation $conversation): void
    {
        $isClient = $conversation->client_id === $request->user()->id;
        $isTechnician = $conversation->technician?->user_id === $request->user()->id;

        abort_unless($isClient || $isTechnician, 403);
    }
}
