<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;
    protected $fillable = [
        'role',
        'permissions',
        'description',
    ];

    protected $casts = [
        'permissions' => 'array',
    ];

    // Relationships
    public function admins()
    {
        return $this->hasMany(Admin::class);
    }
}
