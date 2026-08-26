<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->string('id_document_path')->nullable()->after('avatar_path');
            $table->enum('id_document_status', ['unverified', 'pending', 'verified'])->default('unverified')->after('id_document_path');
        });

        Schema::table('technician_profiles', function (Blueprint $table) {
            $table->string('id_document_path')->nullable()->after('avatar_path');
        });
    }

    public function down(): void
    {
        Schema::table('client_profiles', function (Blueprint $table) {
            $table->dropColumn(['id_document_path', 'id_document_status']);
        });

        Schema::table('technician_profiles', function (Blueprint $table) {
            $table->dropColumn('id_document_path');
        });
    }
};
