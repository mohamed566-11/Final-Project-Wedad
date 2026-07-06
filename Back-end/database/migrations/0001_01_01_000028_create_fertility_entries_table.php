<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fertility_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('entry_date');
            $table->decimal('bbt', 4, 2)->nullable();
            $table->enum('cervical_mucus', ['dry', 'sticky', 'creamy', 'watery', 'egg_white'])->nullable();
            $table->boolean('ovulation_test_positive')->default(false);
            $table->boolean('intercourse')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fertility_entries');
    }
};
