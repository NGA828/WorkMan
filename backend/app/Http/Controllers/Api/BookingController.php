<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\TechnicianProfile;
use App\Models\WorkmanNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
class BookingController extends Controller
{
    public function index(Request $request): JsonResponse { $query=$request->user()->role==='client' ? Booking::where('client_id',$request->user()->id) : Booking::whereHas('technician',fn($q)=>$q->where('user_id',$request->user()->id)); return response()->json(['bookings'=>$query->with(['client:id,name','technician.user:id,name','service'])->latest('scheduled_at')->paginate(15)]); }
    public function store(Request $request): JsonResponse
    {
        $data=$request->validate(['technician_profile_id'=>['required','exists:technician_profiles,id'],'service_id'=>['nullable','exists:services,id'],'scheduled_at'=>['required','date','after:now'],'duration_minutes'=>['nullable','integer','min:30','max:480'],'notes'=>['nullable','string','max:2000'],'transport_fee'=>['nullable','numeric','min:0']]);
        $tech=TechnicianProfile::where('id',$data['technician_profile_id'])->where('verification_status','approved')->firstOrFail(); $when=Carbon::parse($data['scheduled_at']);
        $hours=$tech->workingHours()->where('day_of_week',$when->dayOfWeek)->where('is_available',true)->first();
        if(!$hours || !$hours->starts_at || !$hours->ends_at || $when->format('H:i:s') < $hours->starts_at || $when->copy()->addMinutes($data['duration_minutes']??60)->format('H:i:s') > $hours->ends_at) return response()->json(['message'=>'This technician is not available at that time.'],422);
        $conflict=Booking::where('technician_profile_id',$tech->id)->whereIn('status',['pending','accepted'])->whereBetween('scheduled_at',[$when->copy()->subMinutes($data['duration_minutes']??60),$when->copy()->addMinutes($data['duration_minutes']??60)])->exists();
        if($conflict) return response()->json(['message'=>'That time slot has already been requested.'],422);
        $booking=DB::transaction(function()use($data,$when,$request,$tech){$booking=Booking::create([...$data,'client_id'=>$request->user()->id,'scheduled_at'=>$when,'duration_minutes'=>$data['duration_minutes']??60]); WorkmanNotification::create(['id'=>(string)Str::uuid(),'type'=>'booking.created','notifiable_type'=>get_class($tech->user),'notifiable_id'=>$tech->user_id,'data'=>['booking_id'=>$booking->id,'message'=>'You have a new booking request.']]); return $booking;});
        return response()->json(['booking'=>$booking->load(['technician.user:id,name','service'])],201);
    }
    public function updateStatus(Request $request, Booking $booking): JsonResponse { abort_unless($booking->technician?->user_id===$request->user()->id,403); $data=$request->validate(['status'=>['required','in:accepted,rejected,completed'],'transport_fee'=>['nullable','numeric','min:0']]); $booking->update(['status'=>$data['status'],'transport_fee'=>$data['transport_fee']??$booking->transport_fee]); return response()->json(['booking'=>$booking]); }
    public function cancel(Request $request, Booking $booking): JsonResponse { abort_unless($booking->client_id===$request->user()->id,403); abort_if(in_array($booking->status,['completed','cancelled']),422); $booking->update(['status'=>'cancelled']); return response()->json(['booking'=>$booking]); }
}
