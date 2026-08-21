<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Favorite extends Model { protected $fillable=['client_id','technician_profile_id']; public function technician(): BelongsTo { return $this->belongsTo(TechnicianProfile::class,'technician_profile_id'); } public function client(): BelongsTo { return $this->belongsTo(User::class,'client_id'); } }
