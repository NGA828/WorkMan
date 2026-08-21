<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Booking extends Model { protected $fillable=['client_id','technician_profile_id','service_id','scheduled_at','duration_minutes','notes','transport_fee','transport_payment_status','status']; protected $casts=['scheduled_at'=>'datetime','duration_minutes'=>'integer','transport_fee'=>'decimal:2']; public function client(): BelongsTo{return $this->belongsTo(User::class,'client_id');} public function technician(): BelongsTo{return $this->belongsTo(TechnicianProfile::class,'technician_profile_id');} public function service(): BelongsTo{return $this->belongsTo(Service::class);} public function payments(): HasMany{return $this->hasMany(Payment::class);} }
