<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingLocation extends Model
{
    protected $fillable = [
        'booking_id',
        'latitude',
        'longitude',
        'recorded_at',
        'client_latitude',
        'client_longitude',
        'client_recorded_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'recorded_at' => 'datetime',
        'client_latitude' => 'float',
        'client_longitude' => 'float',
        'client_recorded_at' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }
}
