<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Review extends Model { protected $fillable=['booking_id','client_id','technician_profile_id','rating','body']; protected $casts=['rating'=>'integer']; public function booking():BelongsTo{return $this->belongsTo(Booking::class);} public function client():BelongsTo{return $this->belongsTo(User::class,'client_id');} public function technician():BelongsTo{return $this->belongsTo(TechnicianProfile::class,'technician_profile_id');} }
