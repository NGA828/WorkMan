<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse { return response()->json(['payments'=>Payment::where('client_id',$request->user()->id)->with('booking:id,scheduled_at,status')->latest()->paginate(15)]); }
    public function store(Request $request): JsonResponse
    {
        $data=$request->validate(['booking_id'=>['required','exists:bookings,id']]); $booking=Booking::where('id',$data['booking_id'])->where('client_id',$request->user()->id)->firstOrFail();
        if($booking->status!=='accepted') return response()->json(['message'=>'Transport can be paid after the technician accepts the booking.'],422);
        if(!$booking->transport_fee || $booking->transport_fee<=0) return response()->json(['message'=>'This booking does not have a transport fee yet.'],422);
        $existing=$booking->payments()->whereIn('status',['pending','paid'])->latest()->first(); if($existing) return response()->json(['payment'=>$existing]);
        $payment=Payment::create(['booking_id'=>$booking->id,'client_id'=>$request->user()->id,'reference'=>'WM-'.strtoupper(Str::random(12)),'amount'=>$booking->transport_fee,'currency'=>'XAF','purpose'=>'transport_fee','status'=>'pending']);
        return response()->json(['payment'=>$payment],201);
    }
}
