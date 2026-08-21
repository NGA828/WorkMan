<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Models\TechnicianProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class TechnicianDiscoveryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query=TechnicianProfile::query()->where('verification_status','approved')->with(['user:id,name,email','services.category','locations']);
        if($request->filled('q')) $query->whereHas('user',fn($q)=>$q->where('name','like','%'.$request->string('q').'%'));
        if($request->filled('category')) $query->whereHas('services',fn($q)=>$q->where('service_category_id',$request->integer('category')));
        if($request->filled('city')) $query->whereHas('locations',fn($q)=>$q->where('city','like','%'.$request->string('city').'%'));
        if($request->filled('min_rating')) $query->where('average_rating','>=',$request->float('min_rating'));
        if($request->boolean('available')) $query->whereHas('workingHours',fn($q)=>$q->where('is_available',true)->where('day_of_week',now()->dayOfWeek));
        return response()->json(['technicians'=>$query->latest()->paginate(12)]);
    }
    public function show(TechnicianProfile $technician): JsonResponse { abort_unless($technician->verification_status==='approved',404); return response()->json(['technician'=>$technician->load(['user:id,name','services.category','locations','workingHours'])]); }
    public function favorite(Request $request, TechnicianProfile $technician): JsonResponse { abort_unless($technician->verification_status==='approved',404); $favorite=Favorite::firstOrCreate(['client_id'=>$request->user()->id,'technician_profile_id'=>$technician->id]); return response()->json(['favorite'=>true,'id'=>$favorite->id],201); }
    public function unfavorite(Request $request, TechnicianProfile $technician): JsonResponse { Favorite::where('client_id',$request->user()->id)->where('technician_profile_id',$technician->id)->delete(); return response()->json(['favorite'=>false]); }
    public function favorites(Request $request): JsonResponse { return response()->json(['technicians'=>$request->user()->favorites()->with('technician.user:id,name','technician.services.category','technician.locations')->get()->pluck('technician')]); }
}
