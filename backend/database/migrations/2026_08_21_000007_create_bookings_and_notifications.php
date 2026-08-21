<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('technician_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('scheduled_at');
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->text('notes')->nullable();
            $table->decimal('transport_fee', 12, 2)->nullable();
            $table->string('transport_payment_status')->default('unpaid');
            $table->enum('status', [
                'pending',    // client requested, waiting on the technician
                'accepted',   // technician accepted, transport fee set
                'in_progress',// technician arrived and is working
                'done',       // technician finished, waiting for client confirmation
                'rejected',   // technician declined the request
                'cancelled',  // client cancelled before acceptance
                'completed',  // client confirmed the job as done
            ])->default('pending');
            $table->timestamps();
            $table->index(['technician_profile_id', 'scheduled_at']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('bookings');
    }
};
