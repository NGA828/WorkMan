<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('technician_profiles', function (Blueprint $table) { $table->decimal('average_rating', 3, 2)->default(0)->after('verification_status'); $table->unsignedInteger('reviews_count')->default(0)->after('average_rating'); });
        Schema::create('favorites', function (Blueprint $table) { $table->id(); $table->foreignId('client_id')->constrained('users')->cascadeOnDelete(); $table->foreignId('technician_profile_id')->constrained()->cascadeOnDelete(); $table->timestamps(); $table->unique(['client_id','technician_profile_id']); });
    }
    public function down(): void { Schema::dropIfExists('favorites'); Schema::table('technician_profiles', fn (Blueprint $table) => $table->dropColumn(['average_rating','reviews_count'])); }
};
