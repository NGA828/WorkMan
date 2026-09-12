<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        DB::statement(
            "ALTER TABLE payments MODIFY status ENUM('pending', 'paid', 'held', 'released', 'failed', 'refunded') NOT NULL DEFAULT 'pending'"
        );
    }

    public function down(): void
    {
        DB::table('payments')
            ->whereIn('status', ['held', 'released'])
            ->update(['status' => 'paid']);

        DB::statement(
            "ALTER TABLE payments MODIFY status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending'"
        );
    }
};
