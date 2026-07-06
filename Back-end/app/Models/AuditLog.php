<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'method',
        'endpoint',
        'action',
        'resource_type',
        'resource_id',
        'status_code',
        'ip_address',
        'user_agent',
        'request_data',
        'response_message',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'request_data' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}
