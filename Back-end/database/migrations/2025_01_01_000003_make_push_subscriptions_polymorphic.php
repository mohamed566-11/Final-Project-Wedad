<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';

        if ($isSqlite) {
            // SQLite doesn't support dropForeign/dropColumn — recreate the table
            Schema::create('push_subscriptions_new', function (Blueprint $table) {
                $table->id();
                $table->string('subscribable_type')->default('App\\Models\\User');
                $table->unsignedBigInteger('subscribable_id')->default(0);
                $table->string('endpoint', 500)->unique();
                $table->string('p256dh_key');
                $table->string('auth_key');
                $table->string('user_agent')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();
                $table->index(['subscribable_type', 'subscribable_id'], 'push_sub_morphs_index');
            });

            // Copy data (user_id → subscribable_id)
            if (Schema::hasColumn('push_subscriptions', 'user_id')) {
                $items = DB::table('push_subscriptions')->get();
                foreach($items as $item) {
                    DB::table('push_subscriptions_new')->insert([
                        'id' => $item->id,
                        'subscribable_type' => 'App\\Models\\User',
                        'subscribable_id' => $item->user_id,
                        'endpoint' => $item->endpoint,
                        'p256dh_key' => $item->p256dh_key,
                        'auth_key' => $item->auth_key,
                        'user_agent' => $item->user_agent,
                        'last_used_at' => $item->last_used_at,
                        'created_at' => $item->created_at,
                        'updated_at' => $item->updated_at
                    ]);
                }
            }

            Schema::drop('push_subscriptions');
            Schema::rename('push_subscriptions_new', 'push_subscriptions');
        } else {
            Schema::table('push_subscriptions', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
                $table->string('subscribable_type')->default('App\\Models\\User')->after('id');
                $table->unsignedBigInteger('subscribable_id')->default(0)->after('subscribable_type');
                $table->index(['subscribable_type', 'subscribable_id'], 'push_sub_morphs_index');
            });

            DB::table('push_subscriptions')->update([
                'subscribable_id'   => DB::raw('user_id'),
                'subscribable_type' => 'App\\Models\\User',
            ]);

            Schema::table('push_subscriptions', function (Blueprint $table) {
                $table->dropColumn('user_id');
            });
        }
    }

    public function down(): void
    {
        $isSqlite = DB::getDriverName() === 'sqlite';

        if ($isSqlite) {
            Schema::create('push_subscriptions_old', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                $table->string('endpoint')->unique();
                $table->text('public_key')->nullable();
                $table->text('auth_token')->nullable();
                $table->string('content_encoding')->nullable();
                $table->timestamps();
            });
            Schema::drop('push_subscriptions');
            Schema::rename('push_subscriptions_old', 'push_subscriptions');
        } else {
            Schema::table('push_subscriptions', function (Blueprint $table) {
                $table->dropIndex('push_sub_morphs_index');
                $table->dropColumn(['subscribable_type', 'subscribable_id']);
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            });
        }
    }
};
