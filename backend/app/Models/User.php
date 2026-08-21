<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use App\Models\ClientProfile;
use App\Models\TechnicianProfile;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Favorite;

#[Fillable(['name', 'role', 'email', 'password', 'api_token_hash'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public function clientProfile(): HasOne { return $this->hasOne(ClientProfile::class); }

    public function technicianProfile(): HasOne { return $this->hasOne(TechnicianProfile::class); }

    public function favorites(): HasMany { return $this->hasMany(Favorite::class, 'client_id'); }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
