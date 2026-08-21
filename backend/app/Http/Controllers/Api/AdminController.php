<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\ServiceCategory;
use App\Models\TechnicianProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
class AdminController extends Controller
{
 public function summary():JsonResponse{return response()->json(['users'=>User::count(),'clients'=>User::where('role','client')->count(),'technicians'=>User::where('role','provider')->count(),'pending_verification'=>TechnicianProfile::where('verification_status','pending')->count(),'approved_technicians'=>TechnicianProfile::where('verification_status','approved')->count(),'categories'=>ServiceCategory::where('is_active',true)->count(),'reviews'=>Review::count()]);}
 public function users():JsonResponse{return response()->json(['users'=>User::query()->select('id','name','email','role','created_at')->latest()->paginate(25)]);}
 public function technicians():JsonResponse{return response()->json(['technicians'=>TechnicianProfile::with('user:id,name,email')->latest()->paginate(25)]);}
 public function verify(Request $request,TechnicianProfile $technician):JsonResponse{$data=$request->validate(['verification_status'=>['required','in:approved,rejected,pending']]);$technician->update($data);return response()->json(['technician'=>$technician->load('user:id,name,email')]);}
 public function categories():JsonResponse{return response()->json(['categories'=>ServiceCategory::latest()->get()]);}
 public function createCategory(Request $request):JsonResponse{$data=$request->validate(['name'=>['required','string','max:100','unique:service_categories,name'],'slug'=>['required','alpha_dash','max:100','unique:service_categories,slug'],'description'=>['nullable','string','max:500']]);return response()->json(['category'=>ServiceCategory::create($data)],201);}
 public function updateCategory(Request $request,ServiceCategory $category):JsonResponse{$data=$request->validate(['name'=>['sometimes','string','max:100','unique:service_categories,name,'.$category->id],'description'=>['nullable','string','max:500'],'is_active'=>['sometimes','boolean']]);$category->update($data);return response()->json(['category'=>$category]);}
 public function reviews():JsonResponse{return response()->json(['reviews'=>Review::with(['client:id,name','technician.user:id,name'])->latest()->paginate(25)]);}
}
