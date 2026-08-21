<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ServiceLocation extends Model { protected $fillable=['city','neighborhood','latitude','longitude']; protected $casts=['latitude'=>'decimal:7','longitude'=>'decimal:7']; public function technicianProfile(): BelongsTo { return $this->belongsTo(TechnicianProfile::class); } }
