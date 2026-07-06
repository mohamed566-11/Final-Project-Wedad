<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();

            $table->string('method', 10);
            $table->string('endpoint', 255);
            $table->string('action', 120)->nullable();

            $table->string('resource_type', 100)->nullable();
            $table->string('resource_id', 100)->nullable();

            $table->unsignedSmallInteger('status_code')->default(200);
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            $table->json('request_data')->nullable();
            $table->string('response_message', 500)->nullable();
            $table->json('metadata')->nullable();

            $table->timestamp('created_at')->useCurrent();

            $table->index(['admin_id', 'created_at']);
            $table->index(['method', 'created_at']);
            $table->index(['status_code', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
