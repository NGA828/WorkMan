<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ClientProfile extends Model { protected $fillable=['phone','address','city','avatar_path']; public function user(): BelongsTo { return $this->belongsTo(User::class); } }
