<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class ReviewController extends Controller
{
 public function index(int $technician):JsonResponse { return response()->json(['reviews'=>Review::where('technician_profile_id',$technician)->with('client:id,name')->latest()->paginate(15)]); }
 public function store(Request $request):JsonResponse { $data=$request->validate(['booking_id'=>['required','exists:bookings,id'],'rating'=>['required','integer','between:1,5'],'body'=>['nullable','string','max:2000']]);$booking=Booking::where('id',$data['booking_id'])->where('client_id',$request->user()->id)->with('technician')->firstOrFail();if($booking->status!=='completed')return response()->json(['message'=>'A review can be added after the booking is completed.'],422);if($booking->review) return response()->json(['message'=>'This booking has already been reviewed.'],422);$review=DB::transaction(function()use($data,$booking,$request){$review=Review::create([...$data,'client_id'=>$request->user()->id,'technician_profile_id'=>$booking->technician_profile_id]);$summary=$booking->technician->reviews()->selectRaw('AVG(rating) as average, COUNT(*) as total')->first();$booking->technician->update(['average_rating'=>round((float)$summary->average,2),'reviews_count'=>(int)$summary->total]);return $review;});return response()->json(['review'=>$review->load('client:id,name')],201); }
}
