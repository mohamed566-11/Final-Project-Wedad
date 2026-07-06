# 💬 خطة نظام المجتمع (فضفضة) - وداد تك

## Community (Fad Fada) System - Complete Implementation Plan

---

## 📋 الفهرس

1. [نظرة عامة على النظام](#1-نظرة-عامة-على-النظام)
2. [تحليل الوضع الحالي](#2-تحليل-الوضع-الحالي)
3. [هيكل قاعدة البيانات](#3-هيكل-قاعدة-البيانات)
4. [الباك إند - التفاصيل الكاملة](#4-الباك-إند---التفاصيل-الكاملة)
5. [الفرونت إند - التفاصيل الكاملة](#5-الفرونت-إند---التفاصيل-الكاملة)
6. [النشر المجهول والخصوصية](#6-النشر-المجهول-والخصوصية)
7. [مشاركة الأطباء في المجتمع](#7-مشاركة-الأطباء-في-المجتمع)
8. [لوحة تحكم الأدمن والموديريشن](#8-لوحة-تحكم-الأدمن-والموديريشن)
9. [الأمان ومكافحة الإساءة](#9-الأمان-ومكافحة-الإساءة)
10. [خطة التنفيذ المرحلية](#10-خطة-التنفيذ-المرحلية)
11. [معايير القبول وقياس النجاح](#11-معايير-القبول-وقياس-النجاح)
12. [جاهزية الإنتاج والتشغيل](#12-جاهزية-الإنتاج-والتشغيل)

---

## 1. نظرة عامة على النظام

### 1.1 الهدف

بناء مجتمع نسائي داعم داخل منصة وداد باسم **فضفضة** يسمح بـ:

- ✅ نشر المشاركات (Posts)
- ✅ الردود/التعليقات (Comments)
- ✅ النشر المجهول (Anonymous Posting)
- ✅ الانضمام إلى دوائر مجتمعية (Circles)
- ✅ نظام تفاعل (إعجاب، حفظ، مشاركة)
- ✅ نظام تبليغ ومراجعة متكامل
- ✅ لوحة تحكم أدمن احترافية للموديريشن والتحليلات

### 1.2 نطاق النسخة الأولى (MVP+)

- إنشاء/تعديل/حذف مشاركة
- إنشاء/تعديل/حذف تعليق
- دعم الردود المتداخلة (Reply to Comment) حتى مستوى واحد في البداية
- اختيار النشر باسم حقيقي أو مجهول
- صفحات: موجز المجتمع، تفاصيل المشاركة، إدارة دوائر المستخدم
- تبليغ محتوى مسيء
- أدوات أدمن: إخفاء/حذف/تعليق/حظر

### 1.3 أنواع المحتوى

| النوع                     | الوصف            | أمثلة                  |
| ------------------------- | ---------------- | ---------------------- |
| نصي                       | مشاركة نصية      | فضفضة، سؤال، طلب نصيحة |
| صورة                      | مشاركة مع صورة   | موقف، إنفوجراف، ذكرى   |
| سؤال للنقاش               | منشور مصنف كسؤال | "كيف أوازن بين...؟"    |
| تصويت (اختياري المرحلة 2) | Poll بسيط        | اختيار بين بدائل       |

### 1.4 أدوار المستخدمين

| الدور                        | الصلاحيات                                |
| ---------------------------- | ---------------------------------------- |
| مريضة/مستخدمة                | نشر/تعليق/تبليغ/إعجاب/حفظ                |
| موديراتور (Admin Permission) | مراجعة البلاغات، إخفاء محتوى، إنذار      |
| أدمن                         | كل صلاحيات الإدارة + الإعدادات والسياسات |

---

## 2. تحليل الوضع الحالي

### 2.1 الموجود حاليًا ✅

| العنصر                 | الحالة          | ملاحظات                      |
| ---------------------- | --------------- | ---------------------------- |
| واجهات المنصة الأساسية | ✅ موجودة       | النظام العام جاهز للتوسع     |
| Auth & Roles           | ✅ موجود        | Patient/Doctor/Admin         |
| Notifications System   | ✅ موجود        | قابل لإرسال إشعارات المجتمع  |
| نمط `is_anonymous`     | ✅ موجود جزئيًا | مستخدم في مراجعات الاستشارات |

### 2.2 غير موجود ويجب بناؤه 🔨

| العنصر                                        | الحالة |
| --------------------------------------------- | ------ |
| جداول المجتمع (دوائر/مشاركات/تعليقات/تفاعلات) | ❌     |
| API مجتمع كامل                                | ❌     |
| Services للموديريشن والفلترة                  | ❌     |
| صفحات المجتمع في Frontend                     | ❌     |
| تبليغ/مراجعة المحتوى                          | ❌     |
| أدوات أدمن للمجتمع                            | ❌     |
| مؤشرات وتحليلات المجتمع                       | ❌     |

---

## 3. هيكل قاعدة البيانات

> المبدأ: تصميم مرن يسمح بالتوسع (Attachments, Mentions, Tags, Reactions, Reports).

### 3.1 جدول الدوائر `community_circles`

```php
Schema::create('community_circles', function (Blueprint $table) {
    $table->id();
    $table->string('name');                    // "دائرة أمهات جدد"
    $table->string('name_en')->nullable();     // "New Mothers Circle"
    $table->string('slug')->unique();          // "new-mothers"
    $table->text('description')->nullable();
    $table->text('description_en')->nullable();
    $table->string('cover_image')->nullable();
    $table->string('icon')->nullable();
    $table->boolean('is_private')->default(false);
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('sort_order')->default(0);
    $table->unsignedInteger('members_count')->default(0);   // Counter cache "310 عضوة"
    $table->unsignedInteger('posts_count')->default(0);     // Counter cache "5 مشاركة"

    // إشراف الخبير (من التصميم: "بإشراف الخبير د. أحمد المصري")
    $table->foreignId('supervisor_doctor_id')->nullable()->constrained('doctors')->nullOnDelete();

    $table->foreignId('created_by')->nullable()->constrained('admins')->nullOnDelete();
    $table->timestamps();
    $table->softDeletes();
});
```

### 3.2 جدول عضوية الدوائر `community_circle_members`

```php
Schema::create('community_circle_members', function (Blueprint $table) {
    $table->id();
    $table->foreignId('circle_id')->constrained('community_circles')->cascadeOnDelete();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->enum('role', ['member', 'circle_moderator'])->default('member');
    $table->boolean('is_active')->default(true);
    $table->timestamp('joined_at')->nullable();
    $table->timestamps();

    $table->unique(['circle_id', 'user_id']);
});
```

{{FIXED: Added is_active column to community_circle_members migration to match activeMembers() query.}}

### 3.3 جدول المشاركات `community_posts`

```php
Schema::create('community_posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('circle_id')->constrained('community_circles')->cascadeOnDelete();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->string('title')->nullable();
    $table->text('content');
    $table->json('media')->nullable(); // [{type: 'image', url: '...', thumbnail: '...'}]

    // هوية المستخدم
    $table->boolean('is_anonymous')->default(false);
    $table->string('anonymous_alias')->nullable();    // "زهرة أمل"
    $table->string('user_label')->nullable();          // "أم جديدة", "زوجة حائرة", "صديقة قلقة" (من التصميم)

    $table->enum('visibility', ['public', 'circle_only'])->default('public');
    $table->enum('status', ['published', 'hidden', 'archived', 'under_review'])->default('published');

    // تثبيت وقفل
    $table->boolean('is_pinned')->default(false);           // تثبيت أعلى الدائرة
    $table->boolean('is_comments_locked')->default(false);  // قفل التعليقات

    // عدادات
    $table->unsignedInteger('likes_count')->default(0);
    $table->unsignedInteger('comments_count')->default(0);
    $table->unsignedInteger('reports_count')->default(0);
    $table->unsignedInteger('shares_count')->default(0);
    $table->unsignedInteger('views_count')->default(0);     // عدد المشاهدات

    $table->timestamp('published_at')->nullable();
    $table->timestamp('last_activity_at')->nullable();

    $table->timestamps();
    $table->softDeletes();

    $table->index(['circle_id', 'status', 'is_pinned', 'published_at']);
    $table->index(['user_id', 'status']);
    $table->fullText(['title', 'content']);                  // بحث النص الكامل
});
```

### 3.4 جدول التعليقات `community_comments`

```php
Schema::create('community_comments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('parent_id')->nullable()->constrained('community_comments')->cascadeOnDelete();

    $table->text('content');
    $table->boolean('is_anonymous')->default(false);
    $table->string('anonymous_alias')->nullable();

    $table->enum('status', ['published', 'hidden', 'under_review'])->default('published');

    $table->unsignedInteger('likes_count')->default(0);
    $table->unsignedInteger('reports_count')->default(0);

    $table->timestamps();
    $table->softDeletes();

    $table->index(['post_id', 'status', 'created_at']);
});
```

### 3.5 جدول التفاعلات `community_reactions`

```php
Schema::create('community_reactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->morphs('reactable'); // post/comment
    $table->enum('type', ['like', 'support', 'care'])->default('like');
    $table->timestamps();

    $table->unique(['user_id', 'reactable_type', 'reactable_id', 'type'], 'unique_user_reaction');
});
```

### 3.6 جدول التبليغات `community_reports`

```php
Schema::create('community_reports', function (Blueprint $table) {
    $table->id();
    $table->foreignId('reporter_user_id')->constrained('users')->cascadeOnDelete();
    $table->morphs('reportable'); // post/comment

    $table->enum('reason', [
        'harassment',
        'hate_speech',
        'sexual_content',
        'misinformation',
        'violence',
        'spam',
        'self_harm',
        'other'
    ]);

    $table->text('details')->nullable();
    $table->enum('status', ['pending', 'reviewing', 'resolved', 'rejected'])->default('pending');

    $table->foreignId('handled_by')->nullable()->constrained('admins')->nullOnDelete();
    $table->text('admin_note')->nullable();
    $table->timestamp('handled_at')->nullable();

    $table->timestamps();

    $table->index(['status', 'created_at']);
    $table->unique(['reporter_user_id', 'reportable_type', 'reportable_id'], 'unique_user_report');
});
```

{{FIXED: Added unique constraint to prevent duplicate reports from the same user on the same target.}}

### 3.7 جدول حفظ المشاركات `community_saved_posts`

```php
Schema::create('community_saved_posts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
    $table->timestamps();

    $table->unique(['user_id', 'post_id']);
});
```

### 3.8 جدول التاجات `community_tags`

```php
Schema::create('community_tags', function (Blueprint $table) {
    $table->id();
    $table->string('name');           // "الأمومة والطفولة"
    $table->string('name_en')->nullable();
    $table->string('slug')->unique(); // "motherhood"
    $table->string('color')->nullable(); // لون البادج
    $table->boolean('is_active')->default(true);
    $table->unsignedInteger('posts_count')->default(0);
    $table->timestamps();
});
```

### 3.9 جدول ربط التاجات بالمشاركات `community_post_tag`

```php
Schema::create('community_post_tag', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained('community_tags')->cascadeOnDelete();
    $table->primary(['post_id', 'tag_id']);
});
```

### 3.10 جدول تعليق المستخدمين من المجتمع `community_suspensions`

```php
Schema::create('community_suspensions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
    $table->text('reason');
    $table->timestamp('suspended_at');
    $table->timestamp('expires_at')->nullable();  // null = دائم
    $table->boolean('is_active')->default(true);
    $table->timestamps();

    $table->index(['user_id', 'is_active']);
});
```

> ملاحظة تنفيذية: قبل إنشاء تعليق جديد لمستخدم، يجب على الخدمة تعطيل أي تعليقات فعالة سابقة لنفس المستخدم عبر `is_active = false` ثم إنشاء السجل الجديد.

{{FIXED: Added active-suspension uniqueness handling note at service layer before insert.}}

### 3.11 جدول إجراءات الموديريشن `community_moderation_actions`

```php
Schema::create('community_moderation_actions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('admin_id')->constrained('admins')->cascadeOnDelete();
    $table->morphs('targetable'); // post/comment/user
    $table->enum('action', ['hide', 'unhide', 'delete', 'warn_user', 'suspend_user', 'lock_comments']);
    $table->text('reason')->nullable();
    $table->json('meta')->nullable();
    $table->timestamps();
});
```

### 3.12 تعديل جدول `users`

```php
// Migration: add_community_fields_to_users.php
Schema::table('users', function (Blueprint $table) {
    $table->boolean('community_guidelines_accepted')->default(false);
    $table->timestamp('community_guidelines_accepted_at')->nullable();
});
```

### 3.13 جدول الأسماء المستعارة للمجهول `community_user_aliases`

```php
Schema::create('community_user_aliases', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
    $table->foreignId('circle_id')->constrained('community_circles')->cascadeOnDelete();
    $table->string('alias');
    $table->timestamps();

    $table->unique(['user_id', 'circle_id']);
});
```

{{FIXED: Added community_user_aliases migration with unique(user_id, circle_id) for per-user-per-circle anonymous alias persistence.}}

### 3.14 ERD - العلاقات الأساسية

```text
┌──────────┐     ┌──────────────────┐     ┌───────────────────┐
│  users   │────<│ community_posts  │>────│ community_circles │
└──────────┘     └──────────────────┘     └───────────────────┘
      │                │       │                    │
      │                │       └──< community_post_tag >── community_tags
      │                │
      │                └──< community_comments (self parent_id)
      │
      ├──< community_reactions (morph: post/comment)
      ├──< community_reports (morph: post/comment)
      ├──< community_saved_posts >── community_posts
      ├──< community_circle_members >── community_circles
      └──< community_suspensions

community_circles >── doctors (supervisor_doctor_id)
```

---

## 4. الباك إند - التفاصيل الكاملة

### 4.1 Models

#### `CommunityCircle.php`

```php
class CommunityCircle extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'name_en', 'slug', 'description', 'description_en',
        'cover_image', 'icon', 'is_private', 'is_active',
        'sort_order', 'members_count', 'posts_count',
        'supervisor_doctor_id', 'created_by',
    ];

    protected $casts = [
        'is_private' => 'boolean',
        'is_active' => 'boolean',
    ];

    // --- Relationships ---
    public function posts() { return $this->hasMany(CommunityPost::class, 'circle_id'); }
    public function members() { return $this->hasMany(CommunityCircleMember::class, 'circle_id'); }
    public function supervisorDoctor() { return $this->belongsTo(Doctor::class, 'supervisor_doctor_id'); }
    public function creator() { return $this->belongsTo(Admin::class, 'created_by'); }
    public function activeMembers() { return $this->members()->where('is_active', true); }

    // --- Scopes ---
    public function scopeActive($q) { return $q->where('is_active', true); }
    public function scopeOrdered($q) { return $q->orderBy('sort_order'); }
    public function scopeWithSupervisor($q) { return $q->with('supervisorDoctor'); }
}
```

#### `CommunityPost.php`

```php
class CommunityPost extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'circle_id', 'user_id', 'title', 'content', 'media',
        'is_anonymous', 'anonymous_alias', 'user_label',
        'visibility', 'status', 'is_pinned', 'is_comments_locked',
        'likes_count', 'comments_count', 'reports_count',
        'shares_count', 'views_count',
        'published_at', 'last_activity_at',
    ];

    protected $casts = [
        'media' => 'array',
        'is_anonymous' => 'boolean',
        'is_pinned' => 'boolean',
        'is_comments_locked' => 'boolean',
        'published_at' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    // --- Relationships ---
    public function circle() { return $this->belongsTo(CommunityCircle::class, 'circle_id'); }
    public function user() { return $this->belongsTo(User::class); }
    public function comments() { return $this->hasMany(CommunityComment::class, 'post_id'); }
    public function reactions() { return $this->morphMany(CommunityReaction::class, 'reactable'); }
    public function reports() { return $this->morphMany(CommunityReport::class, 'reportable'); }
    public function savedByUsers() { return $this->hasMany(CommunitySavedPost::class, 'post_id'); }
    public function tags() { return $this->belongsToMany(CommunityTag::class, 'community_post_tag', 'post_id', 'tag_id'); }

    // --- Scopes ---
    public function scopePublished($q) { return $q->where('status', 'published'); }
    public function scopePinned($q) { return $q->where('is_pinned', true); }
    public function scopeNotPinned($q) { return $q->where('is_pinned', false); }
    public function scopeSearch($q, $term) {
        return $q->whereFullText(['title', 'content'], $term);
    }

    // --- Methods ---
    public function isVisibleTo(User $user): bool { /* ... */ }
    public function canEdit(User $user): bool {
        // فقط صاحب المشاركة + خلال 30 دقيقة من النشر
        return $this->user_id === $user->id
            && $this->created_at->diffInMinutes(now()) <= 30;
    }
    public function presentAuthorName(): string {
        return $this->is_anonymous ? $this->anonymous_alias : $this->user->name;
    }
}
```

#### `CommunityComment.php`

```php
class CommunityComment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'post_id', 'user_id', 'parent_id', 'content',
        'is_anonymous', 'anonymous_alias', 'status',
        'likes_count',
    ];

    protected $casts = ['is_anonymous' => 'boolean'];

    public function post() { return $this->belongsTo(CommunityPost::class, 'post_id'); }
    public function user() { return $this->belongsTo(User::class); }
    public function parent() { return $this->belongsTo(self::class, 'parent_id'); }
    public function replies() { return $this->hasMany(self::class, 'parent_id'); }
    public function reactions() { return $this->morphMany(CommunityReaction::class, 'reactable'); }
    public function reports() { return $this->morphMany(CommunityReport::class, 'reportable'); }
}
```

#### `CommunityReport.php`

```php
class CommunityReport extends Model
{
    protected $fillable = [
        'reporter_user_id', 'reason', 'details', 'status',
        'handled_by', 'admin_note', 'handled_at',
    ];

    protected $casts = ['handled_at' => 'datetime'];

    public function reportable() { return $this->morphTo(); }
    public function reporter() { return $this->belongsTo(User::class, 'reporter_user_id'); }
    public function handler() { return $this->belongsTo(Admin::class, 'handled_by'); }

    public function markResolved(Admin $admin, ?string $note = null) { /* ... */ }
    public function markRejected(Admin $admin, ?string $note = null) { /* ... */ }
}
```

#### `CommunityTag.php`

```php
class CommunityTag extends Model
{
    protected $fillable = ['name', 'name_en', 'slug', 'color', 'is_active', 'posts_count'];
    protected $casts = ['is_active' => 'boolean'];

    public function posts() { return $this->belongsToMany(CommunityPost::class, 'community_post_tag', 'tag_id', 'post_id'); }
    public function scopeActive($q) { return $q->where('is_active', true); }
}
```

#### `CommunitySuspension.php`

```php
class CommunitySuspension extends Model
{
    protected $fillable = ['user_id', 'admin_id', 'reason', 'suspended_at', 'expires_at', 'is_active'];
    protected $casts = ['suspended_at' => 'datetime', 'expires_at' => 'datetime', 'is_active' => 'boolean'];

    public function user() { return $this->belongsTo(User::class); }
    public function admin() { return $this->belongsTo(Admin::class); }
    public function isExpired(): bool { return $this->expires_at && $this->expires_at->isPast(); }
}
```

#### تعديل `User.php` (إضافات المجتمع)

> مثل ما تم تعديل User Model في خطة الاشتراكات، يجب إضافة العلاقات التالية:

```php
// === Community Relations (إضافة في User.php) ===

public function communityPosts()
{
    return $this->hasMany(CommunityPost::class);
}

public function communityComments()
{
    return $this->hasMany(CommunityComment::class);
}

public function savedPosts()
{
    return $this->hasMany(CommunitySavedPost::class);
}

public function joinedCircles()
{
    return $this->hasMany(CommunityCircleMember::class);
}

public function communitySuspensions()
{
    return $this->hasMany(CommunitySuspension::class);
}

public function isCommunitySuspended(): bool
{
    return $this->communitySuspensions()
        ->where('is_active', true)
        ->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        })->exists();
}

public function hasAcceptedCommunityGuidelines(): bool
{
    return (bool) $this->community_guidelines_accepted;
}
```

### 4.2 Resources (API Responses)

#### `CommunityPostResource.php`

```php
class CommunityPostResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'media' => $this->media,
            'circle' => new CommunityCircleResource($this->whenLoaded('circle')),

            // هوية الكاتب (مجهول/حقيقي)
            'author' => $this->is_anonymous ? [
                'name' => $this->anonymous_alias,
                'avatar' => null,
                'is_anonymous' => true,
            ] : [
                'id' => $this->user_id,
                'name' => $this->user?->name,
                'avatar' => $this->user?->image,
                'is_anonymous' => false,
            ],
            'user_label' => $this->user_label,

            'tags' => CommunityTagResource::collection($this->whenLoaded('tags')),
            'visibility' => $this->visibility,
            'status' => $this->status,
            'is_pinned' => $this->is_pinned,
            'is_comments_locked' => $this->is_comments_locked,

            // العدادات
            'likes_count' => $this->likes_count,
            'comments_count' => $this->comments_count,
            'shares_count' => $this->shares_count,
            'views_count' => $this->views_count,

            // حالة المستخدم الحالي
            'is_liked' => auth()->check()
                ? $this->reactions()->where('user_id', auth()->id())->exists()
                : false,
            'is_saved' => auth()->check()
                ? $this->savedByUsers()->where('user_id', auth()->id())->exists()
                : false,
            'is_mine' => $this->user_id === auth()->id(),
            'can_edit' => $this->canEdit(auth()->user()),

            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'time_ago' => $this->created_at->diffForHumans(),
        ];
    }
}
```

{{FIXED: Replaced profile_picture with image and implemented concrete is_liked/is_saved checks in CommunityPostResource.}}

#### `CommunityCircleResource.php`

```php
class CommunityCircleResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'name_en' => $this->name_en,
            'slug' => $this->slug,
            'description' => $this->description,
            'cover_image' => $this->cover_image,
            'icon' => $this->icon,
            'is_private' => $this->is_private,
            'members_count' => $this->members_count,
            'posts_count' => $this->posts_count,
            'supervisor' => $this->whenLoaded('supervisorDoctor', fn() => [
                'id' => $this->supervisorDoctor->id,
                'name' => $this->supervisorDoctor->name,
                'avatar' => $this->supervisorDoctor->image,
                'specialty' => $this->supervisorDoctor->specialty,
            ]),
            'is_joined' => $this->when(
                auth()->check(),
                fn() => $this->members->contains('user_id', auth()->id())
            ),
        ];
    }
}
```

{{FIXED: Corrected supervisor doctor relation access to direct Doctor fields (name, image).}}

#### `CommunityCommentResource.php`

```php
class CommunityCommentResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'author' => $this->is_anonymous ? [
                'name' => $this->anonymous_alias,
                'avatar' => null,
                'is_anonymous' => true,
            ] : [
                'id' => $this->user_id,
                'name' => $this->user?->name,
                'avatar' => $this->user?->image,
                'is_anonymous' => false,
            ],
            'likes_count' => $this->likes_count,
            'is_liked' => auth()->check()
                ? $this->reactions()->where('user_id', auth()->id())->exists()
                : false,
            'replies' => self::collection($this->whenLoaded('replies')),
            'replies_count' => $this->replies()->count(),
            'is_mine' => $this->user_id === auth()->id(),
            'created_at' => $this->created_at->toISOString(),
            'time_ago' => $this->created_at->diffForHumans(),
        ];
    }
}
```

{{FIXED: Replaced profile_picture with image and implemented concrete is_liked check in CommunityCommentResource.}}

#### `CommunityTagResource.php`

```php
class CommunityTagResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'color' => $this->color,
            'posts_count' => $this->posts_count,
        ];
    }
}
```

### 4.3 Services

#### `CommunityService.php` (الخدمة الرئيسية)

- `createPost($user, array $data)`
  1. التحقق من صلاحية النشر
  2. فلترة النص (bad words + unsafe content)
  3. توليد alias عند anonymous
  4. حفظ المشاركة + تحديث العدادات
  5. إشعار أعضاء الدائرة (اختياري)

- `updatePost($post, $user, array $data)`
- `deletePost($post, $user)`
- `toggleReaction($reactable, $user, $type = 'like')`
- `savePost($post, $user)`
- `unsavePost($post, $user)`
- `createComment($post, $user, array $data)`
- `deleteComment($comment, $user)`
- `reportContent($reportable, $user, $reason, $details = null)`

> ملاحظة عدادات الأداء: كل تحديث للعدادات (`likes_count`, `comments_count`, `reports_count`, `shares_count`, `views_count`) يجب أن يتم باستخدام `increment()` و`decrement()` داخل `DB::transaction` لتجنب مشاكل التزامن. مثال: `DB::transaction(fn() => $post->increment('likes_count'));`.

{{FIXED: Added concrete counter-caching strategy using increment/decrement inside DB transactions.}}

#### `CommunityModerationService.php`

- `autoModeratePost($post): array` (flag score)
- `autoModerateComment($comment): array`
- `hideContent($target, $admin, $reason)`
- `restoreContent($target, $admin)`
- `suspendUserFromCommunity($user, $admin, $duration, $reason)`
- `resolveReport($report, $admin, $action, $note)`

#### `CommunityFeedService.php`

- `getMainFeed($user, $filters)`
- `getCircleFeed($circle, $user, $filters)`
- `getTrendingPosts($window = '24h')`
- `rankPosts($query)` معادلة الترتيب:
  - `score = (likes_count * 1) + (comments_count * 2) - (reports_count * 5)`
  - الترتيب: `score DESC` ثم `published_at DESC`
  - المشاركات المثبتة `is_pinned = true` تظهر دائمًا أولاً بغض النظر عن `score`

{{FIXED: Replaced vague ranking description with concrete scoring formula and ordering rules.}}

### 4.4 Controllers

#### Patient API

`app/Http/Controllers/Api/Patient/CommunityController.php`

- `GET /patient/community/feed`
- `GET /patient/community/circles`
- `POST /patient/community/circles/{id}/join`
- `DELETE /patient/community/circles/{id}/leave`
- `POST /patient/community/posts`
- `GET /patient/community/posts/{id}`
- `PUT /patient/community/posts/{id}`
- `DELETE /patient/community/posts/{id}`
- `POST /patient/community/posts/{id}/react`
- `POST /patient/community/posts/{id}/save`
- `DELETE /patient/community/posts/{id}/save`
- `POST /patient/community/posts/{id}/comments`
- `PUT /patient/community/comments/{id}`
- `DELETE /patient/community/comments/{id}`
- `POST /patient/community/comments/{id}/react`
- `POST /patient/community/posts/{id}/report`
- `POST /patient/community/comments/{id}/report`
- `GET /patient/community/saved` — المشاركات المحفوظة
- `GET /patient/community/search?q=...&circle=...&tag=...` — بحث في المشاركات
- `GET /patient/community/tags` — جلب التاجات المتاحة
- `GET /patient/community/guidelines` — إرشادات المجتمع
- `POST /patient/community/guidelines/accept` — قبول إرشادات المجتمع

#### Doctor API

`app/Http/Controllers/Api/Doctor/CommunityDoctorController.php`

- `GET /doctor/community/feed` — المشاركة في المجتمع كخبير
- `GET /doctor/community/circles` — الدوائر المشرف عليها
- `POST /doctor/community/posts/{id}/comments` — تعليق باسم الطبيب
- `POST /doctor/community/posts/{id}/react`

#### Admin API

`app/Http/Controllers/Api/Admin/CommunityAdminController.php`

- `GET /admin/community/posts`
- `GET /admin/community/comments`
- `GET /admin/community/reports`
- `POST /admin/community/reports/{id}/resolve`
- `POST /admin/community/reports/{id}/reject`
- `POST /admin/community/posts/{id}/hide`
- `POST /admin/community/posts/{id}/unhide`
- `DELETE /admin/community/posts/{id}`
- `POST /admin/community/comments/{id}/hide`
- `POST /admin/community/comments/{id}/unhide`
- `DELETE /admin/community/comments/{id}`
- `GET /admin/community/stats`

##### Admin Circle CRUD:

- `GET /admin/community/circles` — جميع الدوائر
- `POST /admin/community/circles` — إنشاء دائرة
- `PUT /admin/community/circles/{id}` — تعديل دائرة
- `DELETE /admin/community/circles/{id}` — حذف دائرة
- `POST /admin/community/circles/{id}/toggle-active` — تفعيل/تعطيل
- `PUT /admin/community/circles/{id}/supervisor` — تعيين طبيب مشرف

##### Admin Tags CRUD:

- `GET /admin/community/tags` — جميع التاجات
- `POST /admin/community/tags` — إنشاء تاج
- `PUT /admin/community/tags/{id}` — تعديل تاج
- `DELETE /admin/community/tags/{id}` — حذف تاج

##### Admin Suspensions:

- `GET /admin/community/suspensions` — قائمة المعلّقين
- `POST /admin/community/users/{id}/suspend` — تعليق مستخدم
- `POST /admin/community/users/{id}/unsuspend` — رفع التعليق
- `POST /admin/community/posts/{id}/pin` — تثبيت مشاركة
- `POST /admin/community/posts/{id}/unpin` — إلغاء التثبيت
- `POST /admin/community/posts/{id}/lock-comments` — قفل التعليقات
- `POST /admin/community/posts/{id}/unlock-comments` — فتح التعليقات

#### `CommunitySearchService.php`

- `searchPosts($query, $filters)` بحث نص كامل (FULLTEXT) مع فلاتر:
  - دائرة، تاج، تاريخ، شائع/أحدث
- `searchByTag($tagSlug, $filters)` فلترة حسب التاج
- `getAutocompleteSuggestions($query)` اقتراحات بحث

### 4.5 Form Requests

- `StoreCommunityPostRequest`
- `UpdateCommunityPostRequest`
- `StoreCommunityCommentRequest`
- `ReportCommunityContentRequest`
- `ModerationActionRequest`

أمثلة قواعد:

- `content: required|string|min:3|max:5000`
- `title: nullable|string|max:180`
- `is_anonymous: boolean`
- `parent_id: nullable|exists:community_comments,id`
- `media.*: image|mimes:jpg,jpeg,png,webp|max:4096`
- `reason: required|in:harassment,hate_speech,sexual_content,misinformation,violence,spam,self_harm,other`

> ملاحظة تنفيذية: داخل `StoreCommunityCommentRequest`/الكنترولر يجب التحقق قبل الحفظ أن التعليق الأب (`parent_id`) ليس له `parent_id` آخر، لضمان حد ردود بمستوى واحد فقط.

{{FIXED: Added parent_id validation rule and explicit controller-level one-level reply enforcement note.}}

### 4.6 Policies

#### `CommunityPostPolicy.php`

```php
class CommunityPostPolicy
{
    // هل يمكنه مشاهدة المشاركة؟
    public function view(User $user, CommunityPost $post): bool
    {
        if ($post->status !== 'published') return false;
        if ($post->visibility === 'circle_only') {
            return $post->circle->members()->where('user_id', $user->id)->exists();
        }
        return true;
    }

    // هل يمكنه إنشاء مشاركة؟
    public function create(User $user): bool
    {
        return !$user->isCommunitySuspended()
            && $user->hasAcceptedCommunityGuidelines();
    }

    // هل يمكنه التعديل؟ (فقط صاحبها + خلال 30 دقيقة)
    public function update(User $user, CommunityPost $post): bool
    {
        return $user->id === $post->user_id
            && $post->created_at->diffInMinutes(now()) <= 30;
    }

    // هل يمكنه الحذف؟ (صاحبها فقط)
    public function delete(User $user, CommunityPost $post): bool
    {
        return $user->id === $post->user_id;
    }

    // هل يمكنه البلاغ؟ (لا يبلّغ على نفسه)
    public function report(User $user, CommunityPost $post): bool
    {
        return $user->id !== $post->user_id;
    }
}
```

#### `CommunityCommentPolicy.php`

```php
class CommunityCommentPolicy
{
    public function create(User $user, CommunityPost $post): bool
    {
        return !$post->is_comments_locked
            && !$user->isCommunitySuspended()
            && $post->status === 'published';
    }

    public function update(User $user, CommunityComment $comment): bool
    {
        return $user->id === $comment->user_id
            && $comment->created_at->diffInMinutes(now()) <= 15;
    }

    public function delete(User $user, CommunityComment $comment): bool
    {
        return $user->id === $comment->user_id;
    }
}
```

#### جدول الصلاحيات

| العملية                  | المريض (صاحب المحتوى) | المريض (آخر) | الطبيب | الأدمن |
| ------------------------ | --------------------- | ------------ | ------ | ------ |
| مشاهدة مشاركة عامة       | ✅                    | ✅           | ✅     | ✅     |
| مشاهدة مشاركة دائرة خاصة | ✅ (عضو)              | ✅ (عضو)     | ✅     | ✅     |
| إنشاء مشاركة             | ✅                    | ✅           | ❌     | ✅     |
| تعديل مشاركة (30 دقيقة)  | ✅                    | ❌           | ❌     | ❌     |
| حذف مشاركة               | ✅                    | ❌           | ❌     | ✅     |
| تثبيت مشاركة             | ❌                    | ❌           | ❌     | ✅     |
| قفل تعليقات              | ❌                    | ❌           | ❌     | ✅     |
| إخفاء/استعادة محتوى      | ❌                    | ❌           | ❌     | ✅     |
| تعليق مستخدم             | ❌                    | ❌           | ❌     | ✅     |
| إدارة الدوائر (CRUD)     | ❌                    | ❌           | ❌     | ✅     |
| إدارة التاجات            | ❌                    | ❌           | ❌     | ✅     |
| بلاغ على محتوى           | ❌                    | ✅           | ✅     | ✅     |
| مشاهدة هوية المجهول      | ❌                    | ❌           | ❌     | ✅     |

{{FIXED: Resolved doctor create-post permission contradiction by setting doctor to ❌ for إنشاء مشاركة.}}

### 4.7 Middleware

- `EnsureCommunityMember` (للدوائر الخاصة)
- `CommunityRateLimit` (معدل إنشاء المشاركات/التعليقات)
- `CommunitySuspensionCheck` (منع المستخدم الموقوف)

#### تسجيل الـ Middleware aliases في `bootstrap/app.php`

```php
$middleware->alias([
    // ... aliases الحالية
    'EnsureCommunityMember' => \App\Http\Middleware\EnsureCommunityMember::class,
    'CommunityRateLimit' => \App\Http\Middleware\CommunityRateLimit::class,
    'CommunitySuspensionCheck' => \App\Http\Middleware\CommunitySuspensionCheck::class,
]);
```

{{FIXED: Added exact middleware alias registration snippet following current bootstrap/app.php pattern.}}

### 4.8 Jobs & Scheduled Tasks

- `ProcessCommunityMediaUpload`
- `RunCommunityAutoModeration`
- `RecalculateTrendingPosts`
- `NotifyReportedContent`
- `CleanupSoftDeletedCommunityContent`

Schedule:

```php
$schedule->command('community:refresh-trending')->everyThirtyMinutes();
$schedule->command('community:auto-moderation-review')->everyTenMinutes();
$schedule->command('community:cleanup')->dailyAt('03:00');
```

### 4.9 Notifications (تكامل مع NotificationService الحالي)

> التكامل مع `NotificationService.php` الموجود فعلاً في المشروع والذي يدعم إرسال إشعارات عبر Database + WebPush.

```php
// في CommunityService.php بعد إنشاء تعليق:
app(NotificationService::class)->create(
    $post->user,
    'community.post_replied',
    'رد جديد على مشاركتك',
    'تمت إضافة رد جديد على مشاركتك في المجتمع',
    [
        'post_id' => $post->id,
        'comment_id' => $comment->id,
    ],
    true
);
```

{{FIXED: Replaced non-existent sendToUser() with real NotificationService::create(...) signature from the actual service.}}

#### أنواع الإشعارات:

| الحدث                         | المستلم       | القناة       | الأولوية |
| ----------------------------- | ------------- | ------------ | -------- |
| `community.post_replied`      | صاحب المشاركة | DB + Push    | عادية    |
| `community.comment_replied`   | صاحب التعليق  | DB + Push    | عادية    |
| `community.post_liked`        | صاحب المشاركة | DB           | منخفضة   |
| `community.report_received`   | الأدمن        | DB + Push    | عالية    |
| `community.content_hidden`    | صاحب المحتوى  | DB + Push    | عالية    |
| `community.account_suspended` | المستخدم      | DB + Push    | عالية    |
| `community.circle_new_post`   | أعضاء الدائرة | DB (batched) | منخفضة   |

#### ملاحظة للنشر المجهول:

- عند الرد على مشاركة مجهولة، الإشعار يصل لصاحبها **بدون كشف هويته** في نص الإشعار
- مثال: "شخص رد على مشاركتك في دائرة أمهات جدد" (بدون ذكر اسم المجهول)

### 4.10 Artisan Commands

```php
// إنشاء أمر لتحديث الترندينج
php artisan make:command CommunityRefreshTrending
// community:refresh-trending

// مراجعة الموديريشن التلقائي
php artisan make:command CommunityAutoModReview
// community:auto-moderation-review

// تنظيف المحتوى المحذوف soft-deleted
php artisan make:command CommunityCleanup
// community:cleanup

// إنشاء Seed للدوائر الافتراضية
php artisan make:command CommunitySeedCircles
// community:seed-circles

// إحصائيات المجتمع (للمراقبة)
php artisan make:command CommunityStats
// community:stats
```

| الأمر                              | الوصف                           | الجدولة      |
| ---------------------------------- | ------------------------------- | ------------ |
| `community:refresh-trending`       | تحديث ترتيب المشاركات الشائعة   | كل 30 دقيقة  |
| `community:auto-moderation-review` | مراجعة محتوى مُعلّم للموديريشن  | كل 10 دقائق  |
| `community:cleanup`                | حذف soft-deleted أقدم من 90 يوم | يومياً 03:00 |
| `community:seed-circles`           | إنشاء الدوائر الافتراضية        | مرة واحدة    |
| `community:stats`                  | طباعة إحصائيات سريعة للمجتمع    | عند الطلب    |

---

## 5. الفرونت إند - التفاصيل الكاملة

### 5.1 الصفحات الأساسية

#### `CommunityHomePage.tsx`

- Hero المجتمع (مع كاروسيل/Slider للدوائر المميزة — من التصميم)
- إحصائيات سريعة
- شريط إنشاء مشاركة سريعة
- منطقة إعلانات (Ad Placement — اختياري كما في التصميم)
- تبويبات الفيد: الأحدث / الشائع / دوائري
- كروت المشاركات (مع Infinite Scroll — `useInfiniteQuery` من TanStack Query)
- المشاركات المثبتة تظهر أعلى الفيد دائماً

#### `CommunityPostDetailPage.tsx`

- محتوى المشاركة
- بيانات الكاتب (مجهول/حقيقي)
- التفاعلات
- قائمة التعليقات
- نموذج إضافة تعليق

#### `CommunityCreatePostModal.tsx`

- عنوان + نص
- إضافة صور
- اختيار الدائرة
- اختيار التاجات (Tags multiselect)
- اختيار user_label ("أم جديدة", "زوجة حائرة", "صديقة قلقة" — من التصميم)
- Toggle: نشر مجهول
- Preview قبل النشر

#### `CommunityMyPostsPage.tsx`

- مشاركاتي المنشورة
- مسودات (مرحلة 2)
- المخفية بواسطة الإدارة

#### `CommunitySavedPostsPage.tsx`

- قائمة المشاركات المحفوظة
- Unsave مباشر من الكارد
- Empty state: "لم تحفظي أي مشاركة بعد"

#### `CommunitySearchPage.tsx`

- حقل بحث نصي (full-text)
- فلاتر: دائرة، تاج، ترتيب (أحدث / أكثر تفاعلاً)
- نتائج مع highlight للكلمات المطابقة
- Autocomplete suggestions

#### `CommunityGuidelinesPage.tsx`

- عرض إرشادات المجتمع (القواعد + الآداب)
- زر "موافقة" للمستخدم الجديد (قبل أول مشاركة)
- يظهر تلقائياً إذا `community_guidelines_accepted = false`

### 5.2 مكونات UI

`src/components/community/`

- `PostCard.tsx` (مع بادج التثبيت + بادج التاجات)
- `PostComposer.tsx`
- `PostActions.tsx`
- `CommentThread.tsx` (مع علامة قفل إذا `is_comments_locked`)
- `CommentInput.tsx`
- `CircleChip.tsx`
- `CircleCarousel.tsx` (كاروسيل الدوائر — من التصميم)
- `TagBadge.tsx` (بادج التاج)
- `UserLabelBadge.tsx` ("أم جديدة" / "زوجة حائرة" — من التصميم)
- `SupervisorBadge.tsx` ("بإشراف د. أحمد" — من التصميم)
- `AnonymousBadge.tsx`
- `ReportDialog.tsx`
- `ModerationBanner.tsx`
- `PinnedPostIndicator.tsx`
- `SearchBar.tsx`
- `InfiniteScrollContainer.tsx`
- `AdPlacement.tsx` (منطقة إعلانية اختيارية)

### 5.3 Services (Frontend)

`src/services/communityService.ts`

```ts
getFeed(params): Promise<PaginatedResponse<Post>>
getCircles(): Promise<Circle[]>
joinCircle(circleId): Promise<void>
leaveCircle(circleId): Promise<void>
createPost(data): Promise<Post>
getPost(postId): Promise<PostDetail>
updatePost(postId, data): Promise<Post>
deletePost(postId): Promise<void>
reactToPost(postId, type): Promise<void>
savePost(postId): Promise<void>
unsavePost(postId): Promise<void>
getSavedPosts(params): Promise<PaginatedResponse<Post>>
searchPosts(query, filters): Promise<PaginatedResponse<Post>>
getTags(): Promise<Tag[]>
createComment(postId, data): Promise<Comment>
reactToComment(commentId, type): Promise<void>
deleteComment(commentId): Promise<void>
reportPost(postId, data): Promise<void>
reportComment(commentId, data): Promise<void>
acceptGuidelines(): Promise<void>
```

`src/services/communityAdminService.ts`

```ts
// Admin Circle CRUD
getCircles(params): Promise<PaginatedResponse<Circle>>
createCircle(data): Promise<Circle>
updateCircle(id, data): Promise<Circle>
deleteCircle(id): Promise<void>
toggleCircleActive(id): Promise<void>
assignSupervisor(circleId, doctorId): Promise<void>

// Admin Tags CRUD
getTags(): Promise<Tag[]>
createTag(data): Promise<Tag>
updateTag(id, data): Promise<Tag>
deleteTag(id): Promise<void>

// Admin Moderation
getReports(params): Promise<PaginatedResponse<Report>>
resolveReport(id, data): Promise<void>
rejectReport(id, data): Promise<void>
hidePost(id): Promise<void>
unhidePost(id): Promise<void>
pinPost(id): Promise<void>
unpinPost(id): Promise<void>
lockComments(id): Promise<void>
unlockComments(id): Promise<void>
suspendUser(userId, data): Promise<void>
unsuspendUser(userId): Promise<void>
getStats(): Promise<CommunityStats>
```

### 5.4 Hooks

`src/hooks/community/`

- `useCommunityFeed.ts` (with `useInfiniteQuery` for infinite scroll)
- `useCommunityPost.ts`
- `useCommunityCircles.ts`
- `useCommunitySearch.ts` (debounced search + autocomplete)
- `usePostComposer.ts`
- `useSavedPosts.ts`
- `useModerationGuard.ts`
- `useCommunityGuidelines.ts` (فحص موافقة المستخدم)

> **Infinite Scroll:** يستخدم `useCommunityFeed` مع `useInfiniteQuery` من TanStack Query + `IntersectionObserver` لتحميل تلقائي للصفحة التالية عند الوصول لنهاية القائمة.

### 5.5 Routes (App.tsx additions)

```tsx
{/* Patient Community */}
<Route
    path="/patient/community"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunityHomePage />
        </ProtectedRoute>
    }
/>
<Route
    path="/patient/community/posts/:id"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunityPostDetailPage />
        </ProtectedRoute>
    }
/>
<Route
    path="/patient/community/my-posts"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunityMyPostsPage />
        </ProtectedRoute>
    }
/>
<Route
    path="/patient/community/saved"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunitySavedPostsPage />
        </ProtectedRoute>
    }
/>
<Route
    path="/patient/community/search"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunitySearchPage />
        </ProtectedRoute>
    }
/>
<Route
    path="/patient/community/guidelines"
    element={
        <ProtectedRoute allowedUserTypes={["patient"]}>
            <CommunityGuidelinesPage />
        </ProtectedRoute>
    }
/>

{/* Admin Community */}
<Route path="/admin/community" element={<AdminCommunityDashboardPage />} />
<Route path="/admin/community/reports" element={<AdminCommunityReportsPage />} />
<Route path="/admin/community/posts" element={<AdminCommunityPostsPage />} />
<Route path="/admin/community/circles" element={<AdminCommunityCirclesPage />} />
<Route path="/admin/community/tags" element={<AdminCommunityTagsPage />} />
<Route path="/admin/community/suspensions" element={<AdminCommunitySuspensionsPage />} />
```

{{FIXED: Updated patient community routes to /patient/community/... and wrapped them with ProtectedRoute for patient auth consistency.}}

### 5.6 TypeScript Interfaces

`src/types/community.ts`

```ts
export interface CommunityCircle {
  id: number;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  cover_image: string | null;
  icon: string | null;
  is_private: boolean;
  members_count: number;
  posts_count: number;
  supervisor: {
    id: number;
    name: string;
    avatar: string | null;
    specialty: string;
  } | null;
  is_joined: boolean;
}

export interface CommunityPostAuthor {
  id?: number;
  name: string;
  avatar: string | null;
  is_anonymous: boolean;
}

export interface CommunityPost {
  id: number;
  title: string | null;
  content: string;
  media: { type: string; url: string; thumbnail?: string }[] | null;
  circle: CommunityCircle;
  author: CommunityPostAuthor;
  user_label: string | null;
  tags: CommunityTag[];
  visibility: "public" | "circle_only";
  status: "published" | "hidden" | "archived" | "under_review";
  is_pinned: boolean;
  is_comments_locked: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  is_liked: boolean;
  is_saved: boolean;
  is_mine: boolean;
  can_edit: boolean;
  published_at: string | null;
  created_at: string;
  time_ago: string;
}

export interface CommunityComment {
  id: number;
  content: string;
  author: CommunityPostAuthor;
  likes_count: number;
  is_liked: boolean;
  replies: CommunityComment[];
  replies_count: number;
  is_mine: boolean;
  created_at: string;
  time_ago: string;
}

export interface CommunityTag {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  posts_count: number;
}

export interface CommunityReport {
  id: number;
  reporter: { id: number; name: string };
  reportable_type: "post" | "comment";
  reportable_id: number;
  reason: string;
  details: string | null;
  status: "pending" | "reviewing" | "resolved" | "rejected";
  handled_by: number | null;
  admin_note: string | null;
  handled_at: string | null;
  created_at: string;
}

export interface CommunityStats {
  total_posts: number;
  total_comments: number;
  total_reports_pending: number;
  posts_today: number;
  engagement_rate: number;
  top_circles: { name: string; posts_count: number }[];
  anonymous_percentage: number;
}

export interface CreatePostPayload {
  circle_id: number;
  title?: string;
  content: string;
  media?: File[];
  is_anonymous: boolean;
  user_label?: string;
  tag_ids?: number[];
  visibility?: "public" | "circle_only";
}

export interface CreateCommentPayload {
  content: string;
  parent_id?: number;
  is_anonymous: boolean;
}
```

---

## 6. النشر المجهول والخصوصية

### 6.1 المبادئ

- المجهول يعني **إخفاء الهوية عن المستخدمين** وليس عن النظام.
- يحتفظ النظام بالـ `user_id` داخليًا لأسباب الأمان ومنع الإساءة.
- يظهر اسم مستعار بدل الاسم الحقيقي عند `is_anonymous = true`.

### 6.2 طريقة العرض

- اسم العرض: `anonymous_alias` (مثال: "زهرة هادئة")
- الصورة الشخصية: Avatar افتراضي
- لا يظهر أي رابط للملف الشخصي عند النشر المجهول

### 6.3 سياسة الوصول لهوية الكاتب

| الجهة          | هل ترى الهوية الحقيقية؟  |
| -------------- | ------------------------ |
| المستخدمون     | ❌ لا                    |
| موديراتور مخول | ✅ نعم (عند التحقيق فقط) |
| الأدمن         | ✅ نعم                   |

### 6.4 تدقيق وأثر قانوني

- تسجيل جميع الأحداث الحساسة في `community_moderation_actions`
- تتبع IP/User-Agent عند إنشاء المحتوى (اختياري حسب سياسة الخصوصية)
- الاحتفاظ بسجلات البلاغات لفترة محددة (مثلاً 180 يوم)

### 6.5 توليد الاسم المستعار (Anonymous Alias)

- يتم توليد الاسم المستعار بدمج:
  - صفة عربية عشوائية من قائمة معدّة مسبقًا (مثل: هادئة، صبورة، متفائلة)
  - اسم طبيعة عربي عشوائي من قائمة معدّة مسبقًا (مثل: زهرة، نسمة، غيمة)
- مثال ناتج: `زهرة هادئة`
- يُولد الاسم مرة واحدة لكل مستخدمة داخل كل دائرة، ثم يُعاد استخدامه داخل نفس الدائرة.
- يتم حفظ الربط في جدول `community_user_aliases` بالأعمدة: `(user_id, circle_id, alias)` مع قيد فريد على `(user_id, circle_id)`.

{{FIXED: Added concrete anonymous alias generation algorithm and persistence rule per user per circle.}}

---

## 7. مشاركة الأطباء في المجتمع

### 7.1 سياسة المشاركة

- الطبيب يمكنه الاطلاع على المجتمع والتعليق **باسمه الحقيقي + بادج "طبيب"**
- الطبيب **لا ينشر مشاركات** في المجتمع (فقط تعليقات/ردود)
- إذا كان الطبيب مشرفًا على دائرة، يظهر بادج "بإشراف د. [Name]" على الدائرة
- الطبيب المشرف يمكنه تثبيت تعليقاته في دائرته (كتوصيات طبية)
- في المرحلة الثانية: يمكن للطبيب إنشاء "AMA - اسألني" في دائرته

### 7.2 عرض تعليق الطبيب

```tsx
// تعليق الطبيب يظهر بشكل مميز:
// - بادج "طبيب" بلون مختلف
// - التخصص تحت الاسم
// - التعليق يتميز بخلفية خفيفة
<DoctorCommentCard
  doctorName="د. أحمد المصري"
  specialty="طب نسائي"
  isSupervisor={true}
  content="..."
/>
```

### 7.3 API الطبيب

| العملية        | مسموح؟ | ملاحظات                                   |
| -------------- | ------ | ----------------------------------------- |
| مشاهدة الفيد   | ✅     | جميع الدوائر العامة + الخاصة المشرف عليها |
| إنشاء مشاركة   | ❌     | فقط المرضى ينشرون                         |
| التعليق / الرد | ✅     | باسمه الحقيقي + بادج طبيب                 |
| التفاعل (لايك) | ✅     |                                           |
| البلاغ         | ✅     |                                           |
| النشر المجهول  | ❌     | الطبيب يظهر دائمًا باسمه                  |

---

## 8. لوحة تحكم الأدمن والموديريشن

### 8.1 صفحات الأدمن

- `AdminCommunityDashboardPage.tsx`
- `AdminCommunityReportsPage.tsx`
- `AdminCommunityPostsPage.tsx`
- `AdminCommunityCommentsPage.tsx`
- `AdminCommunityCirclesPage.tsx`
- `AdminCommunityTagsPage.tsx`
- `AdminCommunitySuspensionsPage.tsx`

### 8.2 Admin Sidebar Navigation

> أضيفي عناصر تنقّل المجتمع مباشرة داخل `AdminLayout.tsx` في نفس المكان الذي تُعرّف فيه عناصر التنقل الحالية.

```tsx
// إضافة مباشرة داخل navItems في AdminLayout.tsx
{
  title: 'المجتمع (فض فضة)',
  icon: Users,
  items: [
    { title: 'لوحة التحكم', href: '/admin/community', icon: LayoutDashboard },
    { title: 'المشاركات', href: '/admin/community/posts', icon: FileText },
    { title: 'البلاغات', href: '/admin/community/reports', icon: Flag, badge: pendingReportsCount },
    { title: 'الدوائر', href: '/admin/community/circles', icon: Circle },
    { title: 'التاجات', href: '/admin/community/tags', icon: Tag },
    { title: 'المعلّقون', href: '/admin/community/suspensions', icon: UserX },
  ],
}
```

{{FIXED: Replaced incorrect adminNavigation.ts reference with direct AdminLayout.tsx integration instruction.}}

### 8.3 إمكانيات الموديريشن

- إخفاء/استعادة/حذف محتوى
- قفل التعليقات على مشاركة
- إرسال إنذار للمستخدم
- تعليق حساب المستخدم داخل المجتمع (Community-only suspension)
- إدارة البلاغات: pending/reviewing/resolved/rejected
- فلترة متقدمة (سبب البلاغ، الدائرة، التاريخ، درجة الخطورة)

### 8.4 الإحصائيات

- إجمالي المشاركات/اليوم
- معدل التفاعل (likes + comments / posts)
- عدد البلاغات المفتوحة
- زمن الاستجابة للبلاغات (SLA)
- أفضل الدوائر نشاطًا
- نسبة المحتوى المجهول

### 8.5 جدول صلاحيات الأدمن

| الصلاحية                              | الوصف                                     |
| ------------------------------------- | ----------------------------------------- |
| `community.posts.view`                | مشاهدة جميع المشاركات                     |
| `community.posts.hide`                | إخفاء مشاركة                              |
| `community.posts.delete`              | حذف مشاركة نهائياً                        |
| `community.posts.pin`                 | تثبيت/إلغاء تثبيت مشاركة                  |
| `community.posts.lock_comments`       | قفل/فتح التعليقات على مشاركة              |
| `community.comments.hide`             | إخفاء تعليق                               |
| `community.comments.delete`           | حذف تعليق نهائياً                         |
| `community.reports.view`              | مشاهدة البلاغات                           |
| `community.reports.resolve`           | حل بلاغ / رفض بلاغ                        |
| `community.circles.manage`            | CRUD الدوائر                              |
| `community.circles.assign_supervisor` | تعيين طبيب مشرف للدائرة                   |
| `community.tags.manage`               | CRUD التاجات                              |
| `community.users.suspend`             | تعليق مستخدم من المجتمع                   |
| `community.users.view_identity`       | مشاهدة الهوية الحقيقية للمشاركات المجهولة |
| `community.stats.view`                | مشاهدة إحصائيات المجتمع                   |

---

## 9. الأمان ومكافحة الإساءة

### 9.1 حماية API

- Laravel Policies لكل عملية (post/comment/report)
- Rate Limiting:
  - إنشاء مشاركة: 5 / 10 دقائق
  - إنشاء تعليق: 20 / 10 دقائق
  - تبليغ: 10 / ساعة
- Sanitization للنصوص لمنع XSS
- التحقق من نوع وحجم الملفات

### 9.2 Content Safety

- قائمة كلمات محظورة (Arabic + English)
- اكتشاف أولي لمحتوى حساس (self-harm / sexual / violence)
- Auto-flag للمحتوى المشبوه `under_review`
- Escalation سريع للبلاغات الحرجة

### 9.3 سياسات المجتمع

- عرض "إرشادات المجتمع" قبل أول نشر
- موافقة صريحة على الشروط عند إنشاء أول مشاركة
- تطبيق تصعيد مباشر واضح عند المخالفة:
  - إنذار المستخدم
  - إخفاء/حذف المحتوى المخالف
  - تعليق مؤقت من المجتمع
  - تعليق دائم من المجتمع عند التكرار الشديد

{{FIXED: Removed undefined violation points system and replaced it with direct suspension/moderation flow already defined in the plan.}}

---

## 10. خطة التنفيذ المرحلية

### المرحلة 1: البنية الأساسية (3 أيام)

- إنشاء migrations والجداول الرئيسية
- إنشاء Models والعلاقات
- Seed لدوائر افتراضية
- إعداد Policies الأساسية

### المرحلة 2: Core API (3-4 أيام)

- Post CRUD
- Comment CRUD
- Reactions + Save
- Feed APIs
- Pagination + Filters

### المرحلة 3: Anonymous + Moderation (3 أيام)

- Anonymous posting flow
- Reports flow
- Admin moderation endpoints
- Moderation actions logging

### المرحلة 4: Frontend Community (4-5 أيام)

- صفحات المجتمع الأساسية
- Composer + Detail + Comments
- Anonymous UI states
- Report dialogs + feedback UX

### المرحلة 5: Admin Panel + Analytics (3 أيام)

- لوحات البلاغات والمحتوى
- أدوات الإدارة الكاملة
- Community stats

### المرحلة 6: جودة وإطلاق (2-3 أيام)

- اختبارات Feature/Unit
- اختبارات UI وUX
- مراجعة الأمان والخصوصية
- Soft Launch + مراقبة

> **الإجمالي المتوقع:** 18 - 21 يوم عمل.

---

## 11. معايير القبول وقياس النجاح

### 11.1 Definition of Done

- ✅ مستخدم يستطيع نشر مشاركة نصية/صورة
- ✅ مستخدم يستطيع التعليق والرد
- ✅ خيار نشر مجهول يعمل بالكامل
- ✅ البلاغات تصل للأدمن وتدار من لوحة واضحة
- ✅ الأدمن يستطيع إخفاء/استعادة/حذف المحتوى
- ✅ جميع العمليات الأساسية مغطاة باختبارات

### 11.2 KPIs أول 30 يوم بعد الإطلاق

- DAU للمجتمع
- Average posts per day
- Average comments per post
- Report resolution time
- % abusive content removed within SLA
- Retention D7 و D30 للمستخدمات المشاركات

### 11.3 مخاطر متوقعة + تخفيف

| الخطر                       | التأثير | التخفيف                                  |
| --------------------------- | ------- | ---------------------------------------- |
| إساءة استخدام النشر المجهول | عالي    | موديريشن تلقائي + بلاغات + تعليق تدريجي  |
| سبام                        | متوسط   | Rate limiting + fingerprint + shadow-ban |
| حمل على قواعد البيانات      | متوسط   | فهارس جيدة + caching + pagination        |
| حساسية محتوى نفسي           | عالي    | مسار escalations + ردود توجيهية آمنة     |

---

## 12. جاهزية الإنتاج والتشغيل

### 12.1 استراتيجية إطلاق آمن (Safe Rollout)

- تفعيل الميزة عبر Feature Flags (على مستوى المستخدم/المنطقة)
- إطلاق تدريجي: 5% ثم 25% ثم 50% ثم 100%
- مراقبة مؤشرات حرجة بعد كل مرحلة (Error Rate, P95, Report Volume)
- خطة Rollback فورية:
  - تعطيل Flag
  - إيقاف Jobs غير الحرجة
  - إعادة توجيه صفحات المجتمع إلى وضع القراءة فقط (عند الحاجة)

### 12.2 بروتوكول السلامة النفسية (Self-Harm / Crisis)

- تصنيف فوري للبلاغات ذات الخطورة العالية (self_harm / violence)
- SLA مخصص للبلاغات الحرجة: مراجعة خلال ≤ 10 دقائق
- قوالب رد آمنة للموديريشن (لغة داعمة + توجيه للمساعدة المختصة)
- تصعيد متعدد المستويات:
  - Level 1: Auto-flag + إشعار فريق الموديريشن
  - Level 2: إشعار مشرف/أدمن مناوب
  - Level 3: إخفاء فوري + مراجعة يدوية عاجلة

### 12.3 سياسة الاحتفاظ بالبيانات (Data Retention)

| نوع البيانات                            | مدة الاحتفاظ المقترحة | الإجراء بعد المدة |
| --------------------------------------- | --------------------- | ----------------- |
| المشاركات/التعليقات المحذوفة SoftDelete | 90 يوم                | حذف نهائي         |
| سجلات الموديريشن                        | 365 يوم               | أرشفة             |
| البلاغات                                | 180 يوم               | أرشفة             |
| أحداث الأمان (IP/User-Agent)            | 90 - 180 يوم          | حذف/تعمية         |

- توفير Job يومي لتطبيق سياسات الحذف/الأرشفة تلقائيًا
- توثيق السياسة في Privacy Policy لتوافق الامتثال

### 12.4 حماية متقدمة من السبام والإساءة

- Device fingerprint للمحاولات المتكررة
- اكتشاف تشابه المحتوى (duplicate/near-duplicate)
- Shadow-ban تدريجي للحسابات المزعجة قبل الحظر الصريح
- Rate limit تكيفي (يزداد تشددًا مع السلوك المشبوه)

### 12.5 أمان الوسائط (Media Security)

- فحص malware للملفات المرفوعة قبل الإتاحة العامة
- Image moderation أولي لاكتشاف محتوى حساس
- منع الملفات التنفيذية نهائيًا + التحقق من MIME الحقيقي
- تخزين الوسائط مع روابط موقعة (Signed URLs) عند الحاجة

### 12.6 المراقبة والتنبيه (Observability)

- لوحات تشغيل رئيسية:
  - API Error Rate
  - P95/P99 Latency
  - Queue Lag
  - Failed Jobs
  - Report Resolution SLA
- تنبيهات فورية عبر Slack/Email عند تجاوز العتبات
- Correlation IDs لكل طلب لتسهيل تتبع الأعطال

### 12.7 جودة التجربة وإتاحة الوصول (UX + Accessibility)

- التزام WCAG 2.1 AA في الشاشات الأساسية
- دعم كامل لحالات: Empty / Loading / Error / Retry
- تحسين قراءة النص العربي (تباعد، تباين، اتجاه RTL)
- تحسين تجربة الشبكات الضعيفة (Skeleton + Lazy Loading)

### 12.8 اختبارات ما قبل الإطلاق (Go-Live Validation)

- Contract Tests بين Frontend/Backend لواجهات المجتمع
- Load Testing:
  - Feed endpoint
  - Search endpoint
  - Post/Comment creation burst
- سيناريوهات Abuse E2E:
  - Spam floods
  - Mass reporting
  - Anonymous misuse patterns

### 12.9 مؤشرات نجاح تشغيلية إضافية

- Crash-free sessions ≥ 99.5%
- API success rate ≥ 99.9%
- P95 API latency < 500ms
- ≥ 95% من البلاغات الحرجة تُغلق ضمن SLA

---

## ملحق A - Seed دوائر افتراضية

- دائرة ما قبل الزواج
- دائرة حديثي الزواج
- دائرة الحمل والولادة
- دائرة أطفال الروضة
- دائرة أمهات جدد

## ملحق B - توصيات مستقبلية (Phase 2)

- استطلاعات رأي (Polls)
- هاشتاقات متقدمة
- Mentions @username
- توصيات محتوى ذكية
- نظام شارات إنجازات للمجتمع
- Community Challenges

---

## الخلاصة

هذه الخطة مصممة لتكون **احترافية وقابلة للتنفيذ مباشرة** داخل معمارية مشروع وداد الحالية.  
تضمن الخطة توازنًا بين:

- تجربة استخدام داعمة وآمنة
- خصوصية قوية للنشر المجهول
- أدوات إدارة متقدمة للأدمن
- قابلية توسع عالية مستقبلاً

إذا أردت، أقدر في الخطوة التالية أحوّل هذه الخطة إلى **Checklist تنفيذ يومي** + **أول مجموعة Migrations وModels جاهزة بالكود** مباشرة داخل المشروع.
