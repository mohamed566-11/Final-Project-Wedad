<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasApiTokens, SoftDeletes, Notifiable, HasFactory;

    // protected $guard = 'admin';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'is_active',
        'role_id',
        'image',
        'last_login_at',
        'notification_settings',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login_at' => 'datetime',
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'notification_settings' => 'array',
    ];

    // Relationships
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function reviewedArticles()
    {
        return $this->hasMany(Article::class, 'reviewed_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // Helper methods
    public function hasPermission($permission)
    {
        if ($this->isSuperAdmin()) {
            return true;
        }
        return in_array($permission, $this->role->permissions ?? []);
    }

    public function isSuperAdmin()
    {
        return $this->role->role === 'super_admin';
    }
}
