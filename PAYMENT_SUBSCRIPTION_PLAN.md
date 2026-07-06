# 💳 خطة نظام الدفع والاشتراكات - وداد تك

## Payment & Subscription System - Complete Implementation Plan

---

## 📋 الفهرس

1. [نظرة عامة على النظام](#1-نظرة-عامة)
2. [تحليل الوضع الحالي](#2-الوضع-الحالي)
3. [هيكل قاعدة البيانات](#3-قاعدة-البيانات)
4. [الباك إند - التفاصيل الكاملة](#4-الباك-إند)
5. [الفرونت إند - التفاصيل الكاملة](#5-الفرونت-إند)
6. [تكامل Paymob للاشتراكات](#6-paymob-integration)
7. [لوحة تحكم الأدمن](#7-لوحة-الأدمن)
8. [خطة التنفيذ المرحلية](#8-خطة-التنفيذ)

---

## 1. نظرة عامة

### 1.1 الباقات المطلوبة (من التصميم)

| الباقة            | السعر الشهري | الوصف                                                                                                               |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **وداد الأساسية** | مجاناً       | وصول محدود للمقالات، الأدوات الصحية الأساسية، دردشة محدودة مع "وداد"                                                |
| **وداد بلس**      | 149 ج.م      | وصول كامل للمقالات والمحتوى، جميع الأدوات الصحية، دردشة غير محدودة، 1 استشارة مجانية شهرياً، خصم 20% على الاستشارات |
| **وداد برو**      | 299 ج.م      | كل شيء في بلس + 3 استشارات مجانية، تقارير صحية أسبوعية بالذكاء الاصطناعي                                            |
| **وداد برو بلس**  | 449 ج.م      | كل شيء في برو + 5 استشارات مجانية، إنشاء رحلة مخصصة بالذكاء الاصطناعي، دعم فني بأولوية، خصم 25%                     |

### 1.2 المميزات الرئيسية للنظام

- ✅ اشتراكات شهرية/سنوية مع خصم سنوي
- ✅ تكامل Paymob كامل (بطاقات + محافظ إلكترونية + تقسيط)
- ✅ فواتير إلكترونية PDF تلقائية
- ✅ سجل مدفوعات كامل
- ✅ نظام استرداد (Refunds) متكامل
- ✅ أكواد خصم ترويجية (Promo Codes)
- ✅ تحكم كامل من الأدمن (إنشاء/تعديل/حذف الباقات)
- ✅ فترة تجريبية مجانية
- ✅ ترقية/تخفيض الباقة مع حساب الفرق
- ✅ إشعارات تلقائية (انتهاء، تجديد، فشل)

---

## 2. الوضع الحالي

### 2.1 ما هو موجود بالفعل ✅

| المكون                    | الحالة   | التفاصيل                                                                                                               |
| ------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `PaymobService.php`       | ✅ موجود | تكامل كامل: authenticate, registerOrder, getPaymentKey, initiatePayment, initiateWalletPayment, verifyCallback, refund |
| `PaymentController.php`   | ✅ موجود | Callbacks, حالات الدفع, سجل مدفوعات المريض, طلب استرداد                                                                |
| `Payment` Model           | ✅ موجود | مرتبط بـ consultation فقط                                                                                              |
| `FinancialController.php` | ✅ موجود | إحصائيات مالية, معاملات, استرداد, مدفوعات الأطباء                                                                      |
| Paymob Config             | ✅ موجود | `config/services.php` + `.env` variables                                                                               |
| `BookConsultation.tsx`    | ✅ موجود | واجهة حجز مع خطوة دفع                                                                                                  |
| `PaymentCallback.tsx`     | ✅ موجود | صفحة ما بعد الدفع                                                                                                      |

### 2.2 ما يحتاج بناء من الصفر 🔨

| المكون                          | الحالة       | الوصف                              |
| ------------------------------- | ------------ | ---------------------------------- |
| جدول الخطط (plans)              | ❌ غير موجود | تعريف الباقات وتفاصيلها            |
| جدول الاشتراكات (subscriptions) | ❌ غير موجود | ربط المستخدم بالباقة               |
| جدول أكواد الخصم (promo_codes)  | ❌ غير موجود | كوبونات ترويجية                    |
| جدول الفواتير (invoices)        | ❌ غير موجود | فواتير إلكترونية                   |
| جدول سجل استخدام الميزات        | ❌ غير موجود | تتبع الاستشارات المجانية المستخدمة |
| Subscription Middleware         | ❌ غير موجود | التحكم في الوصول حسب الباقة        |
| صفحة الأسعار                    | ❌ غير موجود | صفحة عرض الباقات العامة            |
| لوحة إدارة الخطط                | ❌ غير موجود | CRUD للباقات من الأدمن             |
| إدارة الاشتراكات (أدمن)         | ❌ غير موجود | عرض/تعديل اشتراكات المستخدمين      |
| صفحة الاشتراك (مريض)            | ❌ غير موجود | واجهة اختيار ودفع الباقة           |
| نظام التجديد التلقائي           | ❌ غير موجود | Cron jobs للتجديد                  |

---

## 3. قاعدة البيانات - Database Schema

### 3.1 جدول الخطط `plans`

```php
// Migration: create_plans_table.php
Schema::create('plans', function (Blueprint $table) {
    $table->id();

    // Basic Info
    $table->string('name');                    // "وداد بلس"
    $table->string('name_en')->nullable();     // "Widad Plus"
    $table->string('slug')->unique();          // "widad-plus"
    $table->text('description')->nullable();   // الوصف
    $table->text('description_en')->nullable();

    // Pricing
    $table->decimal('monthly_price', 10, 2);        // 149.00
    $table->decimal('yearly_price', 10, 2)->nullable(); // 1490.00 (خصم سنوي)
    $table->string('currency', 3)->default('EGP');

    // Features (JSON - مرن للأدمن)
    $table->json('features');
    /*
    features JSON structure:
    {
        "articles_access": "full",           // "limited" | "full"
        "ai_chat_text": "unlimited",         // "limited" | "unlimited"
        "ai_chat_voice": true,               // true | false
        "ai_listening": "full",              // "limited" | "full" | false
        "health_tools_basic": true,
        "health_tools_advanced": true,
        "health_center_link": true,
        "free_consultations_monthly": 1,     // 0, 1, 3, 5
        "consultation_discount_percent": 20, // 0, 20, 25
        "ai_weekly_reports": false,
        "ai_custom_journey": false,
        "priority_support": false
    }
    */

    // Display
    $table->integer('sort_order')->default(0);       // ترتيب العرض
    $table->string('badge')->nullable();             // "الأكثر شيوعاً"
    $table->string('badge_color')->nullable();       // "#14b8a6"
    $table->string('icon')->nullable();              // أيقونة
    $table->string('color')->nullable();             // لون الكارت
    $table->boolean('is_featured')->default(false);  // مميز (أكبر حجماً)

    // Status
    $table->boolean('is_active')->default(true);
    $table->boolean('is_free')->default(false);      // الباقة المجانية

    // Trial
    $table->integer('trial_days')->default(0);       // 14 يوم مثلاً

    $table->timestamps();
    $table->softDeletes();
});
```

### 3.2 جدول مميزات الخطط `plan_features` (لعرض القائمة في الكارت)

```php
// Migration: create_plan_features_table.php
Schema::create('plan_features', function (Blueprint $table) {
    $table->id();
    $table->foreignId('plan_id')->constrained()->cascadeOnDelete();

    $table->string('feature_text');           // "وصول كامل لجميع المقالات"
    $table->string('feature_text_en')->nullable();
    $table->boolean('is_included')->default(true); // ✓ أو ✗
    $table->integer('sort_order')->default(0);

    $table->timestamps();
});
```

### 3.3 جدول الاشتراكات `subscriptions`

```php
// Migration: create_subscriptions_table.php
Schema::create('subscriptions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('plan_id')->constrained();

    // Billing
    $table->enum('billing_cycle', ['monthly', 'yearly']);
    $table->decimal('price_paid', 10, 2);        // السعر المدفوع (بعد الخصم)
    $table->decimal('original_price', 10, 2);    // السعر الأصلي
    $table->string('currency', 3)->default('EGP');

    // Dates
    $table->timestamp('starts_at');
    $table->timestamp('ends_at');
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('cancelled_at')->nullable();
    $table->timestamp('renewed_at')->nullable();

    // Status
    $table->enum('status', [
        'active',          // نشط
        'trial',           // فترة تجريبية
        'past_due',        // متأخر الدفع
        'cancelled',       // ملغي (سارٍ حتى نهاية الفترة)
        'expired',         // منتهي
        'suspended',       // معلّق بواسطة الأدمن
        'pending_payment', // في انتظار الدفع
    ]);

    // Auto-renew
    $table->boolean('auto_renew')->default(true);
    $table->string('cancellation_reason')->nullable();

    // Paymob
    $table->string('paymob_subscription_id')->nullable();
    $table->string('paymob_order_id')->nullable();

    // Promo
    $table->foreignId('promo_code_id')->nullable()->constrained('promo_codes');
    $table->decimal('discount_amount', 10, 2)->default(0);

    // Usage Tracking (reset monthly)
    $table->integer('free_consultations_used')->default(0);
    $table->timestamp('usage_reset_at')->nullable();

    // Admin
    $table->foreignId('activated_by')->nullable()->constrained('users'); // أدمن فعّل يدوياً
    $table->text('admin_notes')->nullable();

    $table->timestamps();
    $table->softDeletes();

    // Indexes
    $table->index(['user_id', 'status']);
    $table->index('ends_at');
    $table->index('status');
});
```

### 3.4 جدول أكواد الخصم `promo_codes`

```php
// Migration: create_promo_codes_table.php
Schema::create('promo_codes', function (Blueprint $table) {
    $table->id();

    // Code Details
    $table->string('code', 50)->unique();            // "WELCOME50"
    $table->string('description')->nullable();       // وصف الكود

    // Discount
    $table->enum('discount_type', ['percentage', 'fixed']); // نسبة أو مبلغ ثابت
    $table->decimal('discount_value', 10, 2);         // 50 (%) or 50.00 (EGP)
    $table->decimal('max_discount', 10, 2)->nullable(); // حد أقصى للخصم (للنسبة)
    $table->decimal('min_amount', 10, 2)->nullable();   // الحد الأدنى للشراء

    // Restrictions
    $table->json('applicable_plans')->nullable();     // [1, 2, 3] أو null = الكل
    $table->enum('applicable_billing', ['all', 'monthly', 'yearly'])->default('all');

    // Limits
    $table->integer('max_uses')->nullable();          // الحد الأقصى للاستخدام الكلي
    $table->integer('max_uses_per_user')->default(1); // لكل مستخدم
    $table->integer('used_count')->default(0);        // عدد مرات الاستخدام

    // Validity
    $table->timestamp('starts_at')->nullable();
    $table->timestamp('expires_at')->nullable();
    $table->boolean('is_active')->default(true);

    // Tracking
    $table->foreignId('created_by')->nullable()->constrained('users');

    $table->timestamps();
    $table->softDeletes();
});
```

### 3.5 جدول استخدام أكواد الخصم `promo_code_uses`

```php
// Migration: create_promo_code_uses_table.php
Schema::create('promo_code_uses', function (Blueprint $table) {
    $table->id();
    $table->foreignId('promo_code_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
    $table->decimal('discount_applied', 10, 2);
    $table->timestamps();

    $table->unique(['promo_code_id', 'user_id', 'subscription_id']);
});
```

### 3.6 جدول الفواتير `invoices`

```php
// Migration: create_invoices_table.php
Schema::create('invoices', function (Blueprint $table) {
    $table->id();
    $table->string('invoice_number')->unique();      // "INV-2026-000001"
    $table->foreignId('user_id')->constrained();
    $table->foreignId('subscription_id')->nullable()->constrained();

    // Type
    $table->enum('type', [
        'subscription',       // دفع اشتراك
        'consultation',       // دفع استشارة
        'refund',            // استرداد
        'upgrade_proration', // فرق ترقية
    ]);

    // Amounts
    $table->decimal('subtotal', 10, 2);
    $table->decimal('discount', 10, 2)->default(0);
    $table->decimal('tax', 10, 2)->default(0);
    $table->decimal('total', 10, 2);
    $table->string('currency', 3)->default('EGP');

    // Status
    $table->enum('status', ['draft', 'pending', 'paid', 'refunded', 'cancelled']);

    // Payment
    $table->string('payment_method')->nullable();
    $table->string('transaction_id')->nullable();
    $table->json('paymob_response')->nullable();
    $table->timestamp('paid_at')->nullable();

    // Details
    $table->json('line_items');
    /*
    [
        {
            "description": "اشتراك وداد بلس - شهري",
            "quantity": 1,
            "unit_price": 149.00,
            "total": 149.00
        }
    ]
    */

    // PDF
    $table->string('pdf_path')->nullable();

    // Refund Details
    $table->decimal('refund_amount', 10, 2)->nullable();
    $table->timestamp('refunded_at')->nullable();
    $table->string('refund_reason')->nullable();

    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();

    $table->index(['user_id', 'type']);
    $table->index('invoice_number');
});
```

### 3.7 جدول سجل المعاملات `subscription_transactions`

```php
// Migration: create_subscription_transactions_table.php
Schema::create('subscription_transactions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    $table->foreignId('invoice_id')->nullable()->constrained();

    $table->enum('type', [
        'payment',         // دفع اشتراك
        'renewal',         // تجديد
        'upgrade',         // ترقية
        'downgrade',       // تخفيض
        'refund',          // استرداد
        'proration',       // فرق ترقية/تخفيض
        'trial_start',     // بداية تجريبية
        'cancellation',    // إلغاء
    ]);

    $table->decimal('amount', 10, 2);
    $table->string('currency', 3)->default('EGP');
    $table->enum('status', ['pending', 'completed', 'failed', 'refunded']);

    // Paymob
    $table->string('paymob_transaction_id')->nullable();
    $table->string('paymob_order_id')->nullable();
    $table->json('paymob_response')->nullable();
    $table->string('payment_method')->nullable();

    $table->text('description')->nullable();
    $table->json('metadata')->nullable();

    $table->timestamps();
});
```

### 3.8 تعديل جدول `payments` الحالي

```php
// Migration: modify_payments_table_for_subscriptions.php
Schema::table('payments', function (Blueprint $table) {
    // Make consultation_id nullable (for subscription payments)
    $table->foreignId('consultation_id')->nullable()->change();

    // Add subscription support
    $table->foreignId('subscription_id')->nullable()->after('consultation_id')
          ->constrained()->nullOnDelete();

    // Payment type
    $table->enum('payment_type', ['consultation', 'subscription', 'upgrade'])
          ->default('consultation')->after('user_id');
});
```

### 3.9 ERD - مخطط العلاقات

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  users   │────<│ subscriptions │>────│   plans   │
└──────────┘     └──────────────┘     └───────────┘
      │                │                    │
      │                │              ┌─────┴──────┐
      │                │              │plan_features│
      │                │              └────────────┘
      │          ┌─────┴──────┐
      │          │  invoices   │
      │          └─────┬──────┘
      │                │
      │    ┌───────────┴───────────┐
      │    │subscription_transactions│
      │    └───────────────────────┘
      │
      ├────<│  payments  │ (modified)
      │
      │     ┌──────────────┐
      └────<│promo_code_uses│>────┌─────────────┐
            └──────────────┘     │ promo_codes  │
                                 └─────────────┘
```

---

## 4. الباك إند - Backend

### 4.1 Models

#### `Plan.php`

```
app/Models/Plan.php
├── fillable: name, name_en, slug, description, monthly_price, yearly_price,
│             currency, features, sort_order, badge, badge_color, icon, color,
│             is_featured, is_active, is_free, trial_days
├── casts: features → array, is_active → boolean, is_free → boolean, is_featured → boolean
├── relationships:
│   ├── planFeatures() → hasMany(PlanFeature)
│   ├── subscriptions() → hasMany(Subscription)
│   └── promoCodes() → many (via JSON applicable_plans)
├── scopes:
│   ├── scopeActive($q) → where('is_active', true)
│   └── scopeOrdered($q) → orderBy('sort_order')
├── methods:
│   ├── getPriceForCycle($cycle): decimal
│   ├── hasFeature($feature): bool
│   ├── getFeatureValue($feature): mixed
│   └── calculateYearlySavings(): decimal
```

#### `Subscription.php`

```
app/Models/Subscription.php
├── fillable: user_id, plan_id, billing_cycle, price_paid, original_price,
│             starts_at, ends_at, trial_ends_at, cancelled_at, renewed_at,
│             status, auto_renew, paymob_subscription_id, promo_code_id,
│             discount_amount, free_consultations_used, usage_reset_at
├── casts: starts_at, ends_at, trial_ends_at, cancelled_at → datetime
│          auto_renew → boolean
├── relationships:
│   ├── user() → belongsTo(User)
│   ├── plan() → belongsTo(Plan)
│   ├── promoCode() → belongsTo(PromoCode)
│   ├── invoices() → hasMany(Invoice)
│   ├── transactions() → hasMany(SubscriptionTransaction)
│   └── activatedBy() → belongsTo(User, 'activated_by')
├── scopes:
│   ├── scopeActive($q) → whereIn('status', ['active','trial'])
│   ├── scopeExpiringSoon($q, $days=3)
│   └── scopeExpired($q)
├── methods:
│   ├── isActive(): bool
│   ├── isOnTrial(): bool
│   ├── isCancelled(): bool
│   ├── isExpired(): bool
│   ├── daysRemaining(): int
│   ├── canUseFeature($feature): bool
│   ├── hasAvailableFreeConsultation(): bool
│   ├── useFreeConsultation(): void
│   ├── getConsultationDiscount(): float
│   ├── resetMonthlyUsage(): void
│   ├── cancel($reason): void
│   └── renew(): Subscription
```

#### `PromoCode.php`

```
app/Models/PromoCode.php
├── fillable: code, description, discount_type, discount_value, max_discount,
│             min_amount, applicable_plans, applicable_billing, max_uses,
│             max_uses_per_user, used_count, starts_at, expires_at, is_active
├── casts: applicable_plans → array, starts_at/expires_at → datetime
├── relationships:
│   ├── uses() → hasMany(PromoCodeUse)
│   ├── createdBy() → belongsTo(User, 'created_by')
│   └── subscriptions() → hasManyThrough(Subscription, PromoCodeUse)
├── methods:
│   ├── isValid(): bool (checks dates, active, limit)
│   ├── isApplicableToPlan($planId): bool
│   ├── isApplicableToBilling($cycle): bool
│   ├── canBeUsedByUser($userId): bool
│   ├── calculateDiscount($amount): decimal
│   └── markUsed($userId, $subscriptionId, $discount): void
```

#### `Invoice.php`

```
app/Models/Invoice.php
├── fillable: invoice_number, user_id, subscription_id, type, subtotal,
│             discount, tax, total, currency, status, payment_method,
│             transaction_id, paid_at, line_items, pdf_path,
│             refund_amount, refunded_at, refund_reason
├── casts: line_items → array, paymob_response → array, paid_at → datetime
├── relationships:
│   ├── user() → belongsTo(User)
│   ├── subscription() → belongsTo(Subscription)
│   └── transactions() → hasMany(SubscriptionTransaction)
├── methods:
│   ├── generateInvoiceNumber(): string (static)
│   ├── generatePdf(): string (path)
│   ├── markAsPaid($transactionId, $method): void
│   └── markAsRefunded($amount, $reason): void
```

#### تعديل `User.php`

```php
// Add to User model:

public function subscription()
{
    return $this->hasOne(Subscription::class)
                ->whereIn('status', ['active', 'trial'])
                ->latest();
}

public function subscriptions()
{
    return $this->hasMany(Subscription::class);
}

public function activeSubscription()
{
    return $this->subscription;
}

public function currentPlan()
{
    return $this->activeSubscription()?->plan;
}

public function isSubscribed(): bool
{
    return $this->activeSubscription() !== null;
}

public function isOnPlan(string $slug): bool
{
    return $this->currentPlan()?->slug === $slug;
}

public function hasFeature(string $feature): bool
{
    $sub = $this->activeSubscription();
    return $sub ? $sub->canUseFeature($feature) : false;
}

public function invoices()
{
    return $this->hasMany(Invoice::class);
}
```

---

### 4.2 Services

#### `SubscriptionService.php` - الخدمة الرئيسية

```
app/Services/SubscriptionService.php
│
├── subscribe($user, $planId, $billingCycle, $paymentMethod, $promoCode?):
│   │   1. Validate plan exists & active
│   │   2. Check if user already has active subscription
│   │   3. Validate & apply promo code if provided
│   │   4. Calculate final price
│   │   5. Create Subscription record (status: pending_payment)
│   │   6. Create Invoice
│   │   7. If free plan → activate immediately
│   │   8. If paid → initiate Paymob payment
│   │   9. Return payment URL or subscription
│   └── Returns: { subscription, invoice, payment_url? }
│
├── activateSubscription($subscription, $paymobResponse):
│   │   1. Update subscription status → active/trial
│   │   2. Set starts_at, ends_at, trial_ends_at
│   │   3. Mark invoice as paid
│   │   4. Create transaction record
│   │   5. Send confirmation email/notification
│   │   6. If promo code → mark as used
│   └── Returns: Subscription
│
├── renewSubscription($subscription):
│   │   1. Verify subscription is active & auto_renew
│   │   2. Calculate new period dates
│   │   3. Create new invoice
│   │   4. Initiate payment via Paymob
│   │   5. On success → extend dates, create transaction
│   │   6. On failure → mark as past_due, notify user
│   └── Returns: { subscription, invoice }
│
├── changePlan($subscription, $newPlanId, $billingCycle):
│   │   1. Calculate remaining days/value
│   │   2. Calculate proration amount (upgrade credit / downgrade)
│   │   3. Create proration invoice
│   │   4. If upgrade → charge difference
│   │   5. If downgrade → apply credit to next cycle
│   │   6. Update subscription with new plan
│   │   7. Create transaction record
│   │   8. Send notification
│   └── Returns: { subscription, proration_amount, invoice }
│
├── cancelSubscription($subscription, $reason, $immediate = false):
│   │   1. If immediate → expire now
│   │   2. If not → cancel at period end (status: cancelled)
│   │   3. Disable auto_renew
│   │   4. Create cancellation transaction
│   │   5. Send cancellation confirmation
│   │   6. Optionally process refund
│   └── Returns: Subscription
│
├── handleExpiredSubscriptions():
│   │   // Cron Job - يومياً
│   │   1. Find subscriptions where ends_at < now & status = active
│   │   2. If auto_renew → attempt renewal
│   │   3. If !auto_renew → mark as expired
│   │   4. Downgrade to free plan
│   │   5. Send expiration notifications
│   └── Returns: int (processed count)
│
├── handleExpiringSubscriptions():
│   │   // Cron Job - يومياً
│   │   1. Find subscriptions expiring in 3 days
│   │   2. Send reminder notifications
│   │   3. Find subscriptions expiring in 1 day
│   │   4. Send urgent reminder
│   └── Returns: void
│
├── resetMonthlyUsage():
│   │   // Cron Job - أول كل شهر
│   │   1. Reset free_consultations_used to 0
│   │   2. Update usage_reset_at
│   └── Returns: void
│
├── refundSubscription($subscription, $amount?, $reason?):
│   │   1. Calculate refund amount (prorated or full)
│   │   2. Process refund via PaymobService
│   │   3. Create refund invoice
│   │   4. Create refund transaction
│   │   5. Update subscription status
│   │   6. Send refund notification
│   └── Returns: { refund_amount, invoice }
│
├── getSubscriptionStats():
│   │   // للأدمن
│   │   1. Total active subscriptions
│   │   2. Revenue by plan/period
│   │   3. Churn rate
│   │   4. MRR (Monthly Recurring Revenue)
│   │   5. Conversion rates (free → paid)
│   └── Returns: array
│
└── Helper Methods:
    ├── calculatePrice($plan, $cycle, $promoCode?): decimal
    ├── calculateProration($oldPlan, $newPlan, $daysRemaining): decimal
    ├── generateSubscriptionDates($cycle, $trialDays): array
    └── canUserSubscribe($user, $plan): bool
```

#### `InvoiceService.php`

```
app/Services/InvoiceService.php
│
├── createSubscriptionInvoice($subscription, $items, $discount?):
│   │   1. Generate unique invoice number (INV-YYYY-NNNNNN)
│   │   2. Calculate subtotal, discount, tax, total
│   │   3. Create Invoice record
│   └── Returns: Invoice
│
├── generatePdf($invoice):
│   │   1. Load invoice with relationships
│   │   2. Render Blade template → PDF (using DomPDF/Snappy)
│   │   3. Store in storage/invoices/
│   │   4. Update invoice pdf_path
│   └── Returns: string (path)
│
├── downloadInvoice($invoiceId, $userId):
│   │   1. Verify user owns invoice
│   │   2. Generate PDF if not exists
│   │   3. Return download response
│   └── Returns: Response
│
├── sendInvoiceEmail($invoice):
│   │   1. Generate PDF
│   │   2. Send via Mail with PDF attachment
│   └── Returns: void
│
└── getUserInvoices($userId, $filters):
    │   Paginated list with filters (type, status, date range)
    └── Returns: LengthAwarePaginator
```

#### `PromoCodeService.php`

```
app/Services/PromoCodeService.php
│
├── validate($code, $planId, $billingCycle, $userId):
│   │   1. Find promo code by code
│   │   2. Check is_active
│   │   3. Check date validity (starts_at, expires_at)
│   │   4. Check max_uses limit
│   │   5. Check per-user limit
│   │   6. Check plan applicability
│   │   7. Check billing cycle applicability
│   └── Returns: { valid: bool, promo_code?: PromoCode, error?: string }
│
├── apply($code, $amount, $planId, $billingCycle, $userId):
│   │   1. Validate (above)
│   │   2. Calculate discount (percentage or fixed)
│   │   3. Apply max_discount cap
│   │   4. Apply min_amount check
│   └── Returns: { discount: decimal, final_price: decimal, promo_code: PromoCode }
│
├── markUsed($promoCode, $userId, $subscriptionId, $discount):
│   │   1. Create PromoCodeUse record
│   │   2. Increment used_count
│   └── Returns: void
│
└── generateCode($prefix?, $length?): string
    │   Generate unique random code: "WIDAD-XXXXX"
    └── Returns: string
```

---

### 4.3 Controllers

#### `SubscriptionController.php` (Patient)

```
app/Http/Controllers/Api/SubscriptionController.php
│
├── GET  /patient/plans
│   └── index(): List all active plans with features
│
├── GET  /patient/plans/{slug}
│   └── show(): Plan details
│
├── POST /patient/subscribe
│   │   Body: { plan_id, billing_cycle, payment_method, promo_code?, wallet_number? }
│   └── subscribe(): Create subscription + initiate payment
│
├── GET  /patient/subscription
│   └── current(): Current subscription details + usage
│
├── GET  /patient/subscription/history
│   └── history(): Past subscriptions
│
├── PUT  /patient/subscription/change-plan
│   │   Body: { plan_id, billing_cycle }
│   └── changePlan(): Upgrade/Downgrade with proration
│
├── POST /patient/subscription/cancel
│   │   Body: { reason?, immediate? }
│   └── cancel(): Cancel subscription
│
├── POST /patient/subscription/resume
│   └── resume(): Resume cancelled subscription (before period end)
│
├── POST /patient/subscription/toggle-auto-renew
│   └── toggleAutoRenew(): Toggle auto-renewal
│
├── POST /patient/promo-code/validate
│   │   Body: { code, plan_id, billing_cycle }
│   └── validatePromoCode(): Check promo code validity
│
├── GET  /patient/invoices
│   └── invoices(): List user's invoices
│
├── GET  /patient/invoices/{id}/download
│   └── downloadInvoice(): Download PDF
│
└── POST /payments/subscription/callback
    └── handlePaymobCallback(): Process Paymob webhook for subscriptions
```

#### `AdminPlanController.php` (Admin)

```
app/Http/Controllers/Api/Admin/AdminPlanController.php
│
├── GET    /admin/plans
│   └── index(): List all plans (active + inactive) with stats
│
├── POST   /admin/plans
│   │   Body: { name, name_en, slug, description, monthly_price, yearly_price,
│   │           features, trial_days, badge, is_featured, is_active, is_free,
│   │           plan_features: [{ feature_text, is_included, sort_order }] }
│   └── store(): Create new plan
│
├── GET    /admin/plans/{id}
│   └── show(): Plan details + subscriber count + revenue
│
├── PUT    /admin/plans/{id}
│   └── update(): Update plan (name, price, features...)
│
├── DELETE /admin/plans/{id}
│   └── destroy(): Soft delete (only if no active subscribers)
│
├── POST   /admin/plans/{id}/toggle-status
│   └── toggleStatus(): Activate/Deactivate plan
│
├── PUT    /admin/plans/reorder
│   │   Body: { plan_ids: [3, 1, 2, 4] }
│   └── reorder(): Update sort_order
│
├── GET    /admin/plans/{id}/subscribers
│   └── subscribers(): List subscribers of a plan
│
└── POST   /admin/plans/{id}/duplicate
    └── duplicate(): Clone plan with "-copy" suffix
```

#### `AdminSubscriptionController.php` (Admin)

```
app/Http/Controllers/Api/Admin/AdminSubscriptionController.php
│
├── GET    /admin/subscriptions
│   │   Query: ?status=active&plan_id=1&search=ahmed&page=1
│   └── index(): List all subscriptions (filterable, searchable)
│
├── GET    /admin/subscriptions/{id}
│   └── show(): Full subscription details + transactions + invoices
│
├── PUT    /admin/subscriptions/{id}
│   │   Body: { status, ends_at, admin_notes }
│   └── update(): Admin update (extend, suspend, activate)
│
├── POST   /admin/subscriptions/{id}/activate
│   └── activate(): Manually activate (gift, compensation)
│
├── POST   /admin/subscriptions/{id}/suspend
│   │   Body: { reason }
│   └── suspend(): Suspend subscription
│
├── POST   /admin/subscriptions/{id}/extend
│   │   Body: { days }
│   └── extend(): Extend subscription period
│
├── POST   /admin/subscriptions/{id}/refund
│   │   Body: { amount?, reason }
│   └── refund(): Process refund
│
├── POST   /admin/subscriptions/gift
│   │   Body: { user_id, plan_id, duration_months, reason }
│   └── gift(): Gift subscription to user
│
└── GET    /admin/subscriptions/stats
    └── stats(): Dashboard statistics
        ├── Total active subscriptions by plan
        ├── MRR (Monthly Recurring Revenue)
        ├── Churn rate
        ├── New vs Renewed
        ├── Revenue trend (chart)
        └── Top performing promo codes
```

#### `AdminPromoCodeController.php` (Admin)

```
app/Http/Controllers/Api/Admin/AdminPromoCodeController.php
│
├── GET    /admin/promo-codes
│   └── index(): List all promo codes with usage stats
│
├── POST   /admin/promo-codes
│   │   Body: { code, description, discount_type, discount_value, max_discount,
│   │           min_amount, applicable_plans, applicable_billing, max_uses,
│   │           max_uses_per_user, starts_at, expires_at }
│   └── store(): Create promo code
│
├── GET    /admin/promo-codes/{id}
│   └── show(): Code details + usage history
│
├── PUT    /admin/promo-codes/{id}
│   └── update(): Update promo code
│
├── DELETE /admin/promo-codes/{id}
│   └── destroy(): Soft delete
│
├── POST   /admin/promo-codes/{id}/toggle-status
│   └── toggleStatus(): Activate/Deactivate
│
├── POST   /admin/promo-codes/generate
│   │   Body: { prefix, count, discount_type, discount_value, ... }
│   └── bulkGenerate(): Generate multiple codes at once
│
└── GET    /admin/promo-codes/{id}/usage
    └── usage(): Detailed usage report
```

#### `AdminInvoiceController.php` (Admin)

```
app/Http/Controllers/Api/Admin/AdminInvoiceController.php
│
├── GET    /admin/invoices
│   │   Query: ?type=subscription&status=paid&user_id=5&from=&to=
│   └── index(): List all invoices (filterable)
│
├── GET    /admin/invoices/{id}
│   └── show(): Invoice details
│
├── GET    /admin/invoices/{id}/download
│   └── download(): Download PDF
│
├── POST   /admin/invoices/{id}/resend
│   └── resend(): Resend invoice email
│
└── POST   /admin/invoices/{id}/refund
    │   Body: { amount, reason }
    └── refund(): Refund invoice
```

---

### 4.4 Middleware

#### `CheckSubscription.php`

```php
// app/Http/Middleware/CheckSubscription.php
// Usage: Route::middleware('subscription:widad-plus')
// Usage: Route::middleware('subscription:feature:ai_chat_voice')

class CheckSubscription
{
    public function handle($request, Closure $next, $requirement)
    {
        $user = $request->user();

        if (str_starts_with($requirement, 'feature:')) {
            // Check specific feature
            $feature = str_replace('feature:', '', $requirement);
            if (!$user->hasFeature($feature)) {
                return response()->json([
                    'error' => 'subscription_required',
                    'message' => 'هذه الميزة تتطلب ترقية باقتك',
                    'required_feature' => $feature,
                    'upgrade_url' => '/patient/plans'
                ], 403);
            }
        } else {
            // Check minimum plan
            $sub = $user->activeSubscription();
            if (!$sub || !$this->meetsMinimumPlan($sub, $requirement)) {
                return response()->json([
                    'error' => 'plan_required',
                    'message' => "هذه الميزة تتطلب باقة $requirement أو أعلى",
                    'required_plan' => $requirement,
                    'upgrade_url' => '/patient/plans'
                ], 403);
            }
        }

        return $next($request);
    }
}
```

#### `TrackFeatureUsage.php`

```php
// app/Http/Middleware/TrackFeatureUsage.php
// حساب الاستشارات المجانية المستخدمة
// Track free consultation usage

class TrackFeatureUsage
{
    public function handle($request, Closure $next, $feature)
    {
        // Runs AFTER the request (terminate middleware)
        $response = $next($request);

        if ($feature === 'free_consultation' && $response->isSuccessful()) {
            $user = $request->user();
            $sub = $user->activeSubscription();
            if ($sub && $sub->hasAvailableFreeConsultation()) {
                $sub->useFreeConsultation();
            }
        }

        return $response;
    }
}
```

---

### 4.5 Jobs & Scheduled Tasks

```
app/Jobs/
├── ProcessSubscriptionPayment.php    // معالجة الدفع في الخلفية
├── RenewSubscription.php              // تجديد اشتراك منتهي
├── GenerateInvoicePdf.php             // إنشاء PDF في الخلفية
├── SendSubscriptionReminder.php       // تذكير قبل الانتهاء
└── HandleFailedPayment.php            // معالجة فشل الدفع

// Console/Kernel.php - Scheduled Tasks:
$schedule->command('subscriptions:check-expiring')->dailyAt('08:00');
$schedule->command('subscriptions:expire')->dailyAt('00:00');
$schedule->command('subscriptions:renew')->dailyAt('01:00');
$schedule->command('subscriptions:reset-usage')->monthlyOn(1, '00:00');
$schedule->command('subscriptions:retry-failed')->everyFourHours();
```

### 4.6 Artisan Commands

```
app/Console/Commands/
├── CheckExpiringSubscriptions.php     // subscriptions:check-expiring
├── ExpireSubscriptions.php            // subscriptions:expire
├── RenewSubscriptions.php             // subscriptions:renew
├── ResetSubscriptionUsage.php         // subscriptions:reset-usage
├── RetryFailedPayments.php            // subscriptions:retry-failed
└── SeedPlans.php                      // subscriptions:seed-plans (seed الباقات الافتراضية)
```

### 4.7 Notifications

```
app/Notifications/
├── SubscriptionActivated.php          // ✅ تم تفعيل اشتراكك
├── SubscriptionRenewed.php            // 🔄 تم تجديد اشتراكك
├── SubscriptionExpiringSoon.php       // ⚠️ اشتراكك سينتهي خلال 3 أيام
├── SubscriptionExpired.php            // ❌ انتهى اشتراكك
├── SubscriptionCancelled.php          // 🚫 تم إلغاء اشتراكك
├── PaymentFailed.php                  // ⚠️ فشل الدفع
├── PaymentSuccessful.php              // ✅ تم الدفع بنجاح
├── InvoiceGenerated.php               // 🧾 فاتورة جديدة
├── RefundProcessed.php                // 💰 تم الاسترداد
├── PlanUpgraded.php                   // ⬆️ تمت الترقية
├── FreeTrialStarted.php               // 🎁 بدأت الفترة التجريبية
└── FreeTrialEndingSoon.php            // ⏰ الفترة التجريبية تنتهي قريباً
```

### 4.8 Form Requests (Validation)

```
app/Http/Requests/
├── SubscribeRequest.php
│   ├── plan_id: required|exists:plans,id
│   ├── billing_cycle: required|in:monthly,yearly
│   ├── payment_method: required|in:paymob_card,paymob_wallet
│   └── promo_code: nullable|string|max:50
│
├── ChangePlanRequest.php
│   ├── plan_id: required|exists:plans,id
│   └── billing_cycle: required|in:monthly,yearly
│
├── StorePlanRequest.php (Admin)
│   ├── name: required|string|max:255
│   ├── slug: required|unique:plans
│   ├── monthly_price: required|numeric|min:0
│   ├── features: required|array
│   └── plan_features: array
│
├── StorePromoCodeRequest.php (Admin)
│   ├── code: required|unique:promo_codes|max:50
│   ├── discount_type: required|in:percentage,fixed
│   ├── discount_value: required|numeric|min:0
│   ├── max_uses: nullable|integer|min:1
│   └── expires_at: nullable|date|after:today
│
└── ValidatePromoCodeRequest.php
    ├── code: required|string|max:50
    ├── plan_id: required|exists:plans,id
    └── billing_cycle: required|in:monthly,yearly
```

---

## 5. الفرونت إند - Frontend

### 5.1 الصفحات و المكونات

#### صفحة الأسعار العامة `PricingPage.tsx`

```
src/pages/public/PricingPage.tsx
│
├── Hero Section
│   ├── عنوان: "باقات مصممة خصيصاً لكِ"
│   ├── وصف: "اختري الخطة التي تناسب احتياجاتك"
│   └── Toggle: شهري / سنوي (مع عرض: وفري XX%)
│
├── Plans Grid (4 كروت)
│   ├── PricingCard component (x4)
│   │   ├── Badge (الأكثر شيوعاً)
│   │   ├── Plan name + price
│   │   ├── Features list (✓/✗)
│   │   ├── CTA button ("ابدئي الآن" / "اشتركي الآن" / "المجانية لمدة 14 يوماً")
│   │   └── Featured card = larger + colored border
│   └── Responsive: 1 col mobile, 2 tablet, 4 desktop
│
├── Comparison Table Section
│   ├── عنوان: "مقارنة بين الباقات"
│   ├── Full feature comparison grid
│   ├── ✓ / ✗ / values for each plan
│   └── Responsive horizontal scroll on mobile
│
├── Testimonials Section
│   ├── شهادات المستخدمات
│   └── 2-3 testimonials with avatar + quote
│
├── FAQ Section
│   ├── Accordion with common questions
│   ├── "هل يمكنني إلغاء اشتراكي في أي وقت؟"
│   ├── "ما هي طرق الدفع المتاحة؟"
│   ├── "هل بياناتي آمنة معكم؟"
│   └── "ماذا يحدث إذا احتجت استشارات أكثر؟"
│
└── Footer CTA
    └── "ابدئي رحلتك الصحية اليوم"
```

#### صفحة الدفع/الاشتراك `SubscriptionCheckout.tsx`

```
src/pages/patient/subscription/SubscriptionCheckout.tsx
│
├── Step 1: Review Plan
│   ├── Selected plan details
│   ├── Billing cycle toggle (monthly/yearly)
│   └── Price summary
│
├── Step 2: Promo Code
│   ├── Input field + "تطبيق" button
│   ├── Validation feedback (✓ valid / ✗ invalid)
│   ├── Discount amount shown
│   └── Updated total
│
├── Step 3: Payment Method
│   ├── بطاقة ائتمان (Paymob Card)
│   ├── محفظة إلكترونية (Paymob Wallet)
│   │   └── Wallet number input (if selected)
│   └── تقسيط (Paymob Installments - if available)
│
├── Step 4: Confirmation
│   ├── Order summary
│   ├── Plan + Cycle + Discount + Total
│   ├── Terms & conditions checkbox
│   └── "إتمام الدفع" button → redirect to Paymob
│
└── Payment Result
    ├── Success: "مبارك! تم تفعيل اشتراكك في وداد بلس"
    ├── Failed: "فشل الدفع، حاولي مرة أخرى"
    └── Redirect to dashboard after 5s
```

#### صفحة إدارة الاشتراك (المريض) `MySubscription.tsx`

```
src/pages/patient/subscription/MySubscription.tsx
│
├── Current Plan Card
│   ├── Plan name + badge
│   ├── Status indicator (active/trial/cancelled)
│   ├── Next billing date
│   ├── Days remaining
│   ├── Auto-renew toggle
│   └── Price info
│
├── Usage Section
│   ├── Free consultations: 1/3 used this month
│   ├── Progress bar
│   └── Reset date
│
├── Quick Actions
│   ├── "ترقية الباقة" → /patient/plans
│   ├── "تغيير الباقة" → ChangePlanModal
│   ├── "إلغاء الاشتراك" → CancelModal
│   └── "إيقاف التجديد التلقائي" → toggle
│
├── Billing History
│   ├── List of invoices
│   ├── Each: date, amount, status, download PDF
│   └── Pagination
│
└── Change Plan Modal
    ├── Current vs New plan comparison
    ├── Proration calculation shown
    ├── "ستدفعين الفرق: XX ج.م" (upgrade)
    ├── "سيتم تخفيض باقتك نهاية الفترة الحالية" (downgrade)
    └── Confirm button
```

#### صفحة الفواتير (المريض) `InvoicesPage.tsx`

```
src/pages/patient/subscription/InvoicesPage.tsx
│
├── Filters
│   ├── Type: الكل | اشتراك | استشارة | استرداد
│   ├── Status: الكل | مدفوع | معلق | مسترد
│   └── Date range picker
│
├── Invoice List
│   ├── Invoice number
│   ├── Date
│   ├── Description
│   ├── Amount
│   ├── Status badge
│   └── Download PDF button
│
└── Invoice Detail Modal
    ├── Full invoice view
    ├── Line items
    ├── Payment method used
    └── Download button
```

---

### 5.2 Admin Pages

#### إدارة الخطط `AdminPlansPage.tsx`

```
src/pages/admin/subscriptions/AdminPlansPage.tsx
│
├── Header
│   ├── "إدارة الخطط والباقات"
│   ├── Stats cards: (إجمالي الخطط | نشطة | مشتركين | MRR)
│   └── "+ إنشاء خطة جديدة" button
│
├── Plans List (drag & drop reorder)
│   ├── For each plan:
│   │   ├── Name + badge
│   │   ├── Monthly / Yearly price
│   │   ├── Active subscribers count
│   │   ├── Revenue generated
│   │   ├── Status toggle (active/inactive)
│   │   ├── Edit button
│   │   ├── Duplicate button
│   │   └── Delete button (disabled if has subscribers)
│   └── Drag handles for reordering
│
├── Create/Edit Plan Modal
│   ├── Tab 1: Basic Info
│   │   ├── Name (AR + EN)
│   │   ├── Slug (auto-generated)
│   │   ├── Description (AR + EN)
│   │   ├── Monthly price
│   │   ├── Yearly price
│   │   ├── Trial days
│   │   └── Is Free toggle
│   │
│   ├── Tab 2: Features (JSON editor visual)
│   │   ├── articles_access: dropdown (limited/full)
│   │   ├── ai_chat_text: dropdown (limited/unlimited)
│   │   ├── ai_chat_voice: toggle
│   │   ├── health_tools_basic: toggle
│   │   ├── health_tools_advanced: toggle
│   │   ├── free_consultations_monthly: number input
│   │   ├── consultation_discount_percent: number input
│   │   ├── ai_weekly_reports: toggle
│   │   ├── ai_custom_journey: toggle
│   │   └── priority_support: toggle
│   │
│   ├── Tab 3: Display Features (list items on card)
│   │   ├── Add feature text
│   │   ├── Mark as included/excluded
│   │   ├── Drag to reorder
│   │   └── Delete
│   │
│   └── Tab 4: Display Settings
│       ├── Badge text + color
│       ├── Card color
│       ├── Is Featured toggle
│       ├── Sort order
│       └── Preview (live plan card preview)
│
└── Plan Preview Section
    └── Real-time preview of how the plan card will look
```

#### إدارة الاشتراكات `AdminSubscriptionsPage.tsx`

```
src/pages/admin/subscriptions/AdminSubscriptionsPage.tsx
│
├── Stats Dashboard
│   ├── Card: إجمالي المشتركين (active + trial)
│   ├── Card: الإيرادات الشهرية المتكررة (MRR)
│   ├── Card: معدل الإلغاء (Churn Rate)
│   ├── Card: جديد هذا الشهر
│   └── Chart: Revenue trend (line chart)
│
├── Filters & Search
│   ├── Search by user name/email
│   ├── Filter by plan
│   ├── Filter by status
│   ├── Filter by billing cycle
│   └── Date range
│
├── Subscriptions Table
│   ├── User (avatar + name)
│   ├── Plan name
│   ├── Status badge (active/trial/cancelled/expired/suspended)
│   ├── Billing cycle
│   ├── Price paid
│   ├── Start date
│   ├── End date
│   ├── Auto-renew icon
│   └── Actions dropdown:
│       ├── View details
│       ├── Extend subscription
│       ├── Suspend
│       ├── Activate
│       ├── Process refund
│       └── Gift subscription
│
├── Subscription Detail Modal
│   ├── User info
│   ├── Plan details
│   ├── Full timeline (transactions)
│   ├── Invoices list
│   ├── Usage stats
│   ├── Admin notes
│   └── Action buttons
│
└── Gift Subscription Modal
    ├── Search user
    ├── Select plan
    ├── Duration (months)
    ├── Reason
    └── Confirm
```

#### إدارة أكواد الخصم `AdminPromoCodesPage.tsx`

```
src/pages/admin/subscriptions/AdminPromoCodesPage.tsx
│
├── Header
│   ├── Stats: (إجمالي الأكواد | نشطة | إجمالي الاستخدام | إجمالي الخصومات)
│   ├── "+ إنشاء كود" button
│   └── "إنشاء أكواد متعددة" button
│
├── PromoCode Table
│   ├── Code
│   ├── Discount (XX% or XX EGP)
│   ├── Usage: used/max
│   ├── Applicable plans
│   ├── Valid dates
│   ├── Status toggle
│   └── Actions (edit, delete, view usage)
│
├── Create/Edit PromoCode Modal
│   ├── Code input (+ generate random button)
│   ├── Description
│   ├── Discount type: percentage / fixed
│   ├── Discount value
│   ├── Max discount (if percentage)
│   ├── Min order amount
│   ├── Applicable plans (multi-select or all)
│   ├── Applicable billing (all/monthly/yearly)
│   ├── Max total uses
│   ├── Max uses per user
│   ├── Start date
│   └── Expiry date
│
├── Bulk Generate Modal
│   ├── Prefix
│   ├── Count (how many codes)
│   ├── Same discount settings for all
│   └── Generate + Download CSV
│
└── Usage Report Modal
    ├── List of users who used the code
    ├── Subscription each was applied to
    ├── Discount amount each received
    └── Total discount given
```

#### إدارة الفواتير `AdminInvoicesPage.tsx`

```
src/pages/admin/subscriptions/AdminInvoicesPage.tsx
│
├── Stats Cards
│   ├── Total invoices
│   ├── Paid amount
│   ├── Pending amount
│   └── Refunded amount
│
├── Filters
│   ├── Type (subscription/consultation/refund)
│   ├── Status (paid/pending/refunded)
│   ├── User search
│   └── Date range
│
├── Invoices Table
│   ├── Invoice #
│   ├── User
│   ├── Type
│   ├── Amount
│   ├── Status
│   ├── Date
│   └── Actions (view, download, resend, refund)
│
└── Invoice Detail Modal
    ├── Full invoice preview
    ├── Line items
    ├── Payment info
    ├── Download PDF
    ├── Resend email
    └── Process refund
```

---

### 5.3 Services (Frontend)

#### `subscriptionService.ts`

```typescript
// src/services/subscriptionService.ts

interface Plan {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  features: PlanFeatures;
  plan_features: PlanFeatureItem[];
  badge: string | null;
  badge_color: string | null;
  is_featured: boolean;
  is_free: boolean;
  trial_days: number;
}

interface PlanFeatures {
  articles_access: 'limited' | 'full';
  ai_chat_text: 'limited' | 'unlimited';
  ai_chat_voice: boolean;
  ai_listening: 'limited' | 'full' | false;
  health_tools_basic: boolean;
  health_tools_advanced: boolean;
  health_center_link: boolean;
  free_consultations_monthly: number;
  consultation_discount_percent: number;
  ai_weekly_reports: boolean;
  ai_custom_journey: boolean;
  priority_support: boolean;
}

interface Subscription {
  id: number;
  plan: Plan;
  billing_cycle: 'monthly' | 'yearly';
  status: SubscriptionStatus;
  price_paid: number;
  starts_at: string;
  ends_at: string;
  trial_ends_at: string | null;
  auto_renew: boolean;
  free_consultations_used: number;
  days_remaining: number;
}

// API Methods:
getPlans(): Promise<Plan[]>
getPlan(slug: string): Promise<Plan>
subscribe(data: SubscribeData): Promise<{ subscription: Subscription; payment_url?: string }>
getCurrentSubscription(): Promise<Subscription | null>
getSubscriptionHistory(): Promise<Subscription[]>
changePlan(data: ChangePlanData): Promise<{ proration: number; payment_url?: string }>
cancelSubscription(data: CancelData): Promise<void>
resumeSubscription(): Promise<void>
toggleAutoRenew(): Promise<void>
validatePromoCode(data: ValidatePromoData): Promise<PromoValidation>
getInvoices(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>>
downloadInvoice(id: number): Promise<Blob>
```

#### `adminSubscriptionService.ts`

```typescript
// src/services/adminSubscriptionService.ts

// Plans CRUD
getPlans(): Promise<Plan[]>
createPlan(data: CreatePlanData): Promise<Plan>
updatePlan(id: number, data: UpdatePlanData): Promise<Plan>
deletePlan(id: number): Promise<void>
togglePlanStatus(id: number): Promise<void>
reorderPlans(planIds: number[]): Promise<void>
duplicatePlan(id: number): Promise<Plan>

// Subscriptions Management
getSubscriptions(filters?: SubscriptionFilters): Promise<PaginatedResponse<Subscription>>
getSubscription(id: number): Promise<SubscriptionDetail>
activateSubscription(id: number): Promise<void>
suspendSubscription(id: number, reason: string): Promise<void>
extendSubscription(id: number, days: number): Promise<void>
refundSubscription(id: number, data: RefundData): Promise<void>
giftSubscription(data: GiftData): Promise<void>
getSubscriptionStats(): Promise<SubscriptionStats>

// Promo Codes
getPromoCodes(filters?: PromoFilters): Promise<PaginatedResponse<PromoCode>>
createPromoCode(data: CreatePromoData): Promise<PromoCode>
updatePromoCode(id: number, data: UpdatePromoData): Promise<PromoCode>
deletePromoCode(id: number): Promise<void>
togglePromoCodeStatus(id: number): Promise<void>
bulkGenerateCodes(data: BulkGenerateData): Promise<PromoCode[]>
getPromoCodeUsage(id: number): Promise<PromoCodeUsage[]>

// Invoices
getInvoices(filters?: InvoiceFilters): Promise<PaginatedResponse<Invoice>>
getInvoice(id: number): Promise<InvoiceDetail>
downloadInvoice(id: number): Promise<Blob>
resendInvoice(id: number): Promise<void>
refundInvoice(id: number, data: RefundData): Promise<void>
```

---

### 5.4 Context & Hooks

```
src/contexts/SubscriptionContext.tsx
├── currentSubscription: Subscription | null
├── currentPlan: Plan | null
├── isSubscribed: boolean
├── isOnTrial: boolean
├── isFreePlan: boolean
├── hasFeature(feature: string): boolean
├── getRemainingConsultations(): number
├── getConsultationDiscount(): number
├── refreshSubscription(): void
└── Provider wraps patient routes

src/hooks/
├── useSubscription.ts          // Access subscription context
├── usePlans.ts                 // Fetch & cache plans
├── usePromoCode.ts             // Validate promo code
├── useInvoices.ts              // Fetch invoices
└── useSubscriptionGuard.ts     // Redirect if no subscription
```

---

### 5.5 Components

```
src/components/subscription/
├── PricingCard.tsx              // كارت الباقة (مطابق للتصميم)
├── PricingToggle.tsx            // Toggle شهري/سنوي
├── ComparisonTable.tsx          // جدول المقارنة
├── PromoCodeInput.tsx           // إدخال كود الخصم
├── SubscriptionStatusBadge.tsx  // بادج الحالة
├── SubscriptionCard.tsx         // كارت الاشتراك الحالي
├── UsageTracker.tsx             // تتبع الاستخدام الشهري
├── BillingHistory.tsx           // سجل الفواتير
├── ChangePlanModal.tsx          // مودال تغيير الباقة
├── CancelSubscriptionModal.tsx  // مودال الإلغاء
├── UpgradePrompt.tsx            // رسالة الترقية (تظهر عند محاولة استخدام ميزة محظورة)
└── InvoicePreview.tsx           // معاينة الفاتورة

src/components/admin/subscriptions/
├── PlanForm.tsx                 // فورم إنشاء/تعديل خطة
├── PlanCard.tsx                 // كارت الخطة في لوحة الأدمن
├── PlanFeatureEditor.tsx        // محرر المميزات (visual JSON)
├── PlanPreview.tsx              // معاينة حية للكارت
├── SubscriptionTable.tsx        // جدول الاشتراكات
├── SubscriptionDetailModal.tsx  // تفاصيل اشتراك
├── PromoCodeForm.tsx            // فورم إنشاء كود خصم
├── PromoCodeTable.tsx           // جدول أكواد الخصم
├── BulkGenerateModal.tsx        // إنشاء أكواد متعددة
├── GiftSubscriptionModal.tsx    // إهداء اشتراك
├── InvoiceTable.tsx             // جدول الفواتير
├── SubscriptionStatsCards.tsx   // إحصائيات
└── RevenueChart.tsx             // رسم بياني للإيرادات
```

---

### 5.6 Routes (App.tsx additions)

```tsx
// Public
<Route path="/pricing" element={<PricingPage />} />

// Patient
<Route path="/patient/plans" element={<PricingPage />} /> {/* or redirect to /pricing */}
<Route path="/patient/subscription" element={<MySubscription />} />
<Route path="/patient/subscription/checkout/:planSlug" element={<SubscriptionCheckout />} />
<Route path="/patient/subscription/callback" element={<SubscriptionPaymentCallback />} />
<Route path="/patient/invoices" element={<InvoicesPage />} />

// Admin
<Route path="/admin/plans" element={<AdminPlansPage />} />
<Route path="/admin/plans/:id" element={<AdminPlanDetail />} />
<Route path="/admin/subscriptions" element={<AdminSubscriptionsPage />} />
<Route path="/admin/subscriptions/:id" element={<AdminSubscriptionDetail />} />
<Route path="/admin/promo-codes" element={<AdminPromoCodesPage />} />
<Route path="/admin/invoices" element={<AdminInvoicesPage />} />
```

---

## 6. تكامل Paymob للاشتراكات

### 6.1 تعديل `PaymobService.php`

```php
// إضافة methods جديدة للاشتراكات:

/**
 * بدء دفع اشتراك
 */
public function initiateSubscriptionPayment(
    Subscription $subscription,
    Invoice $invoice,
    string $paymentMethod = 'card'
): array {
    $token = $this->authenticate();

    $merchantOrderId = "SUB-{$subscription->id}-" . time();

    $orderId = $this->registerOrder(
        $token,
        $merchantOrderId,
        $invoice->total * 100, // Convert to cents
        'EGP'
    );

    $billingData = [
        'first_name' => $subscription->user->name,
        'last_name' => '.',
        'email' => $subscription->user->email,
        'phone_number' => $subscription->user->phone ?? 'N/A',
        'apartment' => 'N/A',
        'floor' => 'N/A',
        'street' => 'N/A',
        'building' => 'N/A',
        'shipping_method' => 'N/A',
        'postal_code' => 'N/A',
        'city' => 'N/A',
        'country' => 'EG',
        'state' => 'N/A',
    ];

    $integrationId = match ($paymentMethod) {
        'wallet' => config('services.paymob.wallet_integration_id'),
        default  => config('services.paymob.integration_id'),
    };

    $paymentKey = $this->getPaymentKey(
        $token,
        $orderId,
        $invoice->total * 100,
        $integrationId,
        $billingData,
        'EGP'
    );

    // Update subscription with Paymob order
    $subscription->update(['paymob_order_id' => $orderId]);

    if ($paymentMethod === 'wallet') {
        // Wallet payment
        $walletResponse = Http::post("https://accept.paymob.com/api/acceptance/payments/pay", [
            'source' => [
                'identifier' => $subscription->user->phone,
                'subtype' => 'WALLET',
            ],
            'payment_token' => $paymentKey,
        ]);

        return [
            'type' => 'wallet',
            'redirect_url' => $walletResponse->json('redirect_url'),
            'order_id' => $orderId,
        ];
    }

    return [
        'type' => 'card',
        'payment_url' => "https://accept.paymob.com/api/acceptance/iframes/"
            . config('services.paymob.iframe_id')
            . "?payment_token={$paymentKey}",
        'order_id' => $orderId,
    ];
}

/**
 * معالجة callback الاشتراك
 */
public function processSubscriptionCallback(array $data): array
{
    $merchantOrderId = $data['merchant_order_id'] ?? '';

    // Parse: SUB-{subscription_id}-{timestamp}
    if (preg_match('/^SUB-(\d+)-/', $merchantOrderId, $matches)) {
        return [
            'type' => 'subscription',
            'subscription_id' => (int) $matches[1],
            'transaction_id' => $data['id'] ?? null,
            'success' => ($data['success'] ?? false) === 'true' || $data['success'] === true,
            'amount' => ($data['amount_cents'] ?? 0) / 100,
        ];
    }

    return ['type' => 'unknown'];
}
```

### 6.2 Callback Flow للاشتراكات

```
1. Patient selects plan → POST /patient/subscribe
2. Backend creates Subscription (pending_payment) + Invoice (pending)
3. Backend calls PaymobService::initiateSubscriptionPayment()
4. Returns payment_url or redirect_url to frontend
5. Frontend redirects to Paymob
6. Paymob processes payment
7. Paymob calls POST /payments/subscription/callback
8. Backend verifies HMAC signature
9. Backend parses merchant_order_id to get subscription_id
10. SubscriptionService::activateSubscription() called
11. Updates: subscription → active, invoice → paid
12. Creates SubscriptionTransaction record
13. Sends SubscriptionActivated notification
14. Paymob redirects to GET /patient/subscription/callback?success=true
15. Frontend shows success page
```

---

## 7. لوحة تحكم الأدمن - Admin Control

### 7.1 Navigation Structure (Sidebar)

```
لوحة التحكم
├── الرئيسية (Dashboard)
├── المستخدمين
│   ├── المرضى
│   ├── الأطباء
│   └── المسؤولين
├── طلبات الانضمام
├── الاستشارات
├── 💳 الاشتراكات (جديد)                  ← NEW SECTION
│   ├── 📋 إدارة الخطط                     ← /admin/plans
│   ├── 👥 المشتركين                       ← /admin/subscriptions
│   ├── 🏷️ أكواد الخصم                    ← /admin/promo-codes
│   └── 🧾 الفواتير                        ← /admin/invoices
├── المالية
├── التحليلات
├── المقالات
├── الرسائل
├── الإشعارات
└── الإعدادات
```

### 7.2 صلاحيات الأدمن الكاملة

| الإجراء               | التفصيل                                        |
| --------------------- | ---------------------------------------------- |
| ✅ إنشاء خطة          | تحديد الاسم، السعر، المميزات، الفترة التجريبية |
| ✅ تعديل خطة          | تغيير الأسعار (لا يؤثر على المشتركين الحاليين) |
| ✅ حذف خطة            | فقط إذا لم يكن هناك مشتركين نشطين              |
| ✅ تفعيل/تعطيل خطة    | إخفاء من العرض بدون حذف                        |
| ✅ ترتيب الخطط        | Drag & Drop لتغيير الترتيب                     |
| ✅ نسخ خطة            | نسخ سريع مع تعديل                              |
| ✅ إهداء اشتراك       | تفعيل اشتراك مجاني لمستخدم                     |
| ✅ تمديد اشتراك       | إضافة أيام/أشهر                                |
| ✅ تعليق اشتراك       | إيقاف مؤقت مع سبب                              |
| ✅ تفعيل يدوي         | تفعيل اشتراك بدون دفع                          |
| ✅ استرداد            | معالجة استرداد كامل/جزئي                       |
| ✅ إنشاء كود خصم      | مع كل التفاصيل والقيود                         |
| ✅ إنشاء أكواد متعددة | Bulk generate                                  |
| ✅ تتبع الاستخدام     | من استخدم أي كود ومتى                          |
| ✅ فواتير             | عرض، تحميل، إعادة إرسال                        |
| ✅ إحصائيات           | MRR, Churn, Growth, Revenue charts             |
| ✅ تقارير             | تصدير تقارير Excel/PDF                         |

---

## 8. خطة التنفيذ المرحلية

### المرحلة 1: البنية التحتية (2-3 أيام)

```
✅ Day 1:
├── إنشاء Migrations (plans, plan_features, subscriptions, promo_codes,
│   promo_code_uses, invoices, subscription_transactions)
├── تعديل migration payments
├── إنشاء Models (Plan, PlanFeature, Subscription, PromoCode,
│   PromoCodeUse, Invoice, SubscriptionTransaction)
├── تعديل User model
└── إنشاء Seeder للباقات الافتراضية (4 باقات من التصميم)

✅ Day 2:
├── إنشاء SubscriptionService
├── إنشاء PromoCodeService
├── إنشاء InvoiceService
├── إنشاء Form Requests
└── إنشاء CheckSubscription Middleware

✅ Day 3:
├── تعديل PaymobService للاشتراكات
├── إنشاء SubscriptionController (Patient)
├── إنشاء routes (patient.php)
├── إنشاء Notification classes
└── Unit tests أساسية
```

### المرحلة 2: الفرونت إند - المريض (2-3 أيام)

```
✅ Day 4:
├── إنشاء subscriptionService.ts
├── إنشاء SubscriptionContext
├── إنشاء PricingPage (مطابق للتصميم في الصورة)
├── إنشاء PricingCard component
├── إنشاء PricingToggle component
└── إنشاء ComparisonTable component

✅ Day 5:
├── إنشاء SubscriptionCheckout (multi-step)
├── إنشاء PromoCodeInput component
├── إنشاء SubscriptionPaymentCallback
├── ربط Paymob Payment flow
└── إنشاء MySubscription page

✅ Day 6:
├── إنشاء InvoicesPage
├── إنشاء ChangePlanModal
├── إنشاء CancelSubscriptionModal
├── إنشاء UpgradePrompt component
├── إضافة subscription info في Patient Dashboard
└── إضافة Routes في App.tsx
```

### المرحلة 3: لوحة الأدمن - الخطط (2-3 أيام)

```
✅ Day 7:
├── إنشاء AdminPlanController
├── إنشاء AdminSubscriptionController
├── إنشاء AdminPromoCodeController
├── إنشاء AdminInvoiceController
├── إنشاء admin routes
└── إنشاء adminSubscriptionService.ts

✅ Day 8:
├── إنشاء AdminPlansPage
├── إنشاء PlanForm component (with tabs)
├── إنشاء PlanFeatureEditor
├── إنشاء PlanPreview
├── إنشاء PlanCard (admin)
└── Drag & Drop reordering

✅ Day 9:
├── إنشاء AdminSubscriptionsPage
├── إنشاء SubscriptionTable
├── إنشاء SubscriptionDetailModal
├── إنشاء GiftSubscriptionModal
├── إنشاء SubscriptionStatsCards
└── إنشاء RevenueChart
```

### المرحلة 4: أكواد الخصم والفواتير (1-2 أيام)

```
✅ Day 10:
├── إنشاء AdminPromoCodesPage
├── إنشاء PromoCodeForm
├── إنشاء PromoCodeTable
├── إنشاء BulkGenerateModal
├── إنشاء PromoCode usage report
└── اختبار أكواد الخصم

✅ Day 11:
├── إنشاء AdminInvoicesPage
├── إنشاء InvoiceTable
├── إنشاء Invoice PDF template (Blade)
├── إنشاء PDF generation (DomPDF)
├── إنشاء Invoice email template
└── Download endpoint
```

### المرحلة 5: الأتمتة والتكامل (1-2 أيام)

```
✅ Day 12:
├── إنشاء Artisan Commands (expire, renew, check-expiring, reset-usage)
├── إنشاء Jobs (RenewSubscription, HandleFailedPayment, etc.)
├── إعداد Schedule في Kernel.php
├── إنشاء TrackFeatureUsage Middleware
├── ربط middleware مع routes الموجودة
└── اختبار auto-renewal flow

✅ Day 13:
├── إنشاء simulation file للاختبار
├── Integration testing كامل
├── اختبار سيناريوهات:
│   ├── اشتراك جديد (free → paid)
│   ├── ترقية (plus → pro)
│   ├── تخفيض (pro → plus)
│   ├── إلغاء
│   ├── انتهاء + تجديد تلقائي
│   ├── فشل دفع
│   ├── كود خصم
│   └── استرداد
├── تحديث Admin sidebar navigation
├── تحديث Patient sidebar navigation
└── Final polish & bug fixes
```

---

## 📊 ملخص الملفات المطلوبة

### Backend (Laravel) - ~30 ملف جديد

| النوع         | العدد | الملفات                                                                                                                    |
| ------------- | ----- | -------------------------------------------------------------------------------------------------------------------------- |
| Migrations    | 7     | plans, plan_features, subscriptions, promo_codes, promo_code_uses, invoices, subscription_transactions + modify payments   |
| Models        | 6     | Plan, PlanFeature, Subscription, PromoCode, PromoCodeUse, Invoice, SubscriptionTransaction                                 |
| Services      | 3     | SubscriptionService, InvoiceService, PromoCodeService                                                                      |
| Controllers   | 5     | SubscriptionController, AdminPlanController, AdminSubscriptionController, AdminPromoCodeController, AdminInvoiceController |
| Form Requests | 5     | SubscribeRequest, ChangePlanRequest, StorePlanRequest, StorePromoCodeRequest, ValidatePromoCodeRequest                     |
| Middleware    | 2     | CheckSubscription, TrackFeatureUsage                                                                                       |
| Notifications | 12    | (see section 4.7)                                                                                                          |
| Commands      | 5     | (see section 4.6)                                                                                                          |
| Jobs          | 5     | (see section 4.5)                                                                                                          |
| Seeder        | 1     | PlansSeeder                                                                                                                |
| Modified      | 3     | User model, PaymobService, PaymentController                                                                               |

### Frontend (React) - ~25 ملف جديد

| النوع      | العدد | الملفات                                                                                                                                         |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages      | 8     | PricingPage, SubscriptionCheckout, MySubscription, InvoicesPage, AdminPlansPage, AdminSubscriptionsPage, AdminPromoCodesPage, AdminInvoicesPage |
| Components | 20+   | PricingCard, PricingToggle, ComparisonTable, PromoCodeInput, SubscriptionCard, UsageTracker, etc.                                               |
| Services   | 2     | subscriptionService, adminSubscriptionService                                                                                                   |
| Context    | 1     | SubscriptionContext                                                                                                                             |
| Hooks      | 5     | useSubscription, usePlans, usePromoCode, useInvoices, useSubscriptionGuard                                                                      |

---

## ⚠️ ملاحظات مهمة

1. **Paymob لا يدعم الاشتراكات التلقائية المتكررة** — سنستخدم Cron Jobs + محاولة payment عند التجديد
2. **تخزين بيانات البطاقة** — لا نخزن بيانات البطاقة. كل تجديد = transaction جديدة يوجه المستخدم للدفع
3. **الباقة المجانية الافتراضية** — كل مستخدم جديد يحصل على وداد الأساسية تلقائياً
4. **Proration** — عند الترقية يُحسب الفرق بناء على الأيام المتبقية
5. **PDF Invoices** — نحتاج package مثل `barryvdh/laravel-dompdf` أو `spatie/laravel-pdf`
6. **الأمان** — كل Paymob callback يتم التحقق من HMAC signature
7. **العملة** — EGP فقط حالياً (قابل للتوسع)

---

## 9. الأمان والحماية - Security

### 9.1 Idempotency (منع التكرار)

Paymob قد يرسل callback أكثر من مرة. يجب التأكد من عدم تفعيل الاشتراك مرتين.

```php
// في SubscriptionService.php

public function activateSubscription(Subscription $subscription, array $paymobResponse): Subscription
{
    // Idempotency check — لو الاشتراك مفعّل بالفعل، لا تكرر العملية
    if ($subscription->status === 'active') {
        Log::info("Subscription #{$subscription->id} already active. Skipping duplicate activation.");
        return $subscription;
    }

    // التحقق من عدم وجود transaction بنفس الـ paymob_transaction_id
    $existingTransaction = SubscriptionTransaction::where(
        'paymob_transaction_id', $paymobResponse['id']
    )->first();

    if ($existingTransaction) {
        Log::warning("Duplicate Paymob transaction detected: {$paymobResponse['id']}");
        return $subscription;
    }

    return DB::transaction(function () use ($subscription, $paymobResponse) {
        // Lock the subscription row to prevent race conditions
        $subscription = Subscription::lockForUpdate()->find($subscription->id);

        // Double-check after lock
        if ($subscription->status === 'active') {
            return $subscription;
        }

        $subscription->update([
            'status' => $subscription->trial_ends_at ? 'trial' : 'active',
            'starts_at' => now(),
            'ends_at' => $this->calculateEndDate($subscription),
        ]);

        // باقي عمليات التفعيل...
        return $subscription;
    });
}
```

### 9.2 Rate Limiting

```php
// في routes/patient.php — حماية أكواد الخصم من الـ brute force

Route::middleware('throttle:10,1')->group(function () {
    Route::post('/promo-code/validate', [SubscriptionController::class, 'validatePromoCode']);
});

// في routes/patient.php — حماية طلبات الاشتراك
Route::middleware('throttle:5,1')->group(function () {
    Route::post('/subscribe', [SubscriptionController::class, 'subscribe']);
});
```

### 9.3 Database Locking (منع Race Conditions)

```php
// كل العمليات الحساسة تستخدم DB::transaction + lockForUpdate

// مثال: عند الترقية
public function changePlan(Subscription $subscription, int $newPlanId, string $billingCycle): array
{
    return DB::transaction(function () use ($subscription, $newPlanId, $billingCycle) {
        // قفل السجل لمنع عمليتين متزامنتين
        $subscription = Subscription::lockForUpdate()->find($subscription->id);

        if ($subscription->status !== 'active' && $subscription->status !== 'trial') {
            throw new \Exception('لا يمكن تغيير الباقة — الاشتراك غير نشط');
        }

        $newPlan = Plan::findOrFail($newPlanId);
        $proration = $this->calculateProration($subscription, $newPlan, $billingCycle);

        // ... عمليات الترقية/التخفيض

        return ['subscription' => $subscription, 'proration' => $proration];
    });
}

// مثال: استخدام استشارة مجانية
public function useFreeConsultation(Subscription $subscription): bool
{
    return DB::transaction(function () use ($subscription) {
        $subscription = Subscription::lockForUpdate()->find($subscription->id);

        $maxFree = $subscription->plan->features['free_consultations_monthly'] ?? 0;

        if ($subscription->free_consultations_used >= $maxFree) {
            return false; // لا يوجد استشارات مجانية متبقية
        }

        $subscription->increment('free_consultations_used');
        return true;
    });
}
```

### 9.4 Webhook Signature Verification للاشتراكات

```php
// في PaymentController.php — التحقق من HMAC لـ subscription callbacks

public function handleSubscriptionCallback(Request $request)
{
    // 1. التحقق من HMAC signature
    $data = $request->all();
    $hmac = $request->query('hmac') ?? $request->input('hmac');

    if (!$this->paymobService->verifyHmac($data, $hmac)) {
        Log::error('Invalid HMAC signature for subscription callback', [
            'data' => $data,
            'ip' => $request->ip(),
        ]);
        return response()->json(['error' => 'Invalid signature'], 403);
    }

    // 2. التحقق من IP (اختياري — تأكد من أن الطلب من Paymob)
    $allowedIps = config('services.paymob.allowed_ips', []);
    if (!empty($allowedIps) && !in_array($request->ip(), $allowedIps)) {
        Log::error('Subscription callback from unauthorized IP', ['ip' => $request->ip()]);
        return response()->json(['error' => 'Unauthorized'], 403);
    }

    // 3. معالجة الـ callback
    $result = $this->paymobService->processSubscriptionCallback($data);

    if ($result['type'] === 'subscription' && $result['success']) {
        $subscription = Subscription::find($result['subscription_id']);
        if ($subscription) {
            $this->subscriptionService->activateSubscription($subscription, $data);
        }
    }

    return response()->json(['status' => 'processed']);
}
```

---

## 10. استراتيجية ترحيل المستخدمين الحاليين - Existing Users Migration

### 10.1 Seeder للمستخدمين الحاليين

```php
// database/seeders/AssignFreeSubscriptionSeeder.php

class AssignFreeSubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        $freePlan = Plan::where('is_free', true)->first();

        if (!$freePlan) {
            $this->command->error('لا توجد خطة مجانية! قم بتشغيل PlansSeeder أولاً.');
            return;
        }

        // جلب المستخدمين الذين ليس لديهم اشتراك نشط
        $usersWithoutSubscription = User::where('role', 'patient')
            ->whereDoesntHave('subscriptions', function ($q) {
                $q->whereIn('status', ['active', 'trial']);
            })
            ->get();

        $count = 0;
        foreach ($usersWithoutSubscription as $user) {
            Subscription::create([
                'user_id' => $user->id,
                'plan_id' => $freePlan->id,
                'billing_cycle' => 'monthly',
                'price_paid' => 0,
                'original_price' => 0,
                'starts_at' => now(),
                'ends_at' => now()->addYears(99), // الباقة المجانية لا تنتهي
                'status' => 'active',
                'auto_renew' => false,
            ]);
            $count++;
        }

        $this->command->info("تم تعيين الباقة المجانية لـ {$count} مستخدم.");
    }
}
```

### 10.2 تعيين تلقائي عند التسجيل

```php
// في RegisterController.php أو عبر Observer

// Option 1: في الـ Controller بعد إنشاء المستخدم
$freePlan = Plan::where('is_free', true)->first();
if ($freePlan) {
    Subscription::create([
        'user_id' => $user->id,
        'plan_id' => $freePlan->id,
        'billing_cycle' => 'monthly',
        'price_paid' => 0,
        'original_price' => 0,
        'starts_at' => now(),
        'ends_at' => now()->addYears(99),
        'status' => 'active',
        'auto_renew' => false,
    ]);
}

// Option 2: عبر Model Observer (أفضل)
// app/Observers/UserObserver.php
class UserObserver
{
    public function created(User $user): void
    {
        if ($user->role === 'patient') {
            $freePlan = Plan::where('is_free', true)->first();
            if ($freePlan) {
                $user->subscriptions()->create([
                    'plan_id' => $freePlan->id,
                    'billing_cycle' => 'monthly',
                    'price_paid' => 0,
                    'original_price' => 0,
                    'starts_at' => now(),
                    'ends_at' => now()->addYears(99),
                    'status' => 'active',
                    'auto_renew' => false,
                ]);
            }
        }
    }
}
```

### 10.3 أمر Artisan لتشغيل الترحيل

```bash
# الترتيب الصحيح للتنفيذ:
php artisan migrate                              # إنشاء الجداول الجديدة
php artisan db:seed --class=PlansSeeder          # إنشاء الباقات الأربعة
php artisan db:seed --class=AssignFreeSubscriptionSeeder  # ترحيل المستخدمين الحاليين
```

---

## 11. فترة السماح - Grace Period

### 11.1 المنطق

```php
// إضافة في جدول plans
$table->integer('grace_period_days')->default(3); // فترة السماح بعد انتهاء الاشتراك

// إضافة في Subscription model
public function isInGracePeriod(): bool
{
    if ($this->status !== 'expired' && $this->status !== 'past_due') {
        return false;
    }

    $graceDays = $this->plan->grace_period_days ?? 3;
    return $this->ends_at->addDays($graceDays)->isFuture();
}

public function isActiveOrGrace(): bool
{
    return $this->isActive() || $this->isInGracePeriod();
}

// تعديل CheckSubscription middleware
public function handle($request, Closure $next, $requirement)
{
    $user = $request->user();
    $sub = $user->activeSubscription();

    // السماح بالوصول خلال فترة السماح
    if (!$sub) {
        $latestSub = $user->subscriptions()->latest()->first();
        if ($latestSub && $latestSub->isInGracePeriod()) {
            // السماح بالوصول مع تحذير
            $request->headers->set('X-Subscription-Grace', 'true');
            $request->headers->set('X-Grace-Expires', $latestSub->ends_at->addDays(
                $latestSub->plan->grace_period_days ?? 3
            )->toISOString());
            return $next($request);
        }
    }

    // ... باقي المنطق
}
```

### 11.2 Frontend — عرض تحذير فترة السماح

```tsx
// في SubscriptionContext.tsx
const isInGracePeriod = response.headers["x-subscription-grace"] === "true";
const graceExpiresAt = response.headers["x-grace-expires"];

// GracePeriodBanner.tsx — يظهر في أعلى كل صفحة
{
  isInGracePeriod && (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
      <p className="text-amber-800 text-sm">
        ⚠️ انتهت صلاحية اشتراكك. لديك حتى {formatDate(graceExpiresAt)} لتجديده
        والحفاظ على جميع مميزاتك.
        <Link to="/patient/plans" className="font-bold underline mr-2">
          جددي الآن
        </Link>
      </p>
    </div>
  );
}
```

---

## 12. تكامل الاشتراك مع حجز الاستشارات - Consultation Integration

### 12.1 تعديل Backend

```php
// تعديل ConsultationController.php — عند حجز استشارة

public function book(BookConsultationRequest $request)
{
    $user = $request->user();
    $subscription = $user->activeSubscription();

    $originalPrice = $doctor->consultation_price;
    $finalPrice = $originalPrice;
    $usedFreeConsultation = false;
    $discountPercent = 0;
    $discountAmount = 0;

    if ($subscription) {
        // 1. فحص الاستشارات المجانية
        if ($subscription->hasAvailableFreeConsultation()) {
            $finalPrice = 0;
            $usedFreeConsultation = true;
        } else {
            // 2. تطبيق خصم الباقة
            $discountPercent = $subscription->getConsultationDiscount();
            if ($discountPercent > 0) {
                $discountAmount = round($originalPrice * ($discountPercent / 100), 2);
                $finalPrice = $originalPrice - $discountAmount;
            }
        }
    }

    $consultation = Consultation::create([
        // ... البيانات الموجودة
        'original_price' => $originalPrice,
        'discount_percent' => $discountPercent,
        'discount_amount' => $discountAmount,
        'final_price' => $finalPrice,
        'used_free_consultation' => $usedFreeConsultation,
    ]);

    // إذا كانت مجانية → تأكيد فوري بدون دفع
    if ($usedFreeConsultation) {
        $subscription->useFreeConsultation();
        $consultation->update(['status' => 'confirmed', 'payment_status' => 'free']);
        return response()->json([
            'consultation' => $consultation,
            'message' => 'تم الحجز مجاناً ضمن باقتك!',
            'payment_required' => false,
        ]);
    }

    // إذا كان هناك خصم → تمرير السعر المخفض لـ Paymob
    return response()->json([
        'consultation' => $consultation,
        'payment_required' => true,
        'original_price' => $originalPrice,
        'discount' => $discountAmount,
        'final_price' => $finalPrice,
    ]);
}
```

### 12.2 تعديل جدول consultations

```php
// Migration: add_subscription_fields_to_consultations_table.php

Schema::table('consultations', function (Blueprint $table) {
    $table->decimal('original_price', 10, 2)->nullable()->after('price');
    $table->decimal('discount_percent', 5, 2)->default(0)->after('original_price');
    $table->decimal('discount_amount', 10, 2)->default(0)->after('discount_percent');
    $table->decimal('final_price', 10, 2)->nullable()->after('discount_amount');
    $table->boolean('used_free_consultation')->default(false)->after('final_price');
});
```

### 12.3 تعديل Frontend — BookConsultation.tsx

```tsx
// في BookConsultation.tsx — إضافة عرض معلومات الخصم

// State
const {
  currentSubscription,
  getRemainingConsultations,
  getConsultationDiscount,
} = useSubscription();

// في خطوة الدفع:
const remainingFree = getRemainingConsultations();
const discountPercent = getConsultationDiscount();

{
  /* عرض معلومات الباقة */
}
{
  currentSubscription && (
    <div className="bg-teal-50 rounded-xl p-4 mb-4">
      <h4 className="font-semibold text-teal-800 mb-2">
        مميزات باقتك ({currentSubscription.plan.name})
      </h4>

      {remainingFree > 0 && (
        <div className="flex items-center gap-2 text-teal-700">
          <CheckCircle className="w-5 h-5" />
          <span>
            لديك {remainingFree} استشارة مجانية — سيتم استخدام واحدة الآن!
          </span>
        </div>
      )}

      {remainingFree === 0 && discountPercent > 0 && (
        <div className="flex items-center gap-2 text-teal-700">
          <Tag className="w-5 h-5" />
          <span>خصم {discountPercent}% على الاستشارة ضمن باقتك</span>
        </div>
      )}

      {/* ملخص السعر */}
      <div className="mt-3 border-t border-teal-200 pt-3 space-y-1">
        <div className="flex justify-between text-gray-600">
          <span>سعر الاستشارة</span>
          <span>{doctor.consultation_price} ج.م</span>
        </div>
        {discountPercent > 0 && remainingFree === 0 && (
          <div className="flex justify-between text-teal-600">
            <span>خصم الباقة ({discountPercent}%)</span>
            <span>
              -
              {((doctor.consultation_price * discountPercent) / 100).toFixed(2)}{" "}
              ج.م
            </span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg">
          <span>المطلوب</span>
          <span className={remainingFree > 0 ? "text-teal-600" : ""}>
            {remainingFree > 0 ? "مجاناً ✨" : `${finalPrice} ج.م`}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## 13. الاعتماديات والمتغيرات البيئية - Dependencies & Environment

### 13.1 تثبيت الحزم المطلوبة

```bash
# Backend — تثبيت مولد PDF
composer require barryvdh/laravel-dompdf

# نشر الإعدادات
php artisan vendor:publish --provider="Barryvdh\DomPDF\ServiceProvider"
```

### 13.2 متغيرات البيئة الجديدة (`.env`)

```env
# ========================================
# Subscription System Configuration
# ========================================

# الباقة المجانية الافتراضية
SUBSCRIPTION_FREE_PLAN_SLUG=widad-basic

# فترة السماح (بالأيام) بعد انتهاء الاشتراك
SUBSCRIPTION_GRACE_PERIOD_DAYS=3

# إعادة محاولة الدفع الفاشل
SUBSCRIPTION_RETRY_MAX_ATTEMPTS=3
SUBSCRIPTION_RETRY_INTERVAL_HOURS=24

# الفواتير
INVOICE_PREFIX=INV
INVOICE_COMPANY_NAME="وداد تك"
INVOICE_COMPANY_ADDRESS="القاهرة، مصر"
INVOICE_COMPANY_PHONE="+20XXXXXXXXXX"
INVOICE_COMPANY_EMAIL="billing@widadtech.com"
INVOICE_COMPANY_TAX_NUMBER=""
INVOICE_LOGO_PATH="images/logo.png"

# أكواد الخصم
PROMO_CODE_DEFAULT_PREFIX=WIDAD

# Paymob — IPs المسموح بها للـ webhooks (مفصولة بفاصلة)
PAYMOB_ALLOWED_IPS=""

# إعدادات الإشعارات
SUBSCRIPTION_NOTIFY_BEFORE_EXPIRY_DAYS=3,1
```

### 13.3 ملف Config جديد

```php
// config/subscription.php

return [
    'free_plan_slug' => env('SUBSCRIPTION_FREE_PLAN_SLUG', 'widad-basic'),

    'grace_period_days' => env('SUBSCRIPTION_GRACE_PERIOD_DAYS', 3),

    'retry' => [
        'max_attempts' => env('SUBSCRIPTION_RETRY_MAX_ATTEMPTS', 3),
        'interval_hours' => env('SUBSCRIPTION_RETRY_INTERVAL_HOURS', 24),
    ],

    'invoice' => [
        'prefix' => env('INVOICE_PREFIX', 'INV'),
        'company' => [
            'name' => env('INVOICE_COMPANY_NAME', 'وداد تك'),
            'address' => env('INVOICE_COMPANY_ADDRESS', ''),
            'phone' => env('INVOICE_COMPANY_PHONE', ''),
            'email' => env('INVOICE_COMPANY_EMAIL', ''),
            'tax_number' => env('INVOICE_COMPANY_TAX_NUMBER', ''),
            'logo' => env('INVOICE_LOGO_PATH', 'images/logo.png'),
        ],
    ],

    'promo_code_prefix' => env('PROMO_CODE_DEFAULT_PREFIX', 'WIDAD'),

    'notify_before_expiry_days' => array_map('intval',
        explode(',', env('SUBSCRIPTION_NOTIFY_BEFORE_EXPIRY_DAYS', '3,1'))
    ),

    'paymob_allowed_ips' => array_filter(
        explode(',', env('PAYMOB_ALLOWED_IPS', ''))
    ),
];
```

---

## 14. شكل API Responses - API Response Structure

### 14.1 Plans Response

```json
// GET /patient/plans
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": 1,
        "name": "وداد الأساسية",
        "name_en": "Widad Basic",
        "slug": "widad-basic",
        "description": "وصول محدود للمقالات والأدوات الصحية الأساسية",
        "monthly_price": 0,
        "yearly_price": 0,
        "currency": "EGP",
        "is_free": true,
        "is_featured": false,
        "badge": null,
        "badge_color": null,
        "trial_days": 0,
        "features": {
          "articles_access": "limited",
          "ai_chat_text": "limited",
          "ai_chat_voice": false,
          "health_tools_basic": true,
          "health_tools_advanced": false,
          "free_consultations_monthly": 0,
          "consultation_discount_percent": 0,
          "ai_weekly_reports": false,
          "ai_custom_journey": false,
          "priority_support": false
        },
        "plan_features": [
          { "feature_text": "وصول محدود للمقالات", "is_included": true },
          { "feature_text": "الأدوات الصحية الأساسية", "is_included": true },
          { "feature_text": "دردشة محدودة مع وداد", "is_included": true },
          { "feature_text": "استشارات مجانية", "is_included": false },
          { "feature_text": "تقارير صحية أسبوعية", "is_included": false }
        ],
        "yearly_savings": 0
      }
      // ... باقي الخطط
    ],
    "current_plan_slug": "widad-basic" // للمستخدم المسجل
  }
}
```

### 14.2 Current Subscription Response

```json
// GET /patient/subscription
{
  "success": true,
  "data": {
    "subscription": {
      "id": 15,
      "plan": {
        "id": 2,
        "name": "وداد بلس",
        "slug": "widad-plus",
        "monthly_price": 149,
        "features": { "..." }
      },
      "billing_cycle": "monthly",
      "status": "active",
      "price_paid": 149.00,
      "starts_at": "2026-02-01T00:00:00Z",
      "ends_at": "2026-03-01T00:00:00Z",
      "trial_ends_at": null,
      "auto_renew": true,
      "days_remaining": 13,
      "is_in_grace_period": false
    },
    "usage": {
      "free_consultations_total": 1,
      "free_consultations_used": 0,
      "free_consultations_remaining": 1,
      "consultation_discount_percent": 20,
      "usage_resets_at": "2026-03-01T00:00:00Z"
    },
    "can_upgrade": true,
    "can_downgrade": true,
    "upgrade_options": [
      { "plan_id": 3, "name": "وداد برو", "price_difference": 150.00 },
      { "plan_id": 4, "name": "وداد برو بلس", "price_difference": 300.00 }
    ],
    "downgrade_options": [
      { "plan_id": 1, "name": "وداد الأساسية", "effective_at": "2026-03-01T00:00:00Z" }
    ]
  }
}
```

### 14.3 Subscribe Response

```json
// POST /patient/subscribe — Success (paid plan)
{
  "success": true,
  "data": {
    "subscription": {
      "id": 16,
      "plan_id": 2,
      "status": "pending_payment",
      "billing_cycle": "monthly",
      "price_paid": 149.00,
      "discount_amount": 0
    },
    "invoice": {
      "id": 25,
      "invoice_number": "INV-2026-000025",
      "total": 149.00
    },
    "payment": {
      "type": "card",
      "payment_url": "https://accept.paymob.com/api/acceptance/iframes/XXXXX?payment_token=YYY",
      "order_id": "SUB-16-1739700000"
    }
  },
  "message": "تم إنشاء طلب الاشتراك. يرجى إتمام الدفع."
}

// POST /patient/subscribe — Success (free plan)
{
  "success": true,
  "data": {
    "subscription": {
      "id": 16,
      "plan_id": 1,
      "status": "active",
      "billing_cycle": "monthly",
      "price_paid": 0
    },
    "payment": null
  },
  "message": "تم تفعيل اشتراكك المجاني بنجاح!"
}
```

### 14.4 Promo Code Validation Response

```json
// POST /patient/promo-code/validate — Valid
{
  "success": true,
  "data": {
    "valid": true,
    "code": "WELCOME50",
    "discount_type": "percentage",
    "discount_value": 50,
    "discount_amount": 74.50,
    "original_price": 149.00,
    "final_price": 74.50,
    "message": "خصم 50% — وفرتِ 74.50 ج.م!"
  }
}

// POST /patient/promo-code/validate — Invalid
{
  "success": false,
  "data": {
    "valid": false,
    "error": "expired",
    "message": "انتهت صلاحية هذا الكود"
  }
}
```

### 14.5 Error Responses

```json
// 403 — اشتراك مطلوب
{
  "success": false,
  "error": "subscription_required",
  "message": "هذه الميزة تتطلب ترقية باقتك",
  "data": {
    "required_feature": "ai_chat_voice",
    "current_plan": "widad-basic",
    "suggested_plan": {
      "id": 2,
      "name": "وداد بلس",
      "slug": "widad-plus",
      "monthly_price": 149.00
    },
    "upgrade_url": "/patient/plans"
  }
}

// 402 — فشل الدفع
{
  "success": false,
  "error": "payment_failed",
  "message": "فشل الدفع. يرجى المحاولة مرة أخرى.",
  "data": {
    "reason": "insufficient_funds",
    "can_retry": true,
    "retry_url": "/patient/subscription/checkout/widad-plus"
  }
}
```

---

## 15. قنوات الإشعارات - Notification Channels

### 15.1 تحديد القنوات لكل نوع إشعار

| الإشعار                    | Database | Email      | WebPush | SMS |
| -------------------------- | -------- | ---------- | ------- | --- |
| `SubscriptionActivated`    | ✅       | ✅         | ✅      | ❌  |
| `SubscriptionRenewed`      | ✅       | ✅         | ❌      | ❌  |
| `SubscriptionExpiringSoon` | ✅       | ✅         | ✅      | ❌  |
| `SubscriptionExpired`      | ✅       | ✅         | ✅      | ❌  |
| `SubscriptionCancelled`    | ✅       | ✅         | ❌      | ❌  |
| `PaymentFailed`            | ✅       | ✅         | ✅      | ✅  |
| `PaymentSuccessful`        | ✅       | ✅         | ❌      | ❌  |
| `InvoiceGenerated`         | ✅       | ✅ (+ PDF) | ❌      | ❌  |
| `RefundProcessed`          | ✅       | ✅         | ✅      | ❌  |
| `PlanUpgraded`             | ✅       | ✅         | ✅      | ❌  |
| `FreeTrialStarted`         | ✅       | ✅         | ✅      | ❌  |
| `FreeTrialEndingSoon`      | ✅       | ✅         | ✅      | ❌  |

### 15.2 مثال على Notification متعدد القنوات

```php
// app/Notifications/SubscriptionExpiringSoon.php

class SubscriptionExpiringSoon extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Subscription $subscription,
        public int $daysRemaining
    ) {}

    public function via($notifiable): array
    {
        $channels = ['database'];

        // Email دائماً
        $channels[] = 'mail';

        // WebPush لو المستخدم مشترك
        if ($notifiable->pushSubscriptions()->exists()) {
            $channels[] = WebPushChannel::class;
        }

        return $channels;
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("⚠️ اشتراكك سينتهي خلال {$this->daysRemaining} أيام")
            ->greeting("مرحباً {$notifiable->name}")
            ->line("اشتراكك في باقة {$this->subscription->plan->name} سينتهي في {$this->subscription->ends_at->format('Y-m-d')}")
            ->line("جددي اشتراكك الآن للحفاظ على جميع مميزاتك.")
            ->action('تجديد الاشتراك', url('/patient/subscription'))
            ->line('شكراً لثقتك في وداد تك! 💚');
    }

    public function toDatabase($notifiable): array
    {
        return [
            'type' => 'subscription_expiring',
            'title' => 'اشتراكك على وشك الانتهاء',
            'message' => "باقتك {$this->subscription->plan->name} ستنتهي خلال {$this->daysRemaining} أيام",
            'action_url' => '/patient/subscription',
            'action_text' => 'جددي الآن',
            'subscription_id' => $this->subscription->id,
            'days_remaining' => $this->daysRemaining,
            'icon' => 'warning',
        ];
    }

    public function toWebPush($notifiable, $notification): WebPushMessage
    {
        return (new WebPushMessage)
            ->title("⚠️ اشتراكك سينتهي قريباً")
            ->body("باقتك {$this->subscription->plan->name} ستنتهي خلال {$this->daysRemaining} أيام. جددي الآن!")
            ->icon('/icons/icon-192x192.png')
            ->action('تجديد', '/patient/subscription')
            ->data(['subscription_id' => $this->subscription->id]);
    }
}
```

---

## 16. قالب فاتورة PDF - Invoice PDF Template

### 16.1 تصميم الفاتورة

```
┌──────────────────────────────────────────────────┐
│  [شعار وداد تك]                    فاتورة ضريبية │
│  وداد تك                                         │
│  القاهرة، مصر                                    │
│  billing@widadtech.com                            │
│  الرقم الضريبي: XXXXXXXXX                        │
├──────────────────────────────────────────────────┤
│  رقم الفاتورة: INV-2026-000025                   │
│  تاريخ الإصدار: 2026-02-16                       │
│  تاريخ الدفع: 2026-02-16                         │
│  طريقة الدفع: بطاقة ائتمان                       │
├──────────────────────────────────────────────────┤
│  فاتورة إلى:                                     │
│  أحمد محمد                                       │
│  ahmed@example.com                                │
│  +201XXXXXXXXX                                   │
├──────────────────────────────────────────────────┤
│  الوصف          │ الكمية │ سعر الوحدة │ الإجمالي │
│─────────────────┼────────┼───────────┼──────────│
│  اشتراك وداد   │   1    │  149.00   │  149.00  │
│  بلس - شهري     │        │   ج.م     │   ج.م    │
├──────────────────────────────────────────────────┤
│                       المجموع الفرعي:  149.00 ج.م│
│                       الخصم (WELCOME50):  -74.50 │
│                       الضريبة (0%):       0.00   │
│                       ═══════════════════════════│
│                       الإجمالي:         74.50 ج.م│
├──────────────────────────────────────────────────┤
│  الحالة: ✅ مدفوعة                                │
│  رقم المعاملة: TXN-XXXXXXXX                      │
├──────────────────────────────────────────────────┤
│  شكراً لثقتك في وداد تك! 💚                      │
│  للدعم: support@widadtech.com                    │
└──────────────────────────────────────────────────┘
```

### 16.2 ملفات القالب

```
resources/views/invoices/
├── subscription.blade.php       // قالب فاتورة الاشتراك
├── consultation.blade.php       // قالب فاتورة الاستشارة
├── refund.blade.php             // قالب فاتورة الاسترداد
└── partials/
    ├── header.blade.php         // ترويسة مشتركة (شعار + بيانات الشركة)
    ├── footer.blade.php         // تذييل مشترك
    └── styles.blade.php         // CSS للـ PDF
```

### 16.3 Blade Template مثال

```blade
{{-- resources/views/invoices/subscription.blade.php --}}

<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');

        * { font-family: 'Cairo', sans-serif; }
        body { direction: rtl; text-align: right; color: #333; padding: 40px; }

        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #14b8a6; padding-bottom: 20px; }
        .logo { width: 120px; }
        .invoice-title { font-size: 28px; color: #14b8a6; font-weight: 700; }

        .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
        .info-box { background: #f8fffe; padding: 15px; border-radius: 8px; width: 48%; }

        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #14b8a6; color: white; padding: 12px; text-align: right; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; }

        .totals { text-align: left; margin-top: 20px; }
        .totals table { width: 300px; margin-right: 0; margin-left: auto; }
        .grand-total { font-size: 18px; font-weight: 700; color: #14b8a6; border-top: 2px solid #14b8a6; }

        .status-paid { color: #16a34a; font-weight: 700; }
        .footer { text-align: center; margin-top: 40px; color: #9ca3af; font-size: 12px; }
    </style>
</head>
<body>
    @include('invoices.partials.header')

    <div class="info-section">
        <div class="info-box">
            <strong>فاتورة إلى:</strong><br>
            {{ $invoice->user->name }}<br>
            {{ $invoice->user->email }}<br>
            {{ $invoice->user->phone ?? '' }}
        </div>
        <div class="info-box">
            <strong>رقم الفاتورة:</strong> {{ $invoice->invoice_number }}<br>
            <strong>تاريخ الإصدار:</strong> {{ $invoice->created_at->format('Y-m-d') }}<br>
            <strong>تاريخ الدفع:</strong> {{ $invoice->paid_at?->format('Y-m-d') ?? '---' }}<br>
            <strong>طريقة الدفع:</strong> {{ $invoice->payment_method ?? '---' }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>الوصف</th>
                <th>الكمية</th>
                <th>سعر الوحدة</th>
                <th>الإجمالي</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->line_items as $item)
            <tr>
                <td>{{ $item['description'] }}</td>
                <td>{{ $item['quantity'] }}</td>
                <td>{{ number_format($item['unit_price'], 2) }} {{ $invoice->currency }}</td>
                <td>{{ number_format($item['total'], 2) }} {{ $invoice->currency }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>المجموع الفرعي</td>
                <td>{{ number_format($invoice->subtotal, 2) }} {{ $invoice->currency }}</td>
            </tr>
            @if($invoice->discount > 0)
            <tr>
                <td>الخصم</td>
                <td>-{{ number_format($invoice->discount, 2) }} {{ $invoice->currency }}</td>
            </tr>
            @endif
            @if($invoice->tax > 0)
            <tr>
                <td>الضريبة</td>
                <td>{{ number_format($invoice->tax, 2) }} {{ $invoice->currency }}</td>
            </tr>
            @endif
            <tr class="grand-total">
                <td>الإجمالي</td>
                <td>{{ number_format($invoice->total, 2) }} {{ $invoice->currency }}</td>
            </tr>
        </table>
    </div>

    <p class="status-paid">
        الحالة: {{ $invoice->status === 'paid' ? '✅ مدفوعة' : ($invoice->status === 'refunded' ? '🔄 مستردة' : '⏳ معلقة') }}
    </p>

    @include('invoices.partials.footer')
</body>
</html>
```

### 16.4 PDF Service استخدام DomPDF

```php
// في InvoiceService.php

use Barryvdh\DomPDF\Facade\Pdf;

public function generatePdf(Invoice $invoice): string
{
    $invoice->load(['user', 'subscription.plan']);

    $template = match ($invoice->type) {
        'subscription', 'upgrade_proration' => 'invoices.subscription',
        'consultation' => 'invoices.consultation',
        'refund' => 'invoices.refund',
        default => 'invoices.subscription',
    };

    $pdf = Pdf::loadView($template, ['invoice' => $invoice])
        ->setPaper('a4')
        ->setOption('defaultFont', 'Cairo')
        ->setOption('isHtml5ParserEnabled', true)
        ->setOption('isRemoteEnabled', true);

    $directory = 'invoices/' . $invoice->created_at->format('Y/m');
    $filename = "{$invoice->invoice_number}.pdf";
    $path = "{$directory}/{$filename}";

    Storage::disk('local')->put($path, $pdf->output());

    $invoice->update(['pdf_path' => $path]);

    return $path;
}
```

---

## 17. التعامل مع الأخطاء وإعادة المحاولة - Error Handling & Retry Logic

### 17.1 سياسة إعادة المحاولة

```php
// app/Console/Commands/RetryFailedPayments.php

class RetryFailedPayments extends Command
{
    protected $signature = 'subscriptions:retry-failed';
    protected $description = 'إعادة محاولة المدفوعات الفاشلة';

    private const MAX_RETRY_ATTEMPTS = 3;       // 3 محاولات كحد أقصى
    private const RETRY_INTERVAL_HOURS = 24;    // 24 ساعة بين كل محاولة
    private const FINAL_GRACE_HOURS = 72;       // 72 ساعة (3 أيام) ثم يُلغى

    public function handle(SubscriptionService $service): void
    {
        $failedSubscriptions = Subscription::where('status', 'past_due')
            ->where('ends_at', '<', now())
            ->get();

        foreach ($failedSubscriptions as $subscription) {
            $retryCount = $subscription->metadata['retry_count'] ?? 0;
            $lastRetry = $subscription->metadata['last_retry_at'] ?? null;

            // التحقق من الفاصل الزمني بين المحاولات
            if ($lastRetry && Carbon::parse($lastRetry)->diffInHours(now()) < self::RETRY_INTERVAL_HOURS) {
                $this->line("Skipping SUB#{$subscription->id} — too soon to retry.");
                continue;
            }

            if ($retryCount >= self::MAX_RETRY_ATTEMPTS) {
                // استنفدنا كل المحاولات
                $this->handleMaxRetriesExceeded($subscription);
                continue;
            }

            try {
                $this->info("Retrying payment for SUB#{$subscription->id} (attempt {$retryCount + 1})...");

                // إنشاء invoice جديد + إرسال رابط دفع للمستخدم
                $result = $service->renewSubscription($subscription);

                // إرسال إشعار للمستخدم بالرابط
                $subscription->user->notify(new PaymentRetryNotification(
                    $subscription,
                    $result['payment_url'] ?? null,
                    $retryCount + 1,
                    self::MAX_RETRY_ATTEMPTS
                ));

                // تحديث عداد المحاولات
                $subscription->update([
                    'metadata' => array_merge($subscription->metadata ?? [], [
                        'retry_count' => $retryCount + 1,
                        'last_retry_at' => now()->toISOString(),
                    ]),
                ]);

                $this->info("Payment link sent to {$subscription->user->email}");

            } catch (\Exception $e) {
                Log::error("Failed to retry SUB#{$subscription->id}: {$e->getMessage()}");
                $this->error("Error retrying SUB#{$subscription->id}: {$e->getMessage()}");
            }
        }
    }

    private function handleMaxRetriesExceeded(Subscription $subscription): void
    {
        $this->warn("SUB#{$subscription->id} — max retries exceeded. Expiring.");

        $subscription->update([
            'status' => 'expired',
            'auto_renew' => false,
        ]);

        // تخفيض للباقة المجانية
        $freePlan = Plan::where('is_free', true)->first();
        if ($freePlan) {
            Subscription::create([
                'user_id' => $subscription->user_id,
                'plan_id' => $freePlan->id,
                'billing_cycle' => 'monthly',
                'price_paid' => 0,
                'original_price' => 0,
                'starts_at' => now(),
                'ends_at' => now()->addYears(99),
                'status' => 'active',
                'auto_renew' => false,
            ]);
        }

        // إشعار نهائي
        $subscription->user->notify(new SubscriptionExpired($subscription));

        Log::info("SUB#{$subscription->id} expired after {self::MAX_RETRY_ATTEMPTS} failed retries.");
    }
}
```

### 17.2 التعامل مع Paymob Down

```php
// في SubscriptionService.php

public function initiatePaymentWithFallback(Subscription $subscription, Invoice $invoice): array
{
    try {
        return $this->paymobService->initiateSubscriptionPayment($subscription, $invoice);
    } catch (ConnectionException $e) {
        // Paymob غير متاح — نضع في قائمة الانتظار
        Log::error('Paymob is unreachable: ' . $e->getMessage());

        ProcessSubscriptionPayment::dispatch($subscription, $invoice)
            ->delay(now()->addMinutes(15))
            ->onQueue('payments');

        return [
            'type' => 'queued',
            'message' => 'خدمة الدفع غير متاحة حالياً. سنرسل لك رابط الدفع عبر البريد خلال دقائق.',
            'retry_at' => now()->addMinutes(15)->toISOString(),
        ];
    } catch (PaymobException $e) {
        Log::error('Paymob error: ' . $e->getMessage(), [
            'subscription_id' => $subscription->id,
            'response' => $e->getResponse(),
        ]);

        throw new PaymentException(
            'حدث خطأ أثناء معالجة الدفع. يرجى المحاولة لاحقاً.',
            $e->getCode(),
            $e
        );
    }
}
```

### 17.3 تسلسل الأحداث عند فشل التجديد

```
يوم 0: انتهاء الاشتراك
  └── محاولة تجديد تلقائي #1
  └── لو فشل → status = past_due + إشعار email + push

يوم 1 (+24 ساعة): محاولة #2
  └── إرسال رابط دفع جديد عبر email + SMS
  └── لو فشل → إشعار تحذيري "اشتراكك معلق"

يوم 2 (+48 ساعة): محاولة #3 (الأخيرة)
  └── إرسال إشعار أخير "ستفقدين مميزاتك خلال 24 ساعة"

يوم 3 (+72 ساعة): انتهاء فترة السماح
  └── status = expired
  └── تخفيض تلقائي للباقة المجانية
  └── إشعار "انتهى اشتراكك — يمكنك التجديد في أي وقت"
```

---

## 18. التخزين المؤقت - Caching Strategy

### 18.1 كاش الخطط

```php
// في PlanService.php أو SubscriptionService.php

use Illuminate\Support\Facades\Cache;

class PlanService
{
    private const PLANS_CACHE_KEY = 'active_plans';
    private const PLANS_CACHE_TTL = 3600; // ساعة واحدة

    public function getActivePlans(): Collection
    {
        return Cache::remember(self::PLANS_CACHE_KEY, self::PLANS_CACHE_TTL, function () {
            return Plan::with('planFeatures')
                ->active()
                ->ordered()
                ->get();
        });
    }

    public function getPlanBySlug(string $slug): ?Plan
    {
        return Cache::remember("plan:{$slug}", self::PLANS_CACHE_TTL, function () use ($slug) {
            return Plan::with('planFeatures')
                ->where('slug', $slug)
                ->active()
                ->first();
        });
    }

    /**
     * تنقية الكاش عند تعديل أي خطة
     * يُستدعى من AdminPlanController بعد create/update/delete/toggle/reorder
     */
    public function clearPlansCache(): void
    {
        Cache::forget(self::PLANS_CACHE_KEY);

        // مسح كاش كل خطة بالـ slug
        Plan::all()->each(function ($plan) {
            Cache::forget("plan:{$plan->slug}");
        });
    }
}
```

### 18.2 كاش اشتراك المستخدم

```php
// في User model أو SubscriptionService

public function getCachedSubscription(): ?Subscription
{
    return Cache::remember(
        "user:{$this->id}:subscription",
        300, // 5 دقائق
        fn() => $this->subscription()->with('plan')->first()
    );
}

// تنقية عند أي تغيير في الاشتراك
public static function clearSubscriptionCache(int $userId): void
{
    Cache::forget("user:{$userId}:subscription");
}

// Observer لتنقية الكاش تلقائياً
class SubscriptionObserver
{
    public function saved(Subscription $subscription): void
    {
        Cache::forget("user:{$subscription->user_id}:subscription");
    }

    public function deleted(Subscription $subscription): void
    {
        Cache::forget("user:{$subscription->user_id}:subscription");
    }
}
```

### 18.3 Frontend Caching (React Query)

```tsx
// في usePlans.ts
export const usePlans = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => subscriptionService.getPlans(),
    staleTime: 1000 * 60 * 30, // 30 دقيقة — الخطط نادراً ما تتغير
    gcTime: 1000 * 60 * 60, // ساعة في الـ garbage collector
  });
};

// في useSubscription.ts
export const useCurrentSubscription = () => {
  return useQuery({
    queryKey: ["subscription", "current"],
    queryFn: () => subscriptionService.getCurrentSubscription(),
    staleTime: 1000 * 60 * 5, // 5 دقائق
    refetchOnWindowFocus: true, // تحديث عند العودة للصفحة
  });
};
```

---

## 19. Feature Gating في الفرونت إند - Frontend Feature Gating

### 19.1 مكون حماية الميزات

```tsx
// src/components/subscription/FeatureGate.tsx

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}) => {
  const { hasFeature, currentPlan } = useSubscription();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} currentPlan={currentPlan} />;
  }

  return null;
};

// مثال الاستخدام:
<FeatureGate feature="ai_chat_voice">
  <VoiceChatWidget />
</FeatureGate>

<FeatureGate
  feature="health_tools_advanced"
  fallback={
    <div className="text-center p-8 text-gray-400">
      <Lock className="w-12 h-12 mx-auto mb-3" />
      <p>الأدوات المتقدمة متاحة في باقة وداد بلس وأعلى</p>
    </div>
  }
>
  <AdvancedHealthTools />
</FeatureGate>
```

### 19.2 مكون رسالة الترقية

```tsx
// src/components/subscription/UpgradePrompt.tsx

interface UpgradePromptProps {
  feature: string;
  currentPlan: Plan | null;
  variant?: "inline" | "modal" | "banner" | "card";
}

const FEATURE_NAMES: Record<string, { name: string; minPlan: string }> = {
  ai_chat_voice: { name: "المحادثة الصوتية مع وداد", minPlan: "وداد بلس" },
  health_tools_advanced: {
    name: "الأدوات الصحية المتقدمة",
    minPlan: "وداد بلس",
  },
  ai_weekly_reports: {
    name: "التقارير الأسبوعية بالذكاء الاصطناعي",
    minPlan: "وداد برو",
  },
  ai_custom_journey: {
    name: "الرحلة المخصصة بالذكاء الاصطناعي",
    minPlan: "وداد برو بلس",
  },
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  currentPlan,
  variant = "card",
}) => {
  const navigate = useNavigate();
  const featureInfo = FEATURE_NAMES[feature];

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 text-center border border-teal-100">
      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Crown className="w-8 h-8 text-teal-600" />
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {featureInfo?.name ?? "هذه الميزة"} تحتاج ترقية
      </h3>

      <p className="text-gray-600 text-sm mb-4">
        هذه الميزة متاحة في باقة {featureInfo?.minPlan ?? "أعلى"} وما فوقها.
        {currentPlan && (
          <span className="block mt-1">باقتك الحالية: {currentPlan.name}</span>
        )}
      </p>

      <Button
        onClick={() => navigate("/patient/plans")}
        className="bg-teal-600 hover:bg-teal-700 text-white"
      >
        <Sparkles className="w-4 h-4 ml-2" />
        اكتشفي الباقات
      </Button>
    </div>
  );
};
```

### 19.3 Loading & Error States

```tsx
// src/components/subscription/SubscriptionLoadingState.tsx

// Loading skeleton لصفحة الأسعار
export const PricingPageSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-2/3 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="h-3 bg-gray-100 rounded w-full" />
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded-xl mt-6" />
      </div>
    ))}
  </div>
);

// Error state
export const SubscriptionError: React.FC<{ onRetry: () => void }> = ({
  onRetry,
}) => (
  <div className="text-center py-12">
    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 mb-2">حدث خطأ</h3>
    <p className="text-gray-500 mb-4">لم نتمكن من تحميل بيانات الاشتراك</p>
    <Button variant="outline" onClick={onRetry}>
      <RefreshCw className="w-4 h-4 ml-2" />
      إعادة المحاولة
    </Button>
  </div>
);

// Empty state — لا يوجد اشتراك
export const NoSubscription: React.FC = () => (
  <div className="text-center py-12">
    <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-800 mb-2">
      لا يوجد اشتراك نشط
    </h3>
    <p className="text-gray-500 mb-4">
      اختري باقة تناسبك للاستفادة من جميع المميزات
    </p>
    <Link to="/patient/plans">
      <Button className="bg-teal-600 hover:bg-teal-700">تصفحي الباقات</Button>
    </Link>
  </div>
);
```

### 19.4 SEO لصفحة الأسعار

```tsx
// في PricingPage.tsx
import { Helmet } from "react-helmet-async";

export const PricingPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>أسعار وباقات وداد تك — اختري الخطة المناسبة لكِ</title>
        <meta
          name="description"
          content="اكتشفي باقات وداد تك للرعاية الصحية النسائية. من الباقة المجانية إلى وداد برو بلس. استشارات طبية، أدوات صحية، ذكاء اصطناعي، والمزيد."
        />
        <meta
          name="keywords"
          content="وداد تك, أسعار, باقات, اشتراك, استشارات طبية, صحة المرأة"
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="باقات وداد تك — رعاية صحية مصممة لكِ"
        />
        <meta
          property="og:description"
          content="4 باقات مرنة تناسب احتياجاتك. ابدئي مجاناً أو اختري الباقة الأنسب."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="/images/pricing-og.jpg" />

        {/* Structured Data — Product */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "وداد تك — باقات الاشتراك",
            description: "باقات رعاية صحية نسائية متكاملة",
            offers: {
              "@type": "AggregateOffer",
              priceCurrency: "EGP",
              lowPrice: "0",
              highPrice: "449",
              offerCount: "4",
            },
          })}
        </script>
      </Helmet>

      {/* محتوى الصفحة */}
    </>
  );
};
```

---

## 20. تسجيل الأحداث والتدقيق - Logging & Audit Trail

### 20.1 جدول سجل التدقيق

```php
// Migration: create_subscription_audit_logs_table.php

Schema::create('subscription_audit_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
    $table->foreignId('user_id')->constrained();          // المستخدم المتأثر
    $table->foreignId('performed_by')->nullable()->constrained('users'); // من نفذ (أدمن أو null = نظام)

    $table->string('action');        // created, activated, renewed, cancelled, expired, upgraded, downgraded, suspended, refunded, gift
    $table->string('entity_type');   // subscription, plan, promo_code, invoice
    $table->unsignedBigInteger('entity_id')->nullable();

    $table->json('old_values')->nullable();   // القيم القديمة
    $table->json('new_values')->nullable();   // القيم الجديدة

    $table->text('description')->nullable();  // وصف بشري "الأدمن أحمد فعّل اشتراك وداد بلس للمستخدم سارة"
    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();

    $table->timestamps();

    $table->index(['subscription_id', 'action']);
    $table->index(['user_id', 'created_at']);
    $table->index('action');
});
```

### 20.2 Trait للتدقيق

```php
// app/Traits/LogsSubscriptionActivity.php

trait LogsSubscriptionActivity
{
    protected function logSubscriptionAction(
        string $action,
        ?Subscription $subscription,
        User $user,
        array $oldValues = [],
        array $newValues = [],
        ?string $description = null,
        ?User $performedBy = null
    ): void {
        SubscriptionAuditLog::create([
            'subscription_id' => $subscription?->id,
            'user_id' => $user->id,
            'performed_by' => $performedBy?->id ?? auth()->id(),
            'action' => $action,
            'entity_type' => 'subscription',
            'entity_id' => $subscription?->id,
            'old_values' => !empty($oldValues) ? $oldValues : null,
            'new_values' => !empty($newValues) ? $newValues : null,
            'description' => $description,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}

// استخدام في SubscriptionService:
class SubscriptionService
{
    use LogsSubscriptionActivity;

    public function activateSubscription(Subscription $subscription, array $paymobResponse): Subscription
    {
        $oldStatus = $subscription->status;

        // ... عمليات التفعيل

        $this->logSubscriptionAction(
            action: 'activated',
            subscription: $subscription,
            user: $subscription->user,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => 'active'],
            description: "تم تفعيل اشتراك {$subscription->plan->name} للمستخدم {$subscription->user->name}"
        );

        return $subscription;
    }
}
```

### 20.3 أمر Artisan لعرض السجل

```php
// app/Console/Commands/SubscriptionAuditReport.php

class SubscriptionAuditReport extends Command
{
    protected $signature = 'subscriptions:audit
        {--days=7 : عدد الأيام}
        {--action= : نوع العملية}
        {--user= : معرف المستخدم}';

    protected $description = 'عرض سجل تدقيق الاشتراكات';

    public function handle(): void
    {
        $query = SubscriptionAuditLog::with(['user', 'performedBy'])
            ->when($this->option('days'), fn($q, $days) => $q->where('created_at', '>=', now()->subDays($days)))
            ->when($this->option('action'), fn($q, $action) => $q->where('action', $action))
            ->when($this->option('user'), fn($q, $userId) => $q->where('user_id', $userId))
            ->latest()
            ->limit(50);

        $logs = $query->get();

        $this->table(
            ['التاريخ', 'العملية', 'المستخدم', 'نفذ بواسطة', 'الوصف'],
            $logs->map(fn($log) => [
                $log->created_at->format('Y-m-d H:i'),
                $log->action,
                $log->user->name,
                $log->performedBy?->name ?? 'النظام',
                Str::limit($log->description, 50),
            ])
        );

        $this->info("إجمالي: {$logs->count()} سجل");
    }
}
```

### 20.4 عرض في لوحة الأدمن

```tsx
// إضافة تبويب "سجل النشاطات" في SubscriptionDetailModal

<TabContent value="audit-log">
  <div className="space-y-4">
    {auditLogs.map((log) => (
      <div
        key={log.id}
        className="flex items-start gap-3 border-r-2 border-teal-200 pr-4"
      >
        <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 -mr-[1.3rem]" />
        <div>
          <p className="text-sm font-medium text-gray-800">{log.description}</p>
          <div className="flex gap-3 text-xs text-gray-400 mt-1">
            <span>{formatDate(log.created_at)}</span>
            <span>بواسطة: {log.performed_by_name ?? "النظام"}</span>
            {log.ip_address && <span>IP: {log.ip_address}</span>}
          </div>
        </div>
      </div>
    ))}
  </div>
</TabContent>
```

---

## 21. الضرائب - Tax Handling

### 21.1 إعدادات الضرائب

```php
// إضافة في config/subscription.php

'tax' => [
    'enabled' => env('SUBSCRIPTION_TAX_ENABLED', false),
    'rate' => env('SUBSCRIPTION_TAX_RATE', 0),         // 14% مثلاً
    'name' => env('SUBSCRIPTION_TAX_NAME', 'ضريبة القيمة المضافة'),
    'number' => env('SUBSCRIPTION_TAX_NUMBER', ''),     // رقم التسجيل الضريبي
    'inclusive' => env('SUBSCRIPTION_TAX_INCLUSIVE', true), // السعر شامل الضريبة أم لا
],

// .env
SUBSCRIPTION_TAX_ENABLED=false
SUBSCRIPTION_TAX_RATE=0
SUBSCRIPTION_TAX_NAME="ضريبة القيمة المضافة"
SUBSCRIPTION_TAX_NUMBER=""
SUBSCRIPTION_TAX_INCLUSIVE=true
```

### 21.2 حساب الضريبة

```php
// في InvoiceService.php

public function calculateTax(float $amount): array
{
    $taxConfig = config('subscription.tax');

    if (!$taxConfig['enabled'] || $taxConfig['rate'] <= 0) {
        return [
            'subtotal' => $amount,
            'tax' => 0,
            'total' => $amount,
        ];
    }

    $rate = $taxConfig['rate'] / 100;

    if ($taxConfig['inclusive']) {
        // السعر شامل الضريبة
        $subtotal = round($amount / (1 + $rate), 2);
        $tax = round($amount - $subtotal, 2);
        $total = $amount;
    } else {
        // السعر غير شامل الضريبة
        $subtotal = $amount;
        $tax = round($amount * $rate, 2);
        $total = $subtotal + $tax;
    }

    return [
        'subtotal' => $subtotal,
        'tax' => $tax,
        'total' => $total,
        'tax_name' => $taxConfig['name'],
        'tax_rate' => $taxConfig['rate'],
    ];
}
```

---

## 22. خطة Rollback والتراجع - Rollback Plan

### 22.1 جميع الـ Migrations تدعم `down()`

```php
// مثال: create_plans_table migration

public function down(): void
{
    Schema::dropIfExists('plan_features'); // يجب حذف الجداول التابعة أولاً
    Schema::dropIfExists('plans');
}

// مثال: create_subscriptions_table migration
public function down(): void
{
    Schema::dropIfExists('subscription_transactions');
    Schema::dropIfExists('subscriptions');
}

// مثال: modify_payments_table migration
public function down(): void
{
    Schema::table('payments', function (Blueprint $table) {
        $table->dropForeign(['subscription_id']);
        $table->dropColumn(['subscription_id', 'payment_type']);
        // إعادة consultation_id إلى required
        $table->foreignId('consultation_id')->nullable(false)->change();
    });
}
```

### 22.2 ترتيب التراجع الصحيح

```bash
# في حالة الحاجة للتراجع الكامل:

# 1. إيقاف الـ Cron Jobs
php artisan schedule:clear

# 2. حذف Routes الجديدة (من admin.php و patient.php)

# 3. التراجع عن الـ Migrations (من الأحدث للأقدم)
php artisan migrate:rollback --step=8

# 4. التأكد من أن الـ Migrations القديمة سليمة
php artisan migrate:status

# 5. إزالة الملفات الجديدة (Models, Controllers, Services, etc.)
# يمكن استخدام git revert

# 6. مسح الـ Cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### 22.3 Feature Flag (تشغيل/إيقاف النظام كاملاً)

```php
// config/subscription.php
'enabled' => env('SUBSCRIPTION_SYSTEM_ENABLED', true),

// Middleware للتحقق
class CheckSubscriptionSystemEnabled
{
    public function handle($request, Closure $next)
    {
        if (!config('subscription.enabled')) {
            return response()->json([
                'error' => 'system_disabled',
                'message' => 'نظام الاشتراكات غير مفعل حالياً',
            ], 503);
        }
        return $next($request);
    }
}

// .env — لإيقاف النظام مؤقتاً بدون حذف الكود
SUBSCRIPTION_SYSTEM_ENABLED=true
```

---

## 23. خطة الاختبارات - Testing Plan

### 23.1 Unit Tests

```
tests/Unit/
├── Services/
│   ├── SubscriptionServiceTest.php
│   │   ├── test_can_subscribe_to_free_plan()
│   │   ├── test_can_subscribe_to_paid_plan()
│   │   ├── test_cannot_subscribe_twice()
│   │   ├── test_can_upgrade_plan()
│   │   ├── test_can_downgrade_plan()
│   │   ├── test_proration_calculation_is_correct()
│   │   ├── test_can_cancel_subscription()
│   │   ├── test_can_resume_cancelled_subscription()
│   │   ├── test_expired_subscription_downgraded_to_free()
│   │   ├── test_free_consultation_usage_tracking()
│   │   ├── test_monthly_usage_reset()
│   │   └── test_grace_period_access()
│   │
│   ├── PromoCodeServiceTest.php
│   │   ├── test_valid_promo_code_applies_percentage_discount()
│   │   ├── test_valid_promo_code_applies_fixed_discount()
│   │   ├── test_expired_promo_code_rejected()
│   │   ├── test_max_uses_limit_enforced()
│   │   ├── test_per_user_limit_enforced()
│   │   ├── test_plan_restriction_enforced()
│   │   ├── test_billing_cycle_restriction_enforced()
│   │   ├── test_max_discount_cap_applied()
│   │   └── test_min_amount_check()
│   │
│   ├── InvoiceServiceTest.php
│   │   ├── test_invoice_number_generation()
│   │   ├── test_pdf_generation()
│   │   ├── test_tax_calculation_inclusive()
│   │   ├── test_tax_calculation_exclusive()
│   │   └── test_refund_invoice_creation()
│   │
│   └── PlanServiceTest.php
│       ├── test_plans_are_cached()
│       ├── test_cache_cleared_on_plan_update()
│       └── test_yearly_savings_calculation()
│
├── Models/
│   ├── SubscriptionTest.php
│   │   ├── test_is_active()
│   │   ├── test_is_on_trial()
│   │   ├── test_is_expired()
│   │   ├── test_days_remaining()
│   │   ├── test_has_available_free_consultation()
│   │   └── test_is_in_grace_period()
│   │
│   ├── PlanTest.php
│   │   ├── test_has_feature()
│   │   ├── test_get_price_for_cycle()
│   │   └── test_free_plan_detection()
│   │
│   └── PromoCodeTest.php
│       ├── test_is_valid()
│       ├── test_is_applicable_to_plan()
│       └── test_calculate_discount()
```

### 23.2 Feature Tests (API Integration)

```
tests/Feature/
├── Subscription/
│   ├── PlansApiTest.php
│   │   ├── test_guest_can_view_plans()
│   │   ├── test_patient_can_view_plans_with_current_plan()
│   │   └── test_inactive_plans_hidden_from_public()
│   │
│   ├── SubscribeApiTest.php
│   │   ├── test_patient_can_subscribe_to_free_plan()
│   │   ├── test_patient_gets_payment_url_for_paid_plan()
│   │   ├── test_unauthenticated_user_cannot_subscribe()
│   │   ├── test_cannot_subscribe_to_inactive_plan()
│   │   ├── test_cannot_subscribe_when_already_subscribed()
│   │   ├── test_promo_code_applied_to_subscription()
│   │   └── test_invalid_promo_code_rejected()
│   │
│   ├── SubscriptionManagementApiTest.php
│   │   ├── test_patient_can_view_current_subscription()
│   │   ├── test_patient_can_cancel_subscription()
│   │   ├── test_patient_can_toggle_auto_renew()
│   │   ├── test_patient_can_view_invoices()
│   │   └── test_patient_can_download_invoice_pdf()
│   │
│   ├── PaymobCallbackTest.php
│   │   ├── test_valid_callback_activates_subscription()
│   │   ├── test_invalid_hmac_rejected()
│   │   ├── test_duplicate_callback_handled_idempotently()
│   │   └── test_failed_payment_callback_handled()
│   │
│   └── ConsultationIntegrationTest.php
│       ├── test_free_consultation_deducted_from_subscription()
│       ├── test_discount_applied_to_consultation()
│       └── test_no_discount_for_free_plan()
│
├── Admin/
│   ├── AdminPlansApiTest.php
│   │   ├── test_admin_can_create_plan()
│   │   ├── test_admin_can_update_plan()
│   │   ├── test_admin_cannot_delete_plan_with_subscribers()
│   │   ├── test_admin_can_toggle_plan_status()
│   │   ├── test_admin_can_reorder_plans()
│   │   └── test_non_admin_cannot_access()
│   │
│   ├── AdminSubscriptionsApiTest.php
│   │   ├── test_admin_can_list_subscriptions()
│   │   ├── test_admin_can_gift_subscription()
│   │   ├── test_admin_can_extend_subscription()
│   │   ├── test_admin_can_suspend_subscription()
│   │   └── test_admin_can_process_refund()
│   │
│   └── AdminPromoCodesApiTest.php
│       ├── test_admin_can_create_promo_code()
│       ├── test_admin_can_bulk_generate_codes()
│       ├── test_admin_can_view_promo_code_usage()
│       └── test_admin_can_toggle_promo_code_status()
```

### 23.3 Paymob Mock/Sandbox

```php
// tests/Mocks/FakePaymobService.php

class FakePaymobService extends PaymobService
{
    public bool $shouldFail = false;
    public array $lastPaymentData = [];

    public function authenticate(): string
    {
        return 'fake-auth-token';
    }

    public function registerOrder(string $token, string $merchantOrderId, int $amountCents, string $currency): int
    {
        return rand(100000, 999999);
    }

    public function getPaymentKey(string $token, int $orderId, int $amountCents, string $integrationId, array $billingData, string $currency): string
    {
        return 'fake-payment-key-' . $orderId;
    }

    public function initiateSubscriptionPayment(Subscription $subscription, Invoice $invoice, string $paymentMethod = 'card'): array
    {
        if ($this->shouldFail) {
            throw new \Exception('Paymob connection failed');
        }

        $this->lastPaymentData = [
            'subscription_id' => $subscription->id,
            'amount' => $invoice->total,
        ];

        return [
            'type' => 'card',
            'payment_url' => "https://fake-paymob.test/pay?token=fake-key",
            'order_id' => rand(100000, 999999),
        ];
    }

    public function verifyHmac(array $data, ?string $hmac): bool
    {
        return true; // Always valid in tests
    }
}

// في TestCase.php
protected function useFakePaymob(): FakePaymobService
{
    $fake = new FakePaymobService();
    $this->app->instance(PaymobService::class, $fake);
    return $fake;
}

// استخدام في الاختبار:
public function test_patient_can_subscribe()
{
    $fake = $this->useFakePaymob();

    $response = $this->actingAs($patient)
        ->postJson('/api/patient/subscribe', [
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'payment_method' => 'paymob_card',
        ]);

    $response->assertOk()
        ->assertJsonPath('data.payment.type', 'card')
        ->assertJsonPath('data.subscription.status', 'pending_payment');

    $this->assertNotEmpty($fake->lastPaymentData);
}
```

---

## 24. تحسينات Production إضافية - Production Hardening Enhancements

> هذا القسم يضيف تحسينات تشغيلية ومحاسبية وأمنية فوق الخطة الحالية دون تغيير الهيكل الأساسي.

### 24.1 المطابقة المالية اليومية - Daily Reconciliation

**الهدف:** ضمان عدم وجود فروقات بين سجلات `Paymob` وسجلاتنا (`payments`, `invoices`, `subscription_transactions`).

**المطلوب تنفيذياً:**

- Command جديد: `subscriptions:reconcile {--date=}`
- Job يومي مجدول بعد منتصف الليل: `RunDailyReconciliation`
- جدول جديد: `payment_reconciliations`

```php
Schema::create('payment_reconciliations', function (Blueprint $table) {
  $table->id();
  $table->date('reconcile_date');
  $table->string('gateway')->default('paymob');
  $table->integer('gateway_count')->default(0);
  $table->integer('local_count')->default(0);
  $table->decimal('gateway_amount', 12, 2)->default(0);
  $table->decimal('local_amount', 12, 2)->default(0);
  $table->decimal('difference_amount', 12, 2)->default(0);
  $table->json('differences')->nullable();
  $table->enum('status', ['matched', 'mismatch', 'error'])->default('matched');
  $table->timestamp('reconciled_at')->nullable();
  $table->timestamps();

  $table->unique(['reconcile_date', 'gateway']);
});
```

### 24.2 إدارة النزاعات والاسترجاع العكسي - Disputes & Chargebacks

**الهدف:** توثيق حالات النزاع/الاسترجاع العكسي ومنع تكرار منح المزايا عند النزاعات المفتوحة.

**المطلوب تنفيذياً:**

- جدول جديد: `payment_disputes`
- حالة اشتراك إضافية عند الحاجة: `under_review` (اختياري)
- إشعار فوري للأدمن عند فتح نزاع

```php
Schema::create('payment_disputes', function (Blueprint $table) {
  $table->id();
  $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
  $table->foreignId('user_id')->constrained()->cascadeOnDelete();
  $table->string('gateway_case_id')->nullable();
  $table->enum('type', ['chargeback', 'dispute', 'inquiry'])->default('dispute');
  $table->enum('status', ['open', 'won', 'lost', 'cancelled'])->default('open');
  $table->decimal('amount', 10, 2);
  $table->string('currency', 3)->default('EGP');
  $table->text('reason')->nullable();
  $table->timestamp('opened_at')->nullable();
  $table->timestamp('closed_at')->nullable();
  $table->json('metadata')->nullable();
  $table->timestamps();
});
```

### 24.3 حماية البيانات الحساسة - Sensitive Data Protection

**الهدف:** تقليل مخاطر تسرب البيانات مع الالتزام بأقل قدر من الاحتفاظ.

---

## 25. ميزة تجميد الاشتراك - Pause Subscription (New Feature)

### 25.1 الهدف والفائدة

- **عنصر التحسين:** بدلاً من إلغاء الاشتراك نهائياً، السماح للمستخدم بتجميد اشتراكه مؤقتاً (لمدة محددة، مثلاً شهر).
- **الفائدة:** الحفاظ على العميل وتقليل معدل الإلغاء (Churn Rate). المستخدم الذي يسافر أو ينشغل يمكنه العودة لاحقاً دون الحاجة للاشتراك من جديد.

### 25.2 تعديلات قاعدة البيانات

```php
// Migration: add_pause_columns_to_subscriptions.php

Schema::table('subscriptions', function (Blueprint $table) {
    // حالة جديدة: 'paused'
    // تم تعديل عمود status ليشمل 'paused' في الـ enum (عبر تعديل migration الأصلي أو change())

    $table->timestamp('paused_at')->nullable();      // متى بدأ التجميد
    $table->timestamp('resume_at')->nullable();      // متى سينتهي التجميد تلقائياً
    $table->integer('pause_count')->default(0);      // عدد مرات التجميد (لفرض قيود: مرة كل 6 شهور مثلاً)
});
```

### 25.3 Backend Logic

#### `SubscriptionService.php`

```php
/**
 * تجميد الاشتراك
 */
public function pauseSubscription(Subscription $subscription, int $durationDays = 30): Subscription
{
    // 1. التحقق من الأهلية (مثلاً: نشط حالياً، لم يتم تجميده مؤخراً)
    if ($subscription->status !== 'active') {
        throw new \Exception("لا يمكن تجميد اشتراك غير نشط.");
    }

    // سياسة التجميد: مرة واحدة كل 180 يوم
    $lastPause = $subscription->auditLogs()
        ->where('action', 'paused')
        ->latest()
        ->first();

    if ($lastPause && $lastPause->created_at->diffInDays(now()) < 180) {
        throw new \Exception("يمكنك تجميد الاشتراك مرة واحدة كل 6 أشهر.");
    }

    // 2. حساب تواريخ التجميد
    $pauseStart = now();
    $resumeDate = now()->addDays($durationDays);

    // تمديد تاريخ الانتهاء الأصلي بنفس مدة التجميد عند الاستئناف
    // هنا نسجل فقط نية التجميد، أو نوقف الصلاحيات فوراً

    $subscription->update([
        'status' => 'paused',
        'paused_at' => $pauseStart,
        'resume_at' => $resumeDate,
        'pause_count' => $subscription->pause_count + 1
    ]);

    // إيقاف التجديد التلقائي مؤقتاً
    // (يجب أن يتعامل الـ cron job مع الحالة paused فلا يحاول التجديد)

    return $subscription;
}

/**
 * استئناف الاشتراك (يدوياً أو تلقائياً)
 */
public function resumeSubscription(Subscription $subscription): Subscription
{
    if ($subscription->status !== 'paused') {
        return $subscription;
    }

    // حساب المدة التي قضاها في التجميد الفعلي
    $pauseDuration = $subscription->paused_at->diffInDays(now());

    // تمديد فترة الاشتراك (ends_at) لتعويض فترة التوقف
    $newEndsAt = $subscription->ends_at->addDays($pauseDuration);

    $subscription->update([
        'status' => 'active',
        'ends_at' => $newEndsAt,
        'paused_at' => null,
        'resume_at' => null,
    ]);

    return $subscription;
}
```

#### Scheduled Job

```php
// app/Console/Commands/ResumePausedSubscriptions.php

public function handle(): void
{
    // البحث عن الاشتراكات التي حان وقت استئنافها
    $subscriptions = Subscription::where('status', 'paused')
        ->where('resume_at', '<=', now())
        ->get();

    foreach ($subscriptions as $sub) {
        app(SubscriptionService::class)->resumeSubscription($sub);

        // إشعار المستخدم
        $sub->user->notify(new SubscriptionResumed($sub));
    }
}
```

### 25.4 Frontend Implementation

#### `PauseSubscriptionModal.tsx`

```tsx
// مودال يظهر عند الضغط على "إلغاء الاشتراك" كخيار بديل

export const CancelOrPauseModal = ({ isOpen, onClose }) => {
  const { pauseSubscription, cancelSubscription } = useSubscription();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>هل أنتِ متأكدة من رغبتك في المغادرة؟</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
            <h4 className="font-bold text-teal-800 mb-2">💡 هل تعلمين؟</h4>
            <p className="text-sm text-teal-700 mb-3">
              بدلاً من إلغاء اشتراكك وفقدان مميزاتك وسجلك الصحي، يمكنك
              <strong>تجميد الاشتراك مؤقتاً</strong> لمدة شهر.
            </p>
            <Button
              onClick={() => pauseSubscription(30)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              ❄️ تجميد الاشتراك لمدة 30 يوماً
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={cancelSubscription}
              className="text-sm text-gray-500 hover:text-red-600 underline"
            >
              لا، أريد إلغاء الاشتراك نهائياً
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

**المطلوب تنفيذياً:**

- عدم تخزين PAN/CVV نهائياً (حالياً عبر Paymob hosted flow)
- تشفير الحقول الحساسة في `paymob_response` قبل التخزين
- سياسة احتفاظ: أرشفة/إخفاء `paymob_response` بعد 90 يوم مع إبقاء الحقول المرجعية فقط (`transaction_id`, `order_id`, `status`)
- Command شهري: `subscriptions:prune-sensitive-data`

### 24.4 منع الـ Replay في Webhooks

**الهدف:** منع إعادة إرسال نفس الحدث بطرق تتجاوز الفحص الحالي.

**المطلوب تنفيذياً:**

- جدول `webhook_events` لحفظ بصمة الحدث
- رفض أي حدث مكرر بنفس `event_id` أو `hash` خلال نافذة زمنية محددة

```php
Schema::create('webhook_events', function (Blueprint $table) {
  $table->id();
  $table->string('provider'); // paymob
  $table->string('event_id')->nullable();
  $table->string('event_hash')->unique();
  $table->timestamp('received_at');
  $table->timestamps();

  $table->index(['provider', 'event_id']);
});
```

### 24.5 قيود قاعدة البيانات لمنع الاشتراكات المتداخلة

**الهدف:** ضمان عدم وجود أكثر من اشتراك نشط/تجريبي لنفس المستخدم.

**المطلوب تنفيذياً:**

- فحص داخل `DB::transaction()` مع `lockForUpdate()` قبل إنشاء الاشتراك
- إضافة قيد فريد منطقي (عبر عمود مساعد) للحالات `active` و`trial`

```php
// مثال عمود مساعد في subscriptions
$table->boolean('is_current')->default(false); // true فقط للاشتراك الحالي

// unique index
$table->unique(['user_id', 'is_current']);
```

> ملاحظة: عند التغيير إلى `cancelled/expired` يجب إعادة `is_current = false` داخل نفس المعاملة.

### 24.6 المراقبة والتنبيهات - Observability & Alerts

**الهدف:** اكتشاف المشاكل مبكراً قبل تأثيرها على المستخدمين.

**المؤشرات الأساسية:**

- `subscription_payment_success_rate` (هدف ≥ 97%)
- `webhook_invalid_signature_count`
- `retry_exhausted_count`
- `reconciliation_mismatch_count`
- `time_to_activate_subscription_seconds` (p95)

**التنبيهات المقترحة:**

- فشل المدفوعات > 5% خلال 30 دقيقة
- أي mismatch في المطابقة اليومية
- زيادة webhooks غير صحيحة التوقيع عن threshold محدد

### 24.7 Feature Flag + Kill Switch

**الهدف:** إيقاف جزئي أو كامل لنظام الاشتراكات وقت الحوادث دون نشر كود جديد.

**المطلوب تنفيذياً:**

- متغيرات بيئة:

```env
SUBSCRIPTION_SYSTEM_ENABLED=true
SUBSCRIPTION_CHECKOUT_ENABLED=true
SUBSCRIPTION_RENEWAL_ENABLED=true
SUBSCRIPTION_WEBHOOK_PROCESSING_ENABLED=true
```

- Middleware/Guard يقرأ القيم ويعيد رسالة واضحة للمستخدم عند الإيقاف.

### 24.8 ترتيب التنفيذ المقترح (خفيف)

1. `Reconciliation` + تنبيه mismatch
2. `Webhook anti-replay` + جدول `webhook_events`
3. `Sensitive data pruning` + command شهري
4. `Disputes/Chargebacks` workflow
5. `Observability dashboard` + alerts

---

## 📊 ملخص الملفات المطلوبة (مُحدّث)

### Backend (Laravel) - ~45 ملف جديد

| النوع         | العدد | الملفات                                                                                                                                                                  |
| ------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Migrations    | 8     | plans, plan_features, subscriptions, promo_codes, promo_code_uses, invoices, subscription_transactions, subscription_audit_logs + modify payments + modify consultations |
| Models        | 7     | Plan, PlanFeature, Subscription, PromoCode, PromoCodeUse, Invoice, SubscriptionTransaction, SubscriptionAuditLog                                                         |
| Services      | 4     | SubscriptionService, InvoiceService, PromoCodeService, PlanService                                                                                                       |
| Controllers   | 5     | SubscriptionController, AdminPlanController, AdminSubscriptionController, AdminPromoCodeController, AdminInvoiceController                                               |
| Form Requests | 5     | SubscribeRequest, ChangePlanRequest, StorePlanRequest, StorePromoCodeRequest, ValidatePromoCodeRequest                                                                   |
| Middleware    | 3     | CheckSubscription, TrackFeatureUsage, CheckSubscriptionSystemEnabled                                                                                                     |
| Notifications | 12    | (see section 4.7)                                                                                                                                                        |
| Commands      | 6     | (see section 4.6) + SubscriptionAuditReport                                                                                                                              |
| Jobs          | 5     | (see section 4.5)                                                                                                                                                        |
| Seeders       | 2     | PlansSeeder, AssignFreeSubscriptionSeeder                                                                                                                                |
| Config        | 1     | config/subscription.php                                                                                                                                                  |
| Observer      | 2     | UserObserver, SubscriptionObserver                                                                                                                                       |
| Trait         | 1     | LogsSubscriptionActivity                                                                                                                                                 |
| Views (Blade) | 5     | Invoice templates (3) + partials (2)                                                                                                                                     |
| Modified      | 4     | User model, PaymobService, PaymentController, ConsultationController                                                                                                     |
| Tests         | 15+   | Unit + Feature tests                                                                                                                                                     |

### Frontend (React) - ~30 ملف جديد

| النوع      | العدد | الملفات                                                                                                                                                                |
| ---------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages      | 8     | PricingPage, SubscriptionCheckout, MySubscription, InvoicesPage, AdminPlansPage, AdminSubscriptionsPage, AdminPromoCodesPage, AdminInvoicesPage                        |
| Components | 25+   | PricingCard, PricingToggle, ComparisonTable, PromoCodeInput, SubscriptionCard, UsageTracker, FeatureGate, UpgradePrompt, GracePeriodBanner, loading/error states, etc. |
| Services   | 2     | subscriptionService, adminSubscriptionService                                                                                                                          |
| Context    | 1     | SubscriptionContext                                                                                                                                                    |
| Hooks      | 5     | useSubscription, usePlans, usePromoCode, useInvoices, useSubscriptionGuard                                                                                             |

---

> **الخلاصة:** النظام يبنى فوق البنية الموجودة (PaymobService + Payment model) مع إضافة طبقة اشتراكات كاملة. التحكم الكامل من الأدمن يشمل CRUD للخطط، إدارة المشتركين، أكواد الخصم، الفواتير، والإحصائيات. الإضافات الجديدة تغطي: الأمان (Idempotency, Rate Limiting, DB Locking)، ترحيل المستخدمين الحاليين، فترة السماح، تكامل الاستشارات، قالب الفواتير PDF، التخزين المؤقت، Feature Gating، التدقيق والتتبع، الضرائب، خطة التراجع، والاختبارات الشاملة. المدة المتوقعة: **13-16 يوم عمل**.
