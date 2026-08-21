<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('conversations', function (Blueprint $table) { $table->id(); $table->foreignId('client_id')->constrained('users')->cascadeOnDelete(); $table->foreignId('technician_profile_id')->constrained()->cascadeOnDelete(); $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete(); $table->timestamp('last_message_at')->nullable(); $table->timestamps(); $table->unique(['client_id','technician_profile_id','booking_id']); });
        Schema::create('messages', function (Blueprint $table) { $table->id(); $table->foreignId('conversation_id')->constrained()->cascadeOnDelete(); $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete(); $table->text('body'); $table->timestamp('read_at')->nullable(); $table->timestamps(); $table->index(['conversation_id','created_at']); });
    }
    public function down(): void { Schema::dropIfExists('messages'); Schema::dropIfExists('conversations'); }
};
