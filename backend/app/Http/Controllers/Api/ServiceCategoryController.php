<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
class ServiceCategoryController extends Controller { public function index(): JsonResponse { return response()->json(['categories'=>ServiceCategory::where('is_active',true)->orderBy('name')->get(['id','name','slug','description'])]); } }
