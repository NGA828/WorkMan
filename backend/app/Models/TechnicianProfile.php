<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class TechnicianProfile extends Model { protected $fillable=['bio','years_experience','phone','avatar_path','verification_status']; protected $casts=['years_experience'=>'integer']; public function user(): BelongsTo { return $this->belongsTo(User::class); } public function services(): HasMany { return $this->hasMany(Service::class); } public function locations(): HasMany { return $this->hasMany(ServiceLocation::class); } public function workingHours(): HasMany { return $this->hasMany(WorkingHour::class); } }
