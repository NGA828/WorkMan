<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up():void { Schema::create('reviews',function(Blueprint $table){$table->id();$table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();$table->foreignId('client_id')->constrained('users')->cascadeOnDelete();$table->foreignId('technician_profile_id')->constrained()->cascadeOnDelete();$table->unsignedTinyInteger('rating');$table->text('body')->nullable();$table->timestamps();}); }
 public function down():void {Schema::dropIfExists('reviews');}
};
