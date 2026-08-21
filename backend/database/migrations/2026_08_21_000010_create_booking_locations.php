<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::create('booking_locations', function (Blueprint $table) { $table->id(); $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete(); $table->decimal('latitude',10,7); $table->decimal('longitude',10,7); $table->timestamp('recorded_at'); $table->timestamps(); }); }
    public function down(): void { Schema::dropIfExists('booking_locations'); }
};
