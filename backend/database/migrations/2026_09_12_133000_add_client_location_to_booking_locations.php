<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('booking_locations', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->change();
            $table->decimal('longitude', 10, 7)->nullable()->change();
            $table->decimal('client_latitude', 10, 7)->nullable()->after('longitude');
            $table->decimal('client_longitude', 10, 7)->nullable()->after('client_latitude');
            $table->timestamp('client_recorded_at')->nullable()->after('recorded_at');
        });
    }

    public function down(): void
    {
        Schema::table('booking_locations', function (Blueprint $table) {
            $table->dropColumn(['client_latitude', 'client_longitude', 'client_recorded_at']);
        });
    }
};
