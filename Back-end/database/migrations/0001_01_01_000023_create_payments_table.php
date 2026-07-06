<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * ✅ Consolidated: includes performance indexes from:
     *   - 2026_02_04_220000_add_performance_indexes (payments portion)
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('consultation_id')->constrained('consultations')->onDelete('cascade');
            $table->string('transaction_id')->unique();
            $table->decimal('amount', 8, 2);
            $table->decimal('platform_fee', 8, 2)->nullable();
            $table->decimal('doctor_amount', 8, 2)->nullable();
            $table->enum('status', ['pending', 'completed', 'failed', 'refunded'])->default('pending');
            $table->enum('payment_method', ['paymob_card', 'paymob_wallet', 'paymob_installments', 'cash']);
            $table->json('paymob_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamps();

            // ← Performance indexes مدموجة من 2026_02_04_220000
            $table->index('status', 'idx_payments_status');
            $table->index('created_at', 'idx_payments_created');
            $table->index(['status', 'created_at'], 'idx_payments_status_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
