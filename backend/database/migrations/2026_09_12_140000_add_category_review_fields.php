<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('service_categories', function (Blueprint $table) {
            $table->string('approval_status')->default('approved')->after('is_active');
            $table->foreignId('requested_by')->nullable()->after('approval_status')
                ->constrained('technician_profiles')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('service_categories', function (Blueprint $table) {
            $table->dropForeign(['requested_by']);
            $table->dropColumn(['approval_status', 'requested_by']);
        });
    }
};
