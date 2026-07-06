<?php

namespace Tests\Feature\Notifications;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use App\Models\User;
use App\Models\Doctor;
use App\Jobs\SendBulkNotificationJob;
use App\Models\Admin;

class SendBulkNotificationJobTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin()
    {
        $role = \App\Models\Role::firstOrCreate(['role' => 'admin'], ['permissions' => [], 'description' => 'test']);
        return Admin::create(['name' => 'admin', 'email' => 'admin@test.com', 'password' => 'pass', 'is_active' => true, 'role_id' => $role->id]);
    }

    public function test_bulk_notification_job_handles_all_target()
    {
        $admin = $this->makeAdmin();

        // 2 active patients, 1 active doctor
        User::factory()->count(2)->create(['is_active' => true]);
        Doctor::factory()->count(1)->create(['is_active' => true]);

        // 1 inactive patient, shouldn't get notification
        User::factory()->create(['is_active' => false]);

        $historyId = DB::table('notification_history')->insertGetId([
            'admin_id' => $admin->id,
            'title' => 'Test',
            'message' => 'Sys Msg',
            'type' => 'announcement',
            'target' => 'all',
            // Uses scheduled so SQLite tests pass since pending might not be accepted in memory DB before alter executes
            'status' => 'scheduled'
        ]);

        $job = new SendBulkNotificationJob('all', [
            'type' => 'announcement',
            'title' => 'Test',
            'message' => 'Sys Msg'
        ], $historyId);

        $job->handle();

        // 2 patients + 1 doctor = 3
        $this->assertEquals(3, DB::table('notifications')->count());

        $history = DB::table('notification_history')->find($historyId);
        $this->assertEquals('sent', $history->status);
    }

    public function test_bulk_notification_job_handles_doctors_only()
    {
        $admin = $this->makeAdmin();

        User::factory()->count(2)->create(['is_active' => true]);
        Doctor::factory()->count(3)->create(['is_active' => true]);

        $historyId = DB::table('notification_history')->insertGetId([
            'admin_id' => $admin->id,
            'title' => 'Doctors Update',
            'message' => 'Doctor only Msg',
            'type' => 'update',
            'target' => 'doctors',
            'status' => 'scheduled'
        ]);

        $job = new SendBulkNotificationJob('doctors', [
            'type' => 'update',
            'title' => 'Doctors Update',
            'message' => 'Doctor only Msg'
        ], $historyId);

        $job->handle();

        // Only doctors received it
        $this->assertEquals(3, DB::table('notifications')->where('notifiable_type', Doctor::class)->count());
        $this->assertEquals(0, DB::table('notifications')->where('notifiable_type', User::class)->count());

        $history = DB::table('notification_history')->find($historyId);
        $this->assertEquals('sent', $history->status);
    }
}
