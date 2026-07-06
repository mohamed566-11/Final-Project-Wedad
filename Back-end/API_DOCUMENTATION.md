<p align="center">
  <img src="https://img.shields.io/badge/Widad-API%20Documentation-E91E8C?style=for-the-badge&logo=heart&logoColor=white" alt="Widad API" />
</p>

<h1 align="center">📡 Widad Health Platform — API Documentation</h1>

<p align="center">
  <strong>Complete REST API Reference</strong><br/>
  <em>Base URL: <code>http://localhost:8000/api/v1</code></em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Auth-Sanctum%20Bearer%20Token-green?style=flat-square" />
  <img src="https://img.shields.io/badge/Format-JSON-orange?style=flat-square" />
</p>

---

## 📋 Table of Contents

- [General Information](#-general-information)
- [Authentication Flow](#-authentication-flow)
- [Public Endpoints](#-public-endpoints-no-auth)
- [Patient Endpoints](#-patient-endpoints)
  - [Patient Auth](#-patient-authentication)
  - [Patient Profile](#-patient-profile)
  - [Patient Dashboard](#-patient-dashboard)
  - [Health Trackers](#-health-trackers)
  - [Doctor Search & Discovery](#-doctor-search--discovery)
  - [Consultations](#-patient-consultations)
  - [Payments](#-patient-payments)
  - [Notifications](#-patient-notifications)
- [Doctor Endpoints](#-doctor-endpoints)
  - [Doctor Auth](#-doctor-authentication)
  - [Doctor Dashboard](#-doctor-dashboard)
  - [Doctor Profile](#-doctor-profile-management)
  - [Working Hours](#-working-hours)
  - [Doctor Consultations](#-doctor-consultations)
  - [Doctor Patients](#-doctor-patients)
  - [Doctor Articles](#-doctor-articles)
  - [Doctor Financials](#-doctor-financials)
  - [Google Integration](#-google-integration)
- [Admin Endpoints](#-admin-endpoints)
  - [Admin Auth](#-admin-authentication)
  - [Admin Dashboard](#-admin-dashboard)
  - [Patients Management](#-patients-management)
  - [Doctors Management](#-doctors-management)
  - [Admins Management](#-admins-management)
  - [Join Requests](#-join-requests)
  - [Consultations Management](#-consultations-management)
  - [Financials Management](#-financials-management)
  - [Articles Management](#-articles-management)
  - [Contact Messages](#-contact-messages)
  - [Notifications (Admin)](#-notifications-admin)
  - [Analytics](#-analytics)
  - [Settings](#-settings)
  - [FAQs Management](#-faqs-management)
  - [About Us Management](#-about-us-management)
  - [Success Stories](#-success-stories-management)
- [Error Codes](#-error-codes)

---

## 📌 General Information

### Base URL

```
http://localhost:8000/api/v1
```

### Authentication

All protected endpoints require a **Bearer Token** via Laravel Sanctum:

```
Authorization: Bearer <your-token>
```

### Response Format

All API responses follow a consistent wrapper format:

```json
{
  "status": true,
  "message": "Success message",
  "data": { ... }
}
```

**Error Response:**

```json
{
  "status": false,
  "message": "Error description",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

### Rate Limiting

| Action       | Limit               |
| ------------ | ------------------- |
| Registration | Throttled (default) |
| Contact Form | 3 requests/hour     |
| Join Request | 2 requests/day      |

### Pagination

Paginated endpoints return:

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "per_page": 10,
    "current_page": 1,
    "last_page": 10
  }
}
```

---

## 🔐 Authentication Flow

```
┌──────────┐     POST /auth/register      ┌──────────┐
│  Client  │ ──────────────────────────▶  │  Server  │
│          │ ◀────────────────────────── │          │
│          │     { user, token }          │          │
│          │                              │          │
│          │     POST /auth/email/verify   │          │
│          │ ──────────────────────────▶  │          │
│          │     { otp_code }             │          │
│          │ ◀────────────────────────── │          │
│          │     { verified: true }       │          │
│          │                              │          │
│          │     POST /auth/login          │          │
│          │ ──────────────────────────▶  │          │
│          │     { email, password }       │          │
│          │ ◀────────────────────────── │          │
│          │     { user, token }          │          │
└──────────┘                              └──────────┘
```

---

## 🌐 Public Endpoints (No Auth)

> **Prefix:** `/api/v1`

<details>
<summary><strong>🏠 Landing Page</strong></summary>

### Get Landing Page Data

```http
GET /landing-page
```

> Cached for 15 minutes

**Response:**

```json
{
  "data": {
    "hero": { "title": "...", "subtitle": "...", "cta": "..." },
    "stats": { "users": 1200, "doctors": 50, "consultations": 5000 },
    "features": [...],
    "life_stages": [...],
    "how_it_works": [...],
    "why_choose_us": [...],
    "featured_doctors": [...],
    "testimonials": [...],
    "recent_articles": [...],
    "cta_banner": { "title": "...", "description": "..." }
  }
}
```

---

### Get Platform Stats

```http
GET /landing-page/stats
```

> Cached for 5 minutes

**Response:**

```json
{
  "data": {
    "users": { "total": 1200, "today": 15, "this_week": 80 },
    "doctors": { "total": 50, "verified": 45, "available_now": 12 },
    "consultations": {
      "total": 5000,
      "this_month": 200,
      "completed_today": 10
    },
    "articles": { "total": 150, "total_views": 25000 },
    "specializations": { "total": 8 }
  }
}
```

---

### Get FAQs

```http
GET /landing-page/faqs
```

**Response:**

```json
{
  "data": [{ "id": 1, "question": "...", "answer": "..." }]
}
```

---

### Get Life Stage Details

```http
GET /landing-page/life-stages/{slug}
```

| Parameter | Type   | Description         |
| --------- | ------ | ------------------- |
| `slug`    | string | Life stage URL slug |

---

### Get All Doctors (Landing)

```http
GET /landing-page/doctors
```

---

### Get Doctor Profile (Landing)

```http
GET /landing-page/doctors/{id}
```

---

### Get Success Stories

```http
GET /landing-page/success-stories
```

</details>

<details>
<summary><strong>📄 Static Pages</strong></summary>

### About Us

```http
GET /about-us
```

**Response:**

```json
{
  "data": {
    "about": {
      "id": 1,
      "title": "...",
      "description": "...",
      "image_url": "...",
      "mission": "...",
      "vision": "..."
    },
    "stats": { ... }
  }
}
```

---

### FAQs

```http
GET /faqs
```

| Query Param     | Type    | Description          |
| --------------- | ------- | -------------------- |
| `life_stage_id` | integer | Filter by life stage |
| `search`        | string  | Search in questions  |

**Response:**

```json
{
  "data": {
    "faqs": [...],
    "grouped_by_life_stage": { ... }
  }
}
```

---

### Contact Us

```http
POST /contact-us
```

> ⚠️ Rate limited: 3 requests/hour

| Body Param | Type   | Required | Rules                  |
| ---------- | ------ | -------- | ---------------------- |
| `name`     | string | ✅       | max:255                |
| `email`    | string | ✅       | valid email, max:255   |
| `phone`    | string | ❌       | Egyptian mobile format |
| `subject`  | string | ✅       | max:255                |
| `message`  | string | ✅       | max:5000               |

**Response (201):**

```json
{
  "data": {
    "message_id": 42,
    "estimated_response_time": "24-48 hours"
  }
}
```

---

### Get Contact Info

```http
GET /contact-info
```

**Response:**

```json
{
  "data": {
    "email": "info@widad.com",
    "phone": "+20...",
    "address": "...",
    "working_hours": "...",
    "social_media": { "facebook": "...", "instagram": "..." }
  }
}
```

---

### Join as Doctor

```http
POST /join-us
```

> ⚠️ Rate limited: 2 requests/day

| Body Param  | Type   | Required | Rules                  |
| ----------- | ------ | -------- | ---------------------- |
| `name`      | string | ✅       | max:255                |
| `email`     | string | ✅       | valid email, max:255   |
| `phone`     | string | ✅       | Egyptian mobile format |
| `specialty` | string | ✅       | max:100                |

**Response (201):**

```json
{
  "data": {
    "application_id": 15,
    "next_steps": ["You will receive a confirmation email", "..."]
  }
}
```

---

### Site Settings

```http
GET /settings
```

**Response:**

```json
{
  "data": {
    "site_name": "Widad Health",
    "email": "...",
    "phone": "...",
    "address": "...",
    "description": "...",
    "logo_url": "...",
    "favicon_url": "...",
    "social_media": { ... }
  }
}
```

---

### Terms & Conditions

```http
GET /terms
```

**Response:**

```json
{
  "data": {
    "terms": { "title": "...", "content": "...", "last_updated": "2026-01-01" }
  }
}
```

---

### Privacy Policy

```http
GET /privacy
```

**Response:**

```json
{
  "data": {
    "privacy": {
      "title": "...",
      "content": "...",
      "last_updated": "2026-01-01"
    }
  }
}
```

---

### Life Stages

```http
GET /life-stages
```

**Response:**

```json
{
  "data": {
    "life_stages": [
      {
        "id": 1,
        "name": "Adolescence",
        "name_ar": "المراهقة",
        "slug": "adolescence",
        "description": "...",
        "icon": "...",
        "stats": { "doctors": 10, "articles": 25 }
      }
    ]
  }
}
```

---

### Life Stage Detail

```http
GET /life-stages/{slug}
```

**Response:**

```json
{
  "data": {
    "life_stage": {
      "id": 1,
      "name": "...",
      "name_ar": "...",
      "slug": "...",
      "description": "...",
      "icon": "...",
      "features": [...],
      "tools": [...],
      "related_articles": [...],
      "available_doctors": [...],
      "faqs": [...]
    }
  }
}
```

</details>

<details>
<summary><strong>📰 Public Articles</strong></summary>

### List All Articles

```http
GET /patient/articles
```

| Query Param     | Type    | Default | Description                |
| --------------- | ------- | ------- | -------------------------- |
| `life_stage_id` | integer | —       | Filter by life stage       |
| `tag`           | string  | —       | Filter by tag              |
| `search`        | string  | —       | Search in title/content    |
| `per_page`      | integer | 10      | Items per page             |

**Response:** Paginated `ArticleResource` collection (without full `content` field — only `excerpt`).

---

### Get Article Tags

```http
GET /patient/articles/tags
```

**Response (200):** Array of all unique tags used across published articles.

---

### Articles by Tag

```http
GET /patient/articles/tag/{tag}
```

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `tag`     | string | Tag name    |

**Response:** Paginated `ArticleResource` collection filtered by the specified tag.

---

### Article Detail

```http
GET /patient/articles/{slug}
```

| Parameter | Type   | Description      |
| --------- | ------ | ---------------- |
| `slug`    | string | Article URL slug |

**Response (200):** Full `ArticleResource` with `content`, doctor details (bio, experience, rating), and related metadata.

| Status | Scenario          |
| ------ | ----------------- |
| 404    | Article not found |

---

### Doctor's Articles

```http
GET /patient/doctors/{doctorId}/articles
```

| Parameter  | Type    | Description |
| ---------- | ------- | ----------- |
| `doctorId` | integer | Doctor ID   |

**Response:** Paginated `ArticleResource` collection for the specified doctor (published articles only).

</details>

<details>
<summary><strong>🔍 Global Search</strong></summary>

### Search

```http
GET /search
```

| Query Param | Type   | Description  |
| ----------- | ------ | ------------ |
| `q`         | string | Search query |

**Response:**

```json
{
  "data": {
    "doctors": [...],
    "articles": [...],
    "life_stages": [...]
  }
}
```

</details>

---

## 👩 Patient Endpoints

> **Prefix:** `/api/v1/patient`

### 🔐 Patient Authentication

<details>
<summary><strong>POST /patient/auth/register — Register New Patient</strong></summary>

```http
POST /patient/auth/register
Content-Type: multipart/form-data
```

> ⚠️ Rate limited

| Body Param              | Type    | Required | Rules                               |
| ----------------------- | ------- | -------- | ----------------------------------- |
| `name`                  | string  | ✅       | max:255                             |
| `email`                 | string  | ✅       | valid email, unique:users           |
| `password`              | string  | ✅       | min:8, must be confirmed            |
| `password_confirmation` | string  | ✅       | must match password                 |
| `phone`                 | string  | ✅       | Egyptian mobile: `01[0125]XXXXXXXX` |
| `age`                   | integer | ❌       | min:12, max:100                     |
| `image`                 | file    | ❌       | jpeg,png,jpg,gif — max:2MB          |
| `life_stage_id`         | integer | ❌       | must exist in life_stages           |

**Response (201):**

```json
{
  "status": true,
  "message": "User Created Successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "سارة أحمد",
      "email": "sara@example.com",
      "phone": "01012345678",
      "age": 28,
      "image_url": "https://...",
      "life_stage": { "id": 1, "name": "..." },
      "email_verified": false
    },
    "token": "1|abc123xyz..."
  }
}
```

</details>

<details>
<summary><strong>POST /patient/auth/login — Patient Login</strong></summary>

```http
POST /patient/auth/login
Content-Type: application/json
```

| Body Param | Type   | Required | Rules          |
| ---------- | ------ | -------- | -------------- |
| `email`    | string | ✅       | valid email    |
| `password` | string | ✅       | min:8, max:255 |

**Response (200):**

```json
{
  "status": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "سارة أحمد",
      "email": "sara@example.com",
      "age": 28,
      "phone": "01012345678",
      "life_stage_id": 2,
      "life_stage": { "id": 2, "name": "Pregnancy", "slug": "pregnancy" },
      "profile": {
        "id": 1,
        "height": 165,
        "weight": 62.5,
        "bmi": 22.9,
        "bmi_category": "normal",
        "age_calculated": 28,
        "blood_type": "A+",
        "date_of_birth": "1998-03-15",
        "national_id": null,
        "medical_history": null,
        "chronic_diseases": [],
        "allergies": [],
        "current_medications": [],
        "emergency_contact_name": "أحمد محمد",
        "emergency_contact_phone": "01198765432",
        "last_update": "2026-02-14"
      },
      "is_active": true,
      "image": "https://localhost:8000/storage/uploads/patients/images/sara.jpg",
      "image_url": "https://localhost:8000/storage/uploads/patients/images/sara.jpg",
      "is_verified": true,
      "joined_at": "2026-01-10"
    },
    "token": "2|def456abc789xyz..."
  }
}
```

> 💡 **Token Info:** Sanctum plain-text token in `{id}|{hash}` format. Expires in 1 month. Store in `localStorage` or a secure cookie. Include as `Authorization: Bearer {token}` on all authenticated requests.

**Error (401):**

```json
{
  "status": false,
  "message": "Invalid credentials"
}
```

**Error (403) — Account Deactivated:**

```json
{
  "status": false,
  "message": "الحساب مغلق. يرجى التواصل مع الدعم الفني."
}
```

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 401    | Invalid email or password                    |
| 403    | Account deactivated by admin                 |
| 422    | Validation errors (missing email/password)   |
| 429    | Too many attempts (5 per minute per IP+email)|

**Frontend Usage Example:**

```javascript
try {
  const { data } = await axios.post('/api/v1/patient/auth/login', {
    email: 'sara@example.com',
    password: 'securePass123'
  });
  localStorage.setItem('token', data.data.token);
  localStorage.setItem('user', JSON.stringify(data.data.user));
  // Redirect based on is_verified status
  if (!data.data.user.is_verified) {
    router.push('/verify-email');
  } else {
    router.push('/dashboard');
  }
} catch (err) {
  if (err.response?.status === 429) {
    // Show rate limit message with countdown
  }
}
```

</details>

<details>
<summary><strong>POST /patient/auth/logout — Logout</strong></summary>

```http
POST /patient/auth/logout
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": true,
  "message": "Logged out successfully",
  "data": null
}
```

</details>

<details>
<summary><strong>POST /patient/auth/logout/all — Logout All Devices</strong></summary>

```http
POST /patient/auth/logout/all
Authorization: Bearer <token>
```

**Response:**

```json
{
  "status": true,
  "message": "Logged out from all devices successfully",
  "data": null
}
```

</details>

<details>
<summary><strong>POST /patient/auth/email/verify — Verify Email (OTP)</strong></summary>

```http
POST /patient/auth/email/verify
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required | Rules              |
| ---------- | ------ | -------- | ------------------ |
| `code`     | string | ✅       | exactly 5 characters |

> ⚠️ The field name in the request body is `code`, not `otp`.

**Response (200) — Success:**

```json
{
  "status": true,
  "message": "Email Verified successfully.",
  "data": null
}
```

**Response (200) — Already Verified:**

```json
{
  "status": true,
  "message": "Email is already verified.",
  "data": null
}
```

| Status | Scenario                        |
| ------ | ------------------------------- |
| 400    | Invalid or expired OTP code     |
| 401    | Missing or invalid Bearer token |

**Frontend Usage Example:**

```javascript
const response = await axios.post('/api/v1/patient/auth/email/verify', {
  code: '12345'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
// After success, update user.is_verified in local state
```

> 💡 **Frontend Note:** After successful verification, update `user.is_verified` to `true` in your auth store to remove "verify your email" banners without re-fetching.

</details>

<details>
<summary><strong>GET /patient/auth/email/send-again — Resend OTP</strong></summary>

```http
GET /patient/auth/email/send-again
Authorization: Bearer <token>
```

> ⚠️ Rate limited: 1 request per 60 seconds per user

**Response (200):**

```json
{
  "status": true,
  "message": "OTP sent successfully.",
  "data": null
}
```

| Status | Scenario                                |
| ------ | --------------------------------------- |
| 400    | Email is already verified               |
| 429    | Rate limited — wait N seconds           |
| 401    | Missing or invalid Bearer token         |

> 💡 **Frontend Note:** Start a 60-second countdown timer after calling this. Display `availableIn` seconds from the 429 response if the user tries again too soon.

</details>

<details>
<summary><strong>POST /patient/password/email — Forgot Password (Send OTP)</strong></summary>

```http
POST /patient/password/email
Content-Type: application/json
```

> ⚠️ Rate limited: 1 request per 120 seconds per IP+email

| Body Param | Type   | Required | Rules                       |
| ---------- | ------ | -------- | --------------------------- |
| `email`    | string | ✅       | valid email, exists in users |

**Response (200):**

```json
{
  "status": true,
  "message": "OTP sent successfully, please check your email.",
  "data": null
}
```

| Status | Scenario                             |
| ------ | ------------------------------------ |
| 422    | Email not provided or not registered |
| 429    | Rate limited — wait N seconds        |

**Frontend Usage Example:**

```javascript
await axios.post('/api/v1/patient/password/email', {
  email: 'sara@example.com'
});
// Navigate to OTP input screen, start 120s cooldown timer
```

> 💡 **Frontend Note:** No auth token needed. Start a 120-second cooldown timer in the UI after a successful call.

</details>

<details>
<summary><strong>POST /patient/password/reset — Reset Password</strong></summary>

```http
POST /patient/password/reset
Content-Type: application/json
```

| Body Param              | Type   | Required | Rules                            |
| ----------------------- | ------ | -------- | -------------------------------- |
| `email`                 | string | ✅       | valid email, exists in users, max:70 |
| `code`                  | string | ✅       | exactly 5 characters             |
| `password`              | string | ✅       | min:8, max:20, confirmed         |
| `password_confirmation` | string | ✅       | must match password              |

> ⚠️ The OTP field name is `code`, not `otp`. The code is a 5-digit string sent via email.

**Response (200):**

```json
{
  "status": true,
  "message": "Password has been reset successfully. Please login with your new password.",
  "data": null
}
```

| Status | Scenario                                      |
| ------ | --------------------------------------------- |
| 400    | Invalid or expired OTP code                   |
| 404    | Patient not found (edge case)                 |
| 422    | Validation failed (password too short, etc.)  |

> 💡 **Frontend Note:** After a successful reset, all existing tokens are revoked. Redirect the user to the login page. Do NOT attempt to auto-login — the user must re-authenticate.

**Frontend Usage Example:**

```javascript
await axios.post('/api/v1/patient/password/reset', {
  email: 'sara@example.com',
  code: '12345',
  password: 'newSecurePass1',
  password_confirmation: 'newSecurePass1'
});
// Clear stored token, redirect to login
localStorage.removeItem('token');
window.location.href = '/login';
```

</details>

---

### 👤 Patient Profile

<details>
<summary><strong>GET /patient/data — Get Authenticated Patient</strong></summary>

```http
GET /patient/data
Authorization: Bearer <token>
```

**Response (200):**

> ⚠️ This endpoint returns raw `JsonResource` — no `status`/`message` wrapper.

```json
{
  "data": {
    "id": 1,
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "age": 28,
    "phone": "01012345678",
    "life_stage_id": 2,
    "life_stage": { "id": 2, "name": "Pregnancy", "slug": "pregnancy" },
    "profile": {
      "id": 1,
      "height": 165,
      "weight": 62.5,
      "bmi": 22.9,
      "bmi_category": "normal",
      "age_calculated": 28,
      "blood_type": "A+",
      "date_of_birth": "1998-03-15",
      "national_id": null,
      "medical_history": null,
      "chronic_diseases": [],
      "allergies": [],
      "current_medications": [],
      "emergency_contact_name": "أحمد محمد",
      "emergency_contact_phone": "01198765432",
      "last_update": "2026-02-14"
    },
    "is_active": true,
    "image": "https://localhost:8000/storage/uploads/patients/images/sara.jpg",
    "image_url": "https://localhost:8000/storage/uploads/patients/images/sara.jpg",
    "is_verified": true,
    "joined_at": "2026-01-10"
  }
}
```

> 💡 **Frontend Note:** Use this endpoint to re-hydrate the auth store on page reload. Cache for the session duration — invalidate on profile update.

</details>

<details>
<summary><strong>GET /patient/profile — View Profile</strong></summary>

```http
GET /patient/profile
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "تم جلب الملف الشخصي بنجاح",
  "data": {
    "id": 1,
    "name": "سارة أحمد",
    "email": "sara@example.com",
    "age": 28,
    "phone": "01012345678",
    "life_stage_id": 2,
    "life_stage": { "id": 2, "name": "Pregnancy", "slug": "pregnancy" },
    "profile": {
      /* Full ProfileResource */
    },
    "is_active": true,
    "image_url": "https://...",
    "is_verified": true,
    "joined_at": "2026-01-10",
    "profile_completion": 80.0,
    "missing_fields": ["emergency_contact_name", "blood_type"]
  }
}
```

> 💡 **Frontend Note:** `profile_completion` (0–100) and `missing_fields` are appended by the controller and are NOT part of the standard `PatientResource`.

</details>

<details>
<summary><strong>PUT /patient/profile/basic — Update Basic Info</strong></summary>

```http
PUT /patient/profile/basic
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Body Param      | Type    | Required | Rules                      |
| --------------- | ------- | -------- | -------------------------- |
| `name`          | string  | ❌       | max:255                    |
| `age`           | integer | ❌       | min:12, max:100            |
| `phone`         | string  | ❌       | Egyptian mobile, unique    |
| `image`         | file    | ❌       | jpeg,png,jpg,gif — max:2MB |
| `life_stage_id` | integer | ❌       | exists in life_stages      |

**Response (200):** Updated `PatientResource`

> 💡 **Frontend Note:** Use `multipart/form-data` when uploading an image. Send as `POST` with `_method: PUT` if your HTTP client doesn't support `PUT` with files.

</details>

<details>
<summary><strong>PUT /patient/profile/medical — Update Medical Info</strong></summary>

```http
PUT /patient/profile/medical
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param            | Type    | Required | Rules                            |
| --------------------- | ------- | -------- | -------------------------------- |
| `height`              | numeric | ❌       | min:100, max:250 (cm)            |
| `weight`              | numeric | ❌       | min:30, max:300 (kg)             |
| `blood_type`          | string  | ❌       | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `date_of_birth`       | date    | ❌       | before:today, after:1920-01-01   |
| `national_id`         | string  | ❌       | exactly 14 digits, unique        |
| `medical_history`     | string  | ❌       | max:5000                         |
| `chronic_diseases`    | array   | ❌       | array of strings                 |
| `allergies`           | array   | ❌       | array of strings                 |
| `current_medications` | array   | ❌       | array of strings                 |

**Response:** Updated `PatientResource`

</details>

<details>
<summary><strong>PUT /patient/profile/emergency — Update Emergency Contact</strong></summary>

```http
PUT /patient/profile/emergency
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                | Type   | Required | Rules                  |
| ------------------------- | ------ | -------- | ---------------------- |
| `emergency_contact_name`  | string | ✅       | max:255                |
| `emergency_contact_phone` | string | ✅       | Egyptian mobile format |

**Response:** Updated `PatientResource`

</details>

<details>
<summary><strong>GET /patient/profile/stats — Profile Statistics</strong></summary>

```http
GET /patient/profile/stats
Authorization: Bearer <token>
```

> Returns profile completion percentage and health metrics

**Response (200):**

```json
{
  "status": true,
  "message": "Success",
  "data": {
    "profile_completion_percentage": 75.0,
    "missing_fields": ["height", "weight", "blood_type"],
    "bmi": 24.5,
    "bmi_category": "Normal",
    "health_score": 68,
    "last_updated": "2026-05-18T21:00:00Z"
  }
}
```

</details>

<details>
<summary><strong>PUT /patient/profile/password — Change Password</strong></summary>

```http
PUT /patient/profile/password
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param              | Type   | Required | Rules                    |
| ----------------------- | ------ | -------- | ------------------------ |
| `current_password`      | string | ✅       | must match current       |
| `password`              | string | ✅       | min:8, max:20, confirmed |
| `password_confirmation` | string | ✅       | must match password      |

**Response (200):**

```json
{
  "status": true,
  "message": "تم تغيير كلمة المرور بنجاح",
  "data": null
}
```

| Status | Scenario                              |
| ------ | ------------------------------------- |
| 422    | Current password is incorrect         |
| 422    | New password doesn't meet requirements|

</details>

<details>
<summary><strong>DELETE /patient/profile/image — Delete Profile Image</strong></summary>

```http
DELETE /patient/profile/image
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "تم حذف الصورة بنجاح",
  "data": null
}
```

</details>

---

### 📊 Patient Dashboard

<details>
<summary><strong>GET /patient/dashboard/stats — Dashboard Statistics</strong></summary>

```http
GET /patient/dashboard/stats
Authorization: Bearer <token>
```

**Response (200):** Patient-specific dashboard data with summaries, upcoming consultations, health tracker status, and quick actions.

> 💡 **Frontend Note:** Cache for 5 minutes. Use stale-while-revalidate for snappy UX.

</details>

---

### 📱 Health Trackers

<details>
<summary><strong>GET /patient/trackers/summary — Trackers Summary</strong></summary>

```http
GET /patient/trackers/summary
Authorization: Bearer <token>
```

**Response (200):** Summary of all health trackers (mood, weight, period, fertility, pregnancy) with latest entries and trends.

> 💡 **Frontend Note:** Use on the trackers main page. Cache for 5 minutes.

</details>

#### 😊 Mood Tracker

<details>
<summary><strong>GET /patient/mood — List Mood Entries</strong></summary>

```http
GET /patient/mood
Authorization: Bearer <token>
```

| Query Param  | Type    | Description                 |
| ------------ | ------- | --------------------------- |
| `date`       | date    | Filter by specific date     |
| `month`      | string  | Filter by month (YYYY-MM)   |
| `start_date` | date    | Range start                 |
| `end_date`   | date    | Range end                   |
| `limit`      | integer | Results limit (default: 30) |

**Response:** Paginated `MoodResource` collection

</details>

<details>
<summary><strong>POST /patient/mood — Create Mood Entry</strong></summary>

```http
POST /patient/mood
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param   | Type   | Required | Rules                                             |
| ------------ | ------ | -------- | ------------------------------------------------- |
| `mood`       | string | ✅       | `very_bad`, `bad`, `neutral`, `good`, `very_good` |
| `notes`      | string | ❌       | max:1000                                          |
| `factors`    | array  | ❌       | array of strings                                  |
| `entry_date` | date   | ❌       | before_or_equal:today                             |
| `entry_time` | string | ❌       | format: HH:mm                                     |

**Response (201):**

```json
{
  "data": {
    "id": 1,
    "mood": "good",
    "notes": "Feeling great today",
    "factors": ["exercise", "good_sleep"],
    "entry_date": "2026-02-14",
    "entry_time": "10:30",
    "created_at": "2026-02-14T10:30:00Z"
  }
}
```

</details>

<details>
<summary><strong>GET /patient/mood/analytics — Mood Analytics</strong></summary>

```http
GET /patient/mood/analytics
Authorization: Bearer <token>
```

| Query Param | Type   | Default | Options                 |
| ----------- | ------ | ------- | ----------------------- |
| `period`    | string | `month` | `week`, `month`, `year` |

**Response:**

```json
{
  "data": {
    "period": "month",
    "date_range": { "start": "2026-01-14", "end": "2026-02-14" },
    "total_count": 25,
    "mood_distribution": {
      "very_good": 5,
      "good": 10,
      "neutral": 6,
      "bad": 3,
      "very_bad": 1
    },
    "mood_percentages": {
      "very_good": 20,
      "good": 40,
      "neutral": 24,
      "bad": 12,
      "very_bad": 4
    },
    "average_mood_score": 3.6,
    "most_common_mood": "good",
    "mood_trend": "improving",
    "factors_analysis": { "exercise": 8, "good_sleep": 12, "stress": 5 },
    "insights": ["Your mood has been improving over the past month"]
  }
}
```

</details>

<details>
<summary><strong>DELETE /patient/mood/{id} — Delete Mood Entry</strong></summary>

```http
DELETE /patient/mood/{id}
Authorization: Bearer <token>
```

</details>

#### ⚖️ Weight Tracker

<details>
<summary><strong>GET /patient/weight — List Weight Entries</strong></summary>

```http
GET /patient/weight
Authorization: Bearer <token>
```

| Query Param | Type    | Default | Options                                              |
| ----------- | ------- | ------- | ---------------------------------------------------- |
| `period`    | string  | `all`   | `week`, `month`, `3months`, `6months`, `year`, `all` |
| `limit`     | integer | `50`    | —                                                    |

**Response:**

```json
{
  "data": {
    "entries": [
      /* WeightResource collection */
    ],
    "stats": {
      "current_weight": 65.5,
      "starting_weight": 70.0,
      "total_change": -4.5,
      "average_weight": 67.2,
      "min_weight": 65.0,
      "max_weight": 70.0,
      "total_entries": 20,
      "trend": "decreasing"
    }
  }
}
```

</details>

<details>
<summary><strong>POST /patient/weight — Create Weight Entry</strong></summary>

```http
POST /patient/weight
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param   | Type    | Required | Rules                 |
| ------------ | ------- | -------- | --------------------- |
| `weight`     | numeric | ✅       | min:30, max:300 (kg)  |
| `height`     | numeric | ❌       | min:100, max:250 (cm) |
| `notes`      | string  | ❌       | max:1000              |
| `entry_date` | date    | ❌       | before_or_equal:today |
| `entry_time` | string  | ❌       | format: HH:mm         |

**Response (201):** `WeightResource`

</details>

<details>
<summary><strong>GET /patient/weight/chart — Weight Chart Data</strong></summary>

```http
GET /patient/weight/chart
Authorization: Bearer <token>
```

| Query Param | Type   | Options                                       |
| ----------- | ------ | --------------------------------------------- |
| `period`    | string | `week`, `month`, `3months`, `6months`, `year` |

**Response:**

```json
{
  "data": {
    "chart_data": [{ "date": "2026-02-01", "weight": 66.0, "bmi": 22.5 }],
    "goal": { "target_weight": 60, "deadline": "..." },
    "progress_percentage": 45
  }
}
```

</details>

<details>
<summary><strong>DELETE /patient/weight/{id} — Delete Weight Entry</strong></summary>

```http
DELETE /patient/weight/{id}
Authorization: Bearer <token>
```

</details>

#### 🔴 Period Tracker

<details>
<summary><strong>GET /patient/period — List Period Cycles</strong></summary>

```http
GET /patient/period
Authorization: Bearer <token>
```

| Query Param | Type    | Default |
| ----------- | ------- | ------- |
| `limit`     | integer | `12`    |

**Response:**

```json
{
  "data": {
    "cycles": [
      /* PeriodResource collection */
    ],
    "current_cycle": {
      /* active cycle or null */
    },
    "stats": {
      "average_cycle_length": 28,
      "average_period_length": 5,
      "cycle_regularity": "regular",
      "most_common_symptoms": ["cramps", "headache"]
    }
  }
}
```

</details>

<details>
<summary><strong>POST /patient/period — Start New Period</strong></summary>

```http
POST /patient/period
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param   | Type   | Required | Rules                      |
| ------------ | ------ | -------- | -------------------------- |
| `start_date` | date   | ✅       | before_or_equal:today      |
| `flow`       | string | ❌       | `light`, `medium`, `heavy` |
| `symptoms`   | array  | ❌       | array of strings           |
| `notes`      | string | ❌       | max:1000                   |

**Response (201):** `PeriodResource`

</details>

<details>
<summary><strong>PUT /patient/period/{id}/end — End Period Cycle</strong></summary>

```http
PUT /patient/period/{id}/end
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type | Required |
| ---------- | ---- | -------- |
| `end_date` | date | ✅       |

**Response:** Updated `PeriodResource`

</details>

<details>
<summary><strong>GET /patient/period/predictions — Period Predictions</strong></summary>

```http
GET /patient/period/predictions
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "next_periods": [
      {
        "predicted_start": "2026-03-10",
        "predicted_end": "2026-03-15",
        "confidence": 85,
        "ovulation_window": { "start": "2026-02-24", "end": "2026-02-28" }
      }
    ],
    "calendar_data": { ... }
  }
}
```

</details>

<details>
<summary><strong>DELETE /patient/period/{id} — Delete Period Cycle</strong></summary>

```http
DELETE /patient/period/{id}
Authorization: Bearer <token>
```

</details>

#### 🌸 Fertility Tracker

<details>
<summary><strong>GET /patient/fertility — List Fertility Entries</strong></summary>

```http
GET /patient/fertility
Authorization: Bearer <token>
```

| Query Param | Type   | Description               |
| ----------- | ------ | ------------------------- |
| `month`     | string | Filter by month (YYYY-MM) |

**Response:** `FertilityResource` collection

</details>

<details>
<summary><strong>POST /patient/fertility — Create Fertility Entry</strong></summary>

```http
POST /patient/fertility
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                | Type    | Required | Rules                                            |
| ------------------------- | ------- | -------- | ------------------------------------------------ |
| `entry_date`              | date    | ✅       | before_or_equal:today                            |
| `bbt`                     | numeric | ❌       | Basal body temp — min:35, max:42 (°C)            |
| `cervical_mucus`          | string  | ❌       | `dry`, `sticky`, `creamy`, `watery`, `egg_white` |
| `ovulation_test_positive` | boolean | ❌       | —                                                |
| `intercourse`             | boolean | ❌       | —                                                |
| `notes`                   | string  | ❌       | max:500                                          |

**Response (201):** `FertilityResource`

</details>

<details>
<summary><strong>GET /patient/fertility/fertile-window — Fertile Window</strong></summary>

```http
GET /patient/fertility/fertile-window
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "fertile_window": {
      "start_date": "2026-02-20",
      "end_date": "2026-02-25",
      "peak_day": "2026-02-23",
      "days_remaining": 6
    },
    "ovulation": {
      "predicted_date": "2026-02-23",
      "confidence": 80,
      "indicators": ["bbt_rise", "egg_white_mucus"]
    },
    "recommendations": ["Track BBT daily", "..."]
  }
}
```

</details>

<details>
<summary><strong>DELETE /patient/fertility/{id} — Delete Entry</strong></summary>

```http
DELETE /patient/fertility/{id}
Authorization: Bearer <token>
```

</details>

#### 🤰 Pregnancy Tracker

<details>
<summary><strong>POST /patient/pregnancy/start — Start Pregnancy Tracking</strong></summary>

```http
POST /patient/pregnancy/start
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param              | Type   | Required | Rules                       |
| ----------------------- | ------ | -------- | --------------------------- |
| `last_menstrual_period` | date   | ✅       | before_or_equal:today       |
| `conception_date`       | date   | ❌       | after:last_menstrual_period |
| `due_date`              | date   | ❌       | after:last_menstrual_period |
| `notes`                 | string | ❌       | max:1000                    |

**Response (201):**

```json
{
  "data": {
    "id": 1,
    "last_menstrual_period": "2025-12-01",
    "due_date": "2026-09-07",
    "days_pregnant": 75,
    "weeks_remaining": 30,
    "days_remaining": 205,
    "trimester": 1
  }
}
```

</details>

<details>
<summary><strong>GET /patient/pregnancy/current — Current Pregnancy</strong></summary>

```http
GET /patient/pregnancy/current
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "id": 1,
    "last_menstrual_period": "2025-12-01",
    "due_date": "2026-09-07",
    "current_week": 11,
    "current_day": 2,
    "days_pregnant": 75,
    "weeks_remaining": 29,
    "days_remaining": 198,
    "trimester": 1,
    "trimester_progress": 78,
    "pregnancy_status": "on_track",
    "baby_development": { "size": "fig", "length": "4.1 cm", "weight": "7 g" },
    "stats": { ... }
  }
}
```

</details>

<details>
<summary><strong>POST /patient/pregnancy/entry — Log Pregnancy Entry</strong></summary>

```http
POST /patient/pregnancy/entry
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                 | Type    | Required | Rules                 |
| -------------------------- | ------- | -------- | --------------------- |
| `week_number`              | integer | ❌       | min:1, max:42         |
| `weight`                   | numeric | ❌       | min:30, max:200       |
| `blood_pressure_systolic`  | integer | ❌       | min:60, max:250       |
| `blood_pressure_diastolic` | integer | ❌       | min:40, max:160       |
| `symptoms`                 | array   | ❌       | array of strings      |
| `notes`                    | string  | ❌       | max:2000              |
| `entry_date`               | date    | ❌       | before_or_equal:today |

**Response (201):**

```json
{
  "data": {
    "entry": { ... },
    "alerts": ["High blood pressure detected, consult your doctor"]
  }
}
```

</details>

<details>
<summary><strong>GET /patient/pregnancy/entries — List Entries</strong></summary>

```http
GET /patient/pregnancy/entries
Authorization: Bearer <token>
```

| Query Param  | Type    | Description      |
| ------------ | ------- | ---------------- |
| `start_week` | integer | Filter from week |
| `end_week`   | integer | Filter to week   |

**Response:**

```json
{
  "data": {
    "entries": [...],
    "summary": {
      "total_entries": 15,
      "weeks_tracked": 10,
      "average_weight": 68.5,
      "total_weight_gain": 3.5
    }
  }
}
```

</details>

<details>
<summary><strong>GET /patient/pregnancy/week/{number} — Week Info</strong></summary>

```http
GET /patient/pregnancy/week/{number}
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "week_number": 12,
    "trimester": 1,
    "baby_development": "...",
    "mother_changes": "...",
    "symptoms_to_expect": [...],
    "medical_tips": [...],
    "nutrition_tips": [...],
    "warning_signs": [...],
    "checklist": [...]
  }
}
```

</details>

<details>
<summary><strong>GET /patient/pregnancy/weeks-info — All Weeks Info</strong></summary>

```http
GET /patient/pregnancy/weeks-info
Authorization: Bearer <token>
```

**Response:** Array of all 40 weeks with summary, baby size, and trimester info

</details>

<details>
<summary><strong>GET /patient/pregnancy/weight-chart — Pregnancy Weight Chart</strong></summary>

```http
GET /patient/pregnancy/weight-chart
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "chart_data": [...],
    "recommended_range_data": [...],
    "current_status": "within_range"
  }
}
```

</details>

<details>
<summary><strong>GET /patient/pregnancy/stats — Pregnancy Stats</strong></summary>

```http
GET /patient/pregnancy/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "weight_stats": { ... },
    "blood_pressure_stats": { ... },
    "symptoms_stats": { ... },
    "milestones_completed": [...],
    "upcoming_milestones": [...]
  }
}
```

</details>

<details>
<summary><strong>PUT /patient/pregnancy/{id}/complete — Complete Pregnancy</strong></summary>

```http
PUT /patient/pregnancy/{id}/complete
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param      | Type   | Required | Options              |
| --------------- | ------ | -------- | -------------------- |
| `delivery_date` | date   | ✅       | —                    |
| `delivery_type` | string | ✅       | `normal`, `cesarean` |
| `notes`         | string | ❌       | —                    |

</details>

<details>
<summary><strong>GET /patient/pregnancy/history — Pregnancy History</strong></summary>

```http
GET /patient/pregnancy/history
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>🗂️ Pregnancy Files</strong></summary>

#### Upload File

```http
POST /patient/pregnancy/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Body Param    | Type   | Required | Rules                                                                          |
| ------------- | ------ | -------- | ------------------------------------------------------------------------------ |
| `file`        | file   | ✅       | pdf,jpg,jpeg,png — max:10MB                                                    |
| `category`    | string | ✅       | `lab_result`, `ultrasound`, `x_ray`, `prescription`, `medical_report`, `other` |
| `description` | string | ❌       | —                                                                              |
| `file_date`   | date   | ❌       | —                                                                              |

#### Get Files

```http
GET /patient/pregnancy/files
Authorization: Bearer <token>
```

| Query Param | Type   | Description        |
| ----------- | ------ | ------------------ |
| `category`  | string | Filter by category |

#### Delete File

```http
DELETE /patient/pregnancy/files/{id}
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>💊 Pregnancy Medications</strong></summary>

#### List Medications

```http
GET /patient/pregnancy/medications
Authorization: Bearer <token>
```

#### Add Medication

```http
POST /patient/pregnancy/medications
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param    | Type   | Required |
| ------------- | ------ | -------- |
| `name`        | string | ✅       |
| `dosage`      | string | ❌       |
| `frequency`   | string | ✅       |
| `time_of_day` | string | ❌       |
| `notes`       | string | ❌       |

#### Toggle Medication Taken

```http
POST /patient/pregnancy/medications/{id}/toggle
Authorization: Bearer <token>
```

#### Delete Medication

```http
DELETE /patient/pregnancy/medications/{id}
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>👶 Kick Counter</strong></summary>

#### List Kick Sessions

```http
GET /patient/pregnancy/kicks
Authorization: Bearer <token>
```

Returns last 10 sessions.

#### Record Kick Session

```http
POST /patient/pregnancy/kicks
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param         | Type     | Required |
| ------------------ | -------- | -------- |
| `kick_count`       | integer  | ✅       |
| `duration_seconds` | integer  | ✅       |
| `started_at`       | datetime | ✅       |
| `ended_at`         | datetime | ✅       |
| `notes`            | string   | ❌       |

#### Delete Kick Session

```http
DELETE /patient/pregnancy/kicks/{id}
Authorization: Bearer <token>
```

</details>

---

### 🔍 Doctor Search & Discovery

<details>
<summary><strong>GET /patient/doctors/search — Search Doctors</strong></summary>

```http
GET /patient/doctors/search
Authorization: Bearer <token>
```

| Query Param      | Type    | Required | Options                                                                                                              |
| ---------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `specialization` | string  | ❌       | Filter by specialization slug                                                                                                |
| `life_stage_id`  | integer | ❌       | Filter by life stage                                                                                                 |
| `min_price`      | numeric | ❌       | Minimum consultation price                                                                                           |
| `max_price`      | numeric | ❌       | Maximum consultation price                                                                                           |
| `min_rating`     | numeric | ❌       | Minimum rating (0–5)                                                                                                 |
| `languages`      | array   | ❌       | e.g. `["ar","en"]`                                                                                                           |
| `session_type`   | string  | ❌       | `video`, `chat`, or `both`                                                                                           |
| `availability`   | string  | ❌       | `today`, `this_week`, `available_now`                                                                                   |
| `sort_by`        | string  | ❌       | `rating`, `price_asc`, `price_desc`, `experience`                                                   |
| `per_page`       | integer | ❌       | Default: 10                                                                                                        |
| `page`           | integer | ❌       | Default: 1                                                                                                                |

**Response:** Paginated `DoctorResource` collection

</details>

<details>
<summary><strong>GET /patient/doctors/recommended — Recommended Doctors</strong></summary>

```http
GET /patient/doctors/recommended
Authorization: Bearer <token>
```

**Response:** `DoctorResource` collection based on patient's life stage

</details>

<details>
<summary><strong>GET /patient/doctors/{id} — Doctor Detail</strong></summary>

```http
GET /patient/doctors/{id}
Authorization: Bearer <token>
```

**Response:** Full `DoctorDetailResource`

</details>

<details>
<summary><strong>GET /patient/doctors/{id}/available-slots — Available Slots</strong></summary>

```http
GET /patient/doctors/{id}/available-slots
Authorization: Bearer <token>
```

| Query Param | Type         | Default |
| ----------- | ------------ | ------- |
| `date`      | date (Y-m-d) | today   |
| `duration`  | integer      | 30      |

**Response:** Array of available time slots

</details>

<details>
<summary><strong>GET /patient/doctors/{id}/reviews — Doctor Reviews</strong></summary>

```http
GET /patient/doctors/{id}/reviews
Authorization: Bearer <token>
```

| Query Param | Type    | Default |
| ----------- | ------- | ------- |
| `rating`    | integer | all     |
| `per_page`  | integer | 10      |

**Response:**

```json
{
  "data": {
    "reviews": [
      /* ReviewResource */
    ],
    "summary": {
      "average_rating": 4.5,
      "total_reviews": 42,
      "5_star": 20,
      "4_star": 15,
      "3_star": 5,
      "2_star": 1,
      "1_star": 1
    }
  }
}
```

</details>

---

### 📅 Patient Consultations

<details>
<summary><strong>POST /patient/consultations/book — Book Consultation</strong></summary>

```http
POST /patient/consultations/book
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param       | Type    | Required    | Rules                                                                           |
| ---------------- | ------- | ----------- | ------------------------------------------------------------------------------- |
| `doctor_id`      | integer | ✅          | exists in doctors                                                               |
| `date`           | date    | ✅          | after_or_equal:today                                                            |
| `time`           | string  | ✅          | format: HH:mm                                                                   |
| `type`           | string  | ✅          | `video`, `offline`                                                              |
| `patient_notes`  | string  | ❌          | max:1000                                                                        |
| `payment_method` | string  | ✅ (video)  | `paymob_card`, `paymob_wallet`, `paymob_installments`, `cash`, `card`, `wallet` |
| `wallet_number`  | string  | ✅ (wallet) | Egyptian mobile format                                                          |

**Response (201):**

```json
{
  "data": {
    "consultation": {
      /* ConsultationResource */
    },
    "payment": {
      "order_id": "123456",
      "payment_url": "https://accept.paymob.com/...",
      "redirect_url": "...",
      "pending": true,
      "status": "pending"
    }
  }
}
```

</details>

<details>
<summary><strong>GET /patient/consultations — List My Consultations</strong></summary>

```http
GET /patient/consultations
Authorization: Bearer <token>
```

| Query Param | Type    | Description        |
| ----------- | ------- | ------------------ |
| `status`    | string  | Filter by status   |
| `upcoming`  | boolean | Show upcoming only |
| `past`      | boolean | Show past only     |
| `per_page`  | integer | Default: 10        |

**Response:**

```json
{
  "data": {
    "consultations": [
      /* ConsultationResource */
    ],
    "stats": {
      "total": 15,
      "upcoming": 2,
      "completed": 10,
      "cancelled": 3
    }
  }
}
```

</details>

<details>
<summary><strong>GET /patient/consultations/{id} — Consultation Detail</strong></summary>

```http
GET /patient/consultations/{id}
Authorization: Bearer <token>
```

**Response:** Full `ConsultationResource`

</details>

<details>
<summary><strong>PUT /patient/consultations/{id}/cancel — Cancel Consultation</strong></summary>

```http
PUT /patient/consultations/{id}/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param            | Type   | Required | Rules   |
| --------------------- | ------ | -------- | ------- |
| `cancellation_reason` | string | ✅       | max:500 |

**Response:**

```json
{
  "data": {
    "consultation": {
      /* ConsultationResource */
    },
    "refund_status": "refunded"
  }
}
```

</details>

<details>
<summary><strong>PUT /patient/consultations/{id}/reschedule — Reschedule</strong></summary>

```http
PUT /patient/consultations/{id}/reschedule
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required | Rules                |
| ---------- | ------ | -------- | -------------------- |
| `new_date` | date   | ✅       | after_or_equal:today |
| `new_time` | string | ✅       | format: HH:mm        |
| `reason`   | string | ❌       | max:500              |

**Response:**

```json
{
  "data": {
    "consultation": {
      /* ConsultationResource */
    },
    "old_date": "2026-02-14",
    "old_time": "14:00"
  }
}
```

</details>

<details>
<summary><strong>POST /patient/consultations/{id}/review — Review Doctor</strong></summary>

```http
POST /patient/consultations/{id}/review
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param     | Type    | Required | Rules        |
| -------------- | ------- | -------- | ------------ |
| `rating`       | integer | ✅       | min:1, max:5 |
| `comment`      | string  | ❌       | max:500      |
| `is_anonymous` | boolean | ❌       | —            |

**Response (201):**

```json
{
  "data": {
    "review": {
      "id": 1,
      "rating": 5,
      "comment": "Excellent doctor!",
      "is_anonymous": false,
      "created_at": "2026-02-14T15:00:00Z"
    },
    "doctor_new_rating": 4.7
  }
}
```

</details>

<details>
<summary><strong>GET /patient/consultations/{id}/meeting-info — Get Meeting Info</strong></summary>

```http
GET /patient/consultations/{id}/meeting-info
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "meet_link": "https://meet.google.com/abc-defg-hij",
    "meet_id": "abc-defg-hij",
    "event_id": "...",
    "can_join": true
  }
}
```

</details>

---

### 💳 Patient Payments

<details>
<summary><strong>GET /patient/payments — List Payments</strong></summary>

```http
GET /patient/payments
Authorization: Bearer <token>
```

| Query Param | Type    | Default |
| ----------- | ------- | ------- |
| `per_page`  | integer | 10      |

**Response:**

```json
{
  "data": {
    "payments": [
      {
        "id": 1,
        "transaction_id": "TXN_123456",
        "amount": 250.0,
        "status": "paid",
        "status_ar": "مدفوع",
        "payment_method": "paymob_card",
        "paid_at": "2026-02-14T10:00:00Z",
        "consultation": {
          "id": 5,
          "date": "2026-02-15",
          "doctor_name": "د. أحمد محمد"
        },
        "created_at": "2026-02-14T09:55:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "per_page": 10,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

</details>

<details>
<summary><strong>POST /patient/payments/{id}/request-refund — Request Refund</strong></summary>

```http
POST /patient/payments/{id}/request-refund
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "payment": { "id": 1, "status": "refunded" }
  }
}
```

</details>

<details>
<summary><strong>💳 Payment Webhooks (No Auth)</strong></summary>

#### Paymob Callback

```http
POST /patient/payments/paymob/callback
```

Webhook endpoint for Paymob payment notifications. Verified via HMAC.

#### Paymob Redirect

```http
GET /patient/payments/paymob/redirect
```

Redirect URL after payment completion.

</details>

---

### 🔔 Patient Notifications

<details>
<summary><strong>Notifications Endpoints</strong></summary>

#### List Notifications

```http
GET /patient/notifications
Authorization: Bearer <token>
```

| Query Param   | Type    | Default | Description              |
| ------------- | ------- | ------- | ------------------------ |
| `unread_only` | boolean | false   | Show only unread         |
| `per_page`    | integer | 20      | Items per page           |

**Response (200):**

```json
{
  "status": true,
  "data": {
    "notifications": [
      {
        "id": "a1b2c3d4-uuid",
        "type": "consultation_confirmed",
        "title": "تأكيد الاستشارة",
        "body": "تم تأكيد استشارتك مع د. فاطمة علي",
        "data": { "title": "...", "message": "...", "consultation_id": 5 },
        "read_at": null,
        "created_at": "2026-05-18T10:30:00.000000Z"
      }
    ],
    "total": 15,
    "unread_count": 3,
    "current_page": 1,
    "last_page": 1
  }
}
```

#### Mark as Read

```http
POST /patient/notifications/{id}/read
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم تحديد الإشعار كمقروء" }`

| Status | Scenario             |
| ------ | -------------------- |
| 404    | Notification not found |

#### Mark All as Read

```http
POST /patient/notifications/read-all
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم تحديد جميع الإشعارات كمقروءة" }`

#### Delete Notification

```http
DELETE /patient/notifications/{id}
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم حذف الإشعار" }`

#### Get Unread Count

```http
GET /patient/notifications/unread-count
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "data": { "unread_count": 3 }
}
```

> 💡 **Frontend Note:** Poll this endpoint every 30–60 seconds, or use it on navigation changes. Lightweight and fast.

#### Get Notification Settings

```http
GET /patient/notifications/settings
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "data": {
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "consultation_reminders": true,
    "marketing_emails": false
  }
}
```

#### Update Notification Settings

```http
PUT /patient/notifications/settings
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                | Type    | Required | Rules |
| ------------------------- | ------- | -------- | ----- |
| `email_notifications`     | boolean | ❌       | —     |
| `push_notifications`      | boolean | ❌       | —     |
| `sms_notifications`       | boolean | ❌       | —     |
| `consultation_reminders`  | boolean | ❌       | —     |
| `marketing_emails`        | boolean | ❌       | —     |

**Response (200):** Updated settings object.

#### Get VAPID Public Key (Web Push)

```http
GET /patient/notifications/vapid-key
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "data": { "vapid_key": "BNxGj...long-base64-key" }
}
```

#### Subscribe to Push Notifications

```http
POST /patient/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param    | Type   | Required | Rules       |
| ------------- | ------ | -------- | ----------- |
| `endpoint`    | string | ✅       | valid URL   |
| `keys.p256dh` | string | ✅       | —           |
| `keys.auth`   | string | ✅       | —           |

**Response (200):** `{ "status": true, "message": "تم تفعيل الإشعارات الفورية بنجاح" }`

#### Unsubscribe from Push Notifications

```http
POST /patient/notifications/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `endpoint` | string | ✅       |

**Response (200):** `{ "status": true, "message": "تم إلغاء الإشعارات الفورية" }`

</details>

---

## 👨‍⚕️ Doctor Endpoints

> **Prefix:** `/api/v1/doctor`

### 🔐 Doctor Authentication

<details>
<summary><strong>POST /doctor/auth/register — Register as Doctor</strong></summary>

```http
POST /doctor/auth/register
Content-Type: multipart/form-data
```

> ⚠️ Rate limited. Doctor starts with `verification_status: "pending"` and needs admin approval.

| Body Param           | Type    | Required | Rules                               |
| -------------------- | ------- | -------- | ----------------------------------- |
| `name`               | string  | ✅       | max:255                             |
| `email`              | string  | ✅       | valid email, unique:doctors         |
| `password`           | string  | ✅       | min:8                               |
| `phone`              | string  | ✅       | Egyptian mobile: `01[0125]XXXXXXXX`, unique:doctors |
| `age`                | integer | ❌       | min:25, max:100                     |
| `image`              | file    | ❌       | jpeg,png,jpg,gif — max:2MB          |
| `specialization`     | string  | ✅       | e.g. `gynecology`, `obstetrics`, `fertility` |
| `license_number`     | string  | ✅       | unique:doctors                      |
| `consultation_price` | numeric | ✅       | min:0, max:99999.99 (EGP)           |

**Response (201):**

```json
{
  "status": true,
  "message": "doctor Created Successfully",
  "data": {
    "doctor": {
      "id": 1,
      "name": "د. فاطمة علي",
      "email": "dr.fatma@example.com",
      "age": 35,
      "phone": "01234567890",
      "specialization": "gynecology",
      "license_number": "EG-MED-12345",
      "bio": null,
      "years_of_experience": null,
      "languages": null,
      "consultation_price": 300.00,
      "session_type": null,
      "clinic_address": null,
      "verification_status": "pending",
      "is_active": true,
      "is_available": false,
      "rating": 0,
      "total_consultations": 0,
      "image": "https://localhost:8000/storage/uploads/doctors/images/default-doctor.png",
      "image_url": "https://localhost:8000/storage/uploads/doctors/images/default-doctor.png",
      "is_verified": false,
      "is_email_verified": true,
      "email_verified_at": null,
      "verified_at": null,
      "joined_at": "2026-05-18"
    },
    "token": "1|abc123doctorToken..."
  }
}
```

> 💡 **Frontend Note:** After registration, `verification_status` is `"pending"`. Show a "waiting for admin approval" screen. The doctor cannot access full platform features until status becomes `"approved"`.

| Status | Scenario                                      |
| ------ | --------------------------------------------- |
| 422    | Validation failed (duplicate email/phone/license) |
| 500    | Internal server error during registration     |

</details>

<details>
<summary><strong>POST /doctor/auth/login — Doctor Login</strong></summary>

```http
POST /doctor/auth/login
Content-Type: application/json
```

| Body Param | Type   | Required | Rules          |
| ---------- | ------ | -------- | -------------- |
| `email`    | string | ✅       | valid email    |
| `password` | string | ✅       | min:8, max:255 |

**Response (200):**

```json
{
  "status": true,
  "message": "doctor logged in successfully",
  "data": {
    "doctor": {
      "id": 1,
      "name": "د. فاطمة علي",
      "email": "dr.fatma@example.com",
      "age": 35,
      "phone": "01234567890",
      "specialization": "gynecology",
      "license_number": "EG-MED-12345",
      "bio": "أخصائية نساء وتوليد بخبرة 10 سنوات",
      "years_of_experience": 10,
      "languages": ["ar", "en"],
      "consultation_price": 300.00,
      "session_type": "both",
      "clinic_address": "المعادي، القاهرة",
      "verification_status": "approved",
      "is_active": true,
      "is_available": true,
      "rating": 4.7,
      "total_consultations": 150,
      "life_stages": [
        { "id": 2, "name": "Pregnancy", "slug": "pregnancy" },
        { "id": 3, "name": "Postpartum", "slug": "postpartum" }
      ],
      "image": "https://localhost:8000/storage/uploads/doctors/images/dr-fatma.jpg",
      "image_url": "https://localhost:8000/storage/uploads/doctors/images/dr-fatma.jpg",
      "is_verified": true,
      "is_email_verified": true,
      "email_verified_at": "2026-01-15 10:30:00",
      "verified_at": "2026-01-20",
      "joined_at": "2026-01-15"
    },
    "token": "3|doctorToken789xyz..."
  }
}
```

> 💡 **Token Info:** Expires in 1 month. Store in `localStorage`. The response key is `doctor` (not `user`).

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 401    | Invalid email or password                    |
| 403    | Account deactivated (الحساب معطل)              |
| 429    | Too many attempts (5 per minute per IP+email)|

</details>

<details>
<summary><strong>POST /doctor/auth/logout — Logout</strong></summary>

```http
POST /doctor/auth/logout
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "Logged out successfully",
  "data": null
}
```

</details>

<details>
<summary><strong>POST /doctor/auth/logout/all — Logout All Devices</strong></summary>

```http
POST /doctor/auth/logout/all
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "Logged out from all devices successfully",
  "data": null
}
```

</details>

<details>
<summary><strong>POST /doctor/password/email — Forgot Password</strong></summary>

```http
POST /doctor/password/email
Content-Type: application/json
```

> ⚠️ Rate limited: 1 request per 120 seconds per IP+email

| Body Param | Type   | Required | Rules                          |
| ---------- | ------ | -------- | ------------------------------ |
| `email`    | string | ✅       | valid email, exists in doctors |

**Response (200):**

```json
{
  "status": true,
  "message": "OTP sent successfully, please check your email.",
  "data": null
}
```

| Status | Scenario                             |
| ------ | ------------------------------------ |
| 422    | Email not provided or not registered |
| 429    | Rate limited — wait N seconds        |

</details>

<details>
<summary><strong>POST /doctor/password/reset — Reset Password</strong></summary>

```http
POST /doctor/password/reset
Content-Type: application/json
```

| Body Param              | Type   | Required | Rules                                |
| ----------------------- | ------ | -------- | ------------------------------------ |
| `email`                 | string | ✅       | valid email, exists in doctors, max:70 |
| `code`                  | string | ✅       | exactly 5 characters                 |
| `password`              | string | ✅       | min:8, max:20, confirmed             |
| `password_confirmation` | string | ✅       | must match password                  |

> ⚠️ The OTP field name is `code`, not `otp`.

**Response (200):**

```json
{
  "status": true,
  "message": "Password has been reset successfully. Please login with your new password.",
  "data": null
}
```

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 400    | Invalid or expired OTP code                  |
| 422    | Validation failed (password too short, etc.) |

> 💡 **Frontend Note:** All existing tokens are revoked after reset. Redirect to login.

</details>

---

### 📊 Doctor Dashboard

<details>
<summary><strong>GET /doctor/data — Get Authenticated Doctor</strong></summary>

```http
GET /doctor/data
Authorization: Bearer <token>
```

**Response (200):**

> ⚠️ This endpoint returns raw `JsonResource` — no `status`/`message` wrapper. Also, `lifeStages` is NOT loaded on this route, so `life_stages` will be absent from the response.

```json
{
  "data": {
    "id": 1,
    "name": "د. فاطمة علي",
    "email": "dr.fatma@example.com",
    "age": 35,
    "phone": "01234567890",
    "specialization": "gynecology",
    "license_number": "EG-MED-12345",
    "bio": "أخصائية نساء وتوليد",
    "years_of_experience": 10,
    "languages": ["ar", "en"],
    "consultation_price": 300.00,
    "session_type": "both",
    "clinic_address": "المعادي، القاهرة",
    "verification_status": "approved",
    "is_active": true,
    "is_available": true,
    "rating": 4.7,
    "total_consultations": 150,
    "image": "https://localhost:8000/storage/uploads/doctors/images/dr-fatma.jpg",
    "image_url": "https://localhost:8000/storage/uploads/doctors/images/dr-fatma.jpg",
    "is_verified": true,
    "is_email_verified": true,
    "email_verified_at": "2026-01-15 10:30:00",
    "verified_at": "2026-01-20",
    "joined_at": "2026-01-15"
  }
}
```

> 💡 **Frontend Note:** Use this to re-hydrate the doctor auth store on page reload. Cache for the session.

</details>

<details>
<summary><strong>GET /doctor/dashboard/stats — Dashboard Stats</strong></summary>

```http
GET /doctor/dashboard/stats
Authorization: Bearer <token>
```

**Response (200):** Dashboard statistics including total consultations, earnings, ratings, upcoming appointments, and patient count.

> 💡 **Frontend Note:** Cache for 5 minutes. Good candidate for optimistic UI with stale-while-revalidate.

</details>

<details>
<summary><strong>GET /doctor/dashboard/chart-data — Chart Data</strong></summary>

```http
GET /doctor/dashboard/chart-data
Authorization: Bearer <token>
```

**Response (200):** Chart data arrays for dashboard visualizations (monthly earnings, consultation counts, rating trends).

> 💡 **Frontend Note:** Cache for 15 minutes. Data changes infrequently.

</details>

---

### 👤 Doctor Profile Management

<details>
<summary><strong>GET /doctor/profile — View Profile</strong></summary>

```http
GET /doctor/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "doctor": {
      /* DoctorResource */
    }
  }
}
```

</details>

<details>
<summary><strong>PUT /doctor/profile — Update Profile</strong></summary>

```http
PUT /doctor/profile
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Body Param           | Type    | Required | Rules                          |
| -------------------- | ------- | -------- | ------------------------------ |
| `name`               | string  | ❌       | sometimes, max:255             |
| `phone`              | string  | ❌       | sometimes, Egyptian mobile     |
| `age`                | integer | ❌       | sometimes, min:25, max:80      |
| `image`              | file    | ❌       | sometimes, image, max:2048     |
| `bio`                | string  | ❌       | sometimes, max:1000            |
| `consultation_price` | numeric | ❌       | sometimes, min:0               |
| `session_type`       | string  | ❌       | sometimes, `video`, `chat`, `both` |
| `languages`          | array   | ❌       | sometimes                      |
| `languages.*`        | string  | ❌       | `ar`, `en`, `fr`               |
| `session_duration`   | integer | ❌       | sometimes, min:15, max:120     |
| `gender`             | string  | ❌       | sometimes, `male`, `female`    |
| `profile_image`      | file    | ❌       | sometimes, image, max:2048     |
| `clinic_address`     | string  | ❌       | sometimes, max:500             |
| `life_stage_ids`     | array   | ❌       | sometimes, exists:life_stages  |

**Response:** Updated `DoctorResource`

</details>

<details>
<summary><strong>PUT /doctor/profile/availability — Toggle Availability</strong></summary>

```http
PUT /doctor/profile/availability
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param     | Type    | Required | Rules    |
| -------------- | ------- | -------- | -------- |
| `is_available` | boolean | ✅       | required |

**Response:**

```json
{
  "data": { "is_available": true }
}
```

</details>

---

### 🕐 Working Hours

<details>
<summary><strong>GET /doctor/working-hours — Get Working Hours</strong></summary>

```http
GET /doctor/working-hours
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "day": "monday",
      "day_ar": "الاثنين",
      "start_time": "09:00",
      "end_time": "17:00",
      "is_available": true
    }
  ]
}
```

</details>

<details>
<summary><strong>PUT /doctor/working-hours — Update Working Hours</strong></summary>

```http
PUT /doctor/working-hours
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                     | Type    | Required | Rules                           |
| ------------------------------ | ------- | -------- | ------------------------------- |
| `working_hours`                | array   | ✅       | array of day objects            |
| `working_hours.*.day`          | string  | ✅       | `monday` through `sunday`       |
| `working_hours.*.start_time`   | string  | ✅       | format: HH:mm                   |
| `working_hours.*.end_time`     | string  | ✅       | format: HH:mm, after start_time |
| `working_hours.*.is_available` | boolean | ✅       | —                               |

**Request Example:**

```json
{
  "working_hours": [
    {
      "day": "monday",
      "start_time": "09:00",
      "end_time": "17:00",
      "is_available": true
    },
    {
      "day": "tuesday",
      "start_time": "10:00",
      "end_time": "18:00",
      "is_available": true
    },
    {
      "day": "friday",
      "start_time": "09:00",
      "end_time": "14:00",
      "is_available": true
    },
    {
      "day": "saturday",
      "start_time": "00:00",
      "end_time": "00:00",
      "is_available": false
    }
  ]
}
```

</details>

---

### 📋 Doctor Consultations

<details>
<summary><strong>GET /doctor/consultations/calendar — Calendar View</strong></summary>

```http
GET /doctor/consultations/calendar
Authorization: Bearer <token>
```

| Query Param | Type             | Default       |
| ----------- | ---------------- | ------------- |
| `month`     | string (YYYY-MM) | current month |

**Response:**

```json
{
  "data": {
    "month": "2026-02",
    "consultations_by_date": {
      "2026-02-14": [
        {
          "id": 1,
          "time": "10:00",
          "patient": "سارة",
          "type": "video",
          "status": "confirmed"
        }
      ]
    },
    "stats": { "total": 15, "confirmed": 10, "pending": 5 }
  }
}
```

</details>

<details>
<summary><strong>GET /doctor/consultations — List Consultations</strong></summary>

```http
GET /doctor/consultations
Authorization: Bearer <token>
```

| Query Param | Type    | Description      |
| ----------- | ------- | ---------------- |
| `status`    | string  | Filter by status |
| `date`      | date    | Filter by date   |
| `upcoming`  | boolean | Upcoming only    |
| `per_page`  | integer | Default: 10      |

</details>

<details>
<summary><strong>GET /doctor/consultations/{id} — Consultation Detail</strong></summary>

```http
GET /doctor/consultations/{id}
Authorization: Bearer <token>
```

**Response (200):** Full `ConsultationResource` with patient data, payment, prescription, and meeting info.

| Status | Scenario                                |
| ------ | --------------------------------------- |
| 404    | Consultation not found or not owned     |

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/confirm — Confirm Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/confirm
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "تم تأكيد الاستشارة بنجاح",
  "data": {
    "consultation": { /* ConsultationResource with status: "confirmed" */ }
  }
}
```

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 400    | Consultation not in confirmable state        |
| 404    | Consultation not found                       |

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/start — Start Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/start
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "status": true,
  "message": "تم بدء الاستشارة",
  "data": {
    "consultation": { /* ConsultationResource with status: "in_progress", started_at set */ }
  }
}
```

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 400    | Consultation not confirmed or wrong time     |
| 404    | Consultation not found                       |

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/update-notes — Update Notes</strong></summary>

```http
PUT /doctor/consultations/{id}/update-notes
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                | Type   | Required | Rules                       |
| ------------------------- | ------ | -------- | --------------------------- |
| `doctor_notes`            | string | ❌       | max:5000                    |
| `medications`             | array  | ❌       | array of medication objects |
| `medications.*.name`      | string | ✅       | —                           |
| `medications.*.dosage`    | string | ✅       | —                           |
| `medications.*.frequency` | string | ❌       | —                           |
| `medications.*.duration`  | string | ❌       | —                           |

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/complete — Complete Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/complete
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param                | Type    | Required | Rules                     |
| ------------------------- | ------- | -------- | ------------------------- |
| `doctor_notes`            | string  | ✅       | max:2000                  |
| `diagnosis`               | string  | ❌       | max:1000                  |
| `prescription`            | string  | ❌       | max:2000                  |
| `medications`             | array   | ❌       | —                         |
| `medications.*.name`      | string  | ✅\*     | required with medications |
| `medications.*.dosage`    | string  | ✅\*     | required with medications |
| `medications.*.frequency` | string  | ❌       | —                         |
| `medications.*.duration`  | string  | ❌       | —                         |
| `follow_up_required`      | boolean | ❌       | —                         |
| `follow_up_after_days`    | integer | ❌       | min:1, max:365            |

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/cancel — Cancel Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param            | Type   | Required | Rules   |
| --------------------- | ------ | -------- | ------- |
| `cancellation_reason` | string | ✅       | max:500 |

</details>

<details>
<summary><strong>GET /doctor/consultations/{id}/patient-history — Patient History</strong></summary>

```http
GET /doctor/consultations/{id}/patient-history
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "patient": { "id": 1, "name": "...", "age": 28, "phone": "...", "life_stage": "..." },
    "previous_consultations": [...],
    "medical_profile": { "blood_type": "A+", "chronic_diseases": [...], "allergies": [...] },
    "pregnancy": { /* if applicable */ }
  }
}
```

</details>

<details>
<summary><strong>GET /doctor/consultations/{id}/meeting-info — Meeting Info</strong></summary>

```http
GET /doctor/consultations/{id}/meeting-info
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "meet_link": "https://meet.google.com/abc-defg-hij",
    "meet_id": "abc-defg-hij",
    "event_id": "...",
    "can_join": true
  }
}
```

</details>

---

### 👥 Doctor Patients

<details>
<summary><strong>GET /doctor/patients — List Doctor's Patients</strong></summary>

```http
GET /doctor/patients
Authorization: Bearer <token>
```

| Query Param | Type    | Default | Description                    |
| ----------- | ------- | ------- | ------------------------------ |
| `search`    | string  | —       | Search by patient name         |
| `per_page`  | integer | 10      | Items per page                 |

**Response (200):** Paginated list of patients who had consultations with this doctor, including consultation count and last visit date.

</details>

<details>
<summary><strong>GET /doctor/patients/{id} — Patient Detail</strong></summary>

```http
GET /doctor/patients/{id}
Authorization: Bearer <token>
```

**Response (200):** Patient details with medical profile, consultation history with this doctor, and any previous notes.

| Status | Scenario                                    |
| ------ | ------------------------------------------- |
| 404    | Patient not found or never consulted doctor |

</details>

<details>
<summary><strong>POST /doctor/patients/{id}/notes — Add Patient Note</strong></summary>

```http
POST /doctor/patients/{id}/notes
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required | Rules    |
| ---------- | ------ | -------- | -------- |
| `note`     | string | ✅       | max:5000 |

**Response (201):** Created note with timestamp.

</details>

---

### 📝 Doctor Articles

<details>
<summary><strong>Articles CRUD</strong></summary>

#### List My Articles

```http
GET /doctor/articles
Authorization: Bearer <token>
```

**Response:** Paginated `ArticleResource` collection (only articles authored by the authenticated doctor).

#### Create Article

```http
POST /doctor/articles
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Body Param     | Type   | Required | Rules                                  |
| -------------- | ------ | -------- | -------------------------------------- |
| `title`        | string | ✅       | min:5, max:255, unique                 |
| `excerpt`      | string | ❌       | max:500                                |
| `content`      | string | ✅       | min:20                                 |
| `image`        | file   | ❌       | jpeg,png,jpg,webp — max:5MB            |
| `life_stage_id`| integer| ❌       | exists in life_stages                  |
| `tags`         | array  | ❌       | max:10 tags                            |
| `tags.*`       | string | ❌       | max:50 chars each                      |
| `status`       | string | ❌       | `draft` or `pending_review`            |

> 💡 **Frontend Note:** Use `multipart/form-data` if uploading an image. The article starts as `draft` by default.

**Response (201):** Created `ArticleResource`

#### Get Article

```http
GET /doctor/articles/{id}
Authorization: Bearer <token>
```

**Response:** Full `ArticleResource` with content.

#### Update Article

```http
PUT /doctor/articles/{id}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Same params as Create. Only `draft` or `rejected` articles can be edited.

| Status | Scenario                                 |
| ------ | ---------------------------------------- |
| 403    | Article is not in editable state         |
| 404    | Article not found or not owned by doctor |

#### Submit for Review

```http
PUT /doctor/articles/{id}/submit
Authorization: Bearer <token>
```

**Response (200):** `ArticleResource` with `status: "pending_review"`

#### Delete Article

```http
DELETE /doctor/articles/{id}
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم حذف المقال بنجاح" }`

</details>

---

### 💰 Doctor Financials

<details>
<summary><strong>Financial Endpoints</strong></summary>

#### Financial Stats

```http
GET /doctor/financials/stats
Authorization: Bearer <token>
```

**Response (200):** Financial summary including total earnings, pending payouts, completed payouts, this month's earnings.

> 💡 **Frontend Note:** Cache for 10 minutes.

#### Transaction History

```http
GET /doctor/financials/transactions
Authorization: Bearer <token>
```

| Query Param | Type    | Default | Description          |
| ----------- | ------- | ------- | -------------------- |
| `per_page`  | integer | 10      | Items per page       |
| `status`    | string  | —       | Filter by status     |

**Response (200):** Paginated list of payment transactions for the doctor's consultations.

#### Payout History

```http
GET /doctor/financials/payouts
Authorization: Bearer <token>
```

**Response (200):** Paginated list of doctor's payout requests with status.

#### Request Payout

```http
POST /doctor/financials/request-payout
Authorization: Bearer <token>
```

**Response (201):**

```json
{
  "status": true,
  "message": "تم تقديم طلب السحب بنجاح",
  "data": {
    "payout": {
      "id": 1,
      "amount": 5000.00,
      "status": "pending",
      "requested_at": "2026-05-18T21:00:00Z"
    }
  }
}
```

| Status | Scenario                              |
| ------ | ------------------------------------- |
| 400    | No available balance for payout       |
| 400    | Pending payout already exists         |

</details>

---

### 🔗 Google Integration

<details>
<summary><strong>Google OAuth Endpoints</strong></summary>

#### Get Auth URL

```http
GET /doctor/google/auth-url
Authorization: Bearer <token>
```

**Response:** `{ auth_url: "https://accounts.google.com/..." }`

#### Handle Callback

```http
POST /doctor/google/callback
Authorization: Bearer <token>
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `code`     | string | ✅       |

#### Check Connection

```http
GET /doctor/google/check
Authorization: Bearer <token>
```

**Response:** `{ connected: true, email: "doctor@gmail.com" }`

#### Disconnect

```http
POST /doctor/google/disconnect
Authorization: Bearer <token>
```

</details>

---

### 🔍 Doctor Search

<details>
<summary><strong>GET /doctor/search — Search (Within Portal)</strong></summary>

```http
GET /doctor/search
Authorization: Bearer <token>
```

| Query Param | Type   | Description  |
| ----------- | ------ | ------------ |
| `q`         | string | Search query |

</details>

---

## 🛡️ Admin Endpoints

> **Prefix:** `/api/v1/admin`

### 🔐 Admin Authentication

<details>
<summary><strong>Admin Auth Endpoints</strong></summary>

#### Login

```http
POST /admin/auth/login
Content-Type: application/json
```

| Body Param | Type   | Required | Rules          |
| ---------- | ------ | -------- | -------------- |
| `email`    | string | ✅       | valid email    |
| `password` | string | ✅       | min:8, max:255 |

**Response (200):**

```json
{
  "status": true,
  "message": "تم تسجيل الدخول بنجاح.",
  "data": {
    "admin": {
      "id": 1,
      "name": "محمد عبدالله",
      "email": "admin@widad.com",
      "phone": "01000000000",
      "role_id": 1,
      "role": {
        "id": 1,
        "role": "super_admin",
        "description": "مدير عام",
        "permissions": ["manage_users", "manage_doctors", "manage_consultations", "manage_financials"]
      },
      "is_active": true,
      "is_super_admin": true,
      "image": "https://localhost:8000/storage/uploads/patients/images/default-user.png",
      "image_url": "https://localhost:8000/storage/uploads/patients/images/default-user.png",
      "last_login_at": "2026-05-18 21:00:00",
      "joined_at": "2026-01-01"
    },
    "token": "4|adminToken123xyz..."
  }
}
```

> 💡 **Token Info:** Expires in 1 month. The response key is `admin`. Check `role.permissions` array to conditionally render admin UI sections.

| Status | Scenario                                     |
| ------ | -------------------------------------------- |
| 401    | Invalid credentials (بيانات الدخول غير صحيحة) |
| 403    | Account deactivated (الحساب معطل)              |
| 429    | Too many attempts (5 per minute)             |

#### Logout

```http
POST /admin/auth/logout
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم تسجيل الخروج بنجاح.", "data": null }`

#### Logout All Devices

```http
POST /admin/auth/logout/all
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم تسجيل الخروج من جميع الأجهزة بنجاح.", "data": null }`

#### Forgot Password

```http
POST /admin/password/email
Content-Type: application/json
```

| Body Param | Type   | Required | Rules                          |
| ---------- | ------ | -------- | ------------------------------ |
| `email`    | string | ✅       | valid email, exists in admins  |

**Response (200):** `{ "status": true, "message": "OTP sent successfully.", "data": null }`

#### Reset Password

```http
POST /admin/password/reset
Content-Type: application/json
```

| Body Param              | Type   | Required | Rules                                |
| ----------------------- | ------ | -------- | ------------------------------------ |
| `email`                 | string | ✅       | valid email, exists in admins, max:70 |
| `code`                  | string | ✅       | exactly 5 characters                 |
| `password`              | string | ✅       | min:8, max:20, confirmed             |
| `password_confirmation` | string | ✅       | must match password                  |

> ⚠️ The OTP field name is `code`, not `otp`.

**Response (200):** `{ "status": true, "message": "Password has been reset successfully.", "data": null }`

</details>

---

### 📊 Admin Dashboard

<details>
<summary><strong>Dashboard Endpoints</strong></summary>

#### Get Admin Data

```http
GET /admin/data
Authorization: Bearer <token>
```

**Permissions:** None (any authenticated admin)

> ⚠️ This endpoint returns raw `JsonResource` — no `status`/`message` wrapper.

**Response (200):** Full `AdminResource` with role and permissions. Same as login response but for re-hydration.

#### Dashboard Stats

```http
GET /admin/dashboard/stats
Authorization: Bearer <token>
```

**Permissions:** `view_analytics`

**Response (200):** Platform-wide statistics: total patients, doctors, consultations, revenue, pending approvals, etc.

> 💡 **Frontend Note:** Cache for 5 minutes.

#### Recent Activity

```http
GET /admin/dashboard/recent-activity
Authorization: Bearer <token>
```

**Permissions:** `view_analytics`

**Response (200):** Latest platform events (new registrations, consultations, payments).

#### Alerts

```http
GET /admin/dashboard/alerts
Authorization: Bearer <token>
```

**Permissions:** `view_analytics`

**Response (200):** Active alerts requiring admin attention (pending doctor approvals, reported issues, etc.).

</details>

---

### 👥 Patients Management

<details>
<summary><strong>Patient Management Endpoints</strong></summary>

#### List Patients

```http
GET /admin/patients
Authorization: Bearer <token>
```

| Query Param    | Type    | Default | Description                |
| -------------- | ------- | ------- | -------------------------- |
| `search`       | string  | —       | Search by name/email/phone |
| `status`       | string  | —       | `active` or `inactive`     |
| `life_stage_id`| integer | —       | Filter by life stage       |
| `per_page`     | integer | 10      | Items per page             |

**Response (200):** Paginated `PatientResource` collection with profile info.

#### Get Life Stages

```http
GET /admin/patients/life-stages
Authorization: Bearer <token>
```

**Response (200):** Array of all life stages (for filter dropdowns).

#### Show Patient

```http
GET /admin/patients/{id}
Authorization: Bearer <token>
```

**Response (200):** Full patient details with profile, consultation history, and health tracker summaries.

#### Toggle Patient Status

```http
PUT /admin/patients/{id}/toggle-status
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم تغيير حالة المريض", "data": { "is_active": false } }`

#### Delete Patient

```http
DELETE /admin/patients/{id}
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم حذف المريض بنجاح" }`

</details>

---

### 👨‍⚕️ Doctors Management

<details>
<summary><strong>Doctor Management Endpoints</strong></summary>

#### List Doctors

```http
GET /admin/doctors
Authorization: Bearer <token>
```

| Query Param        | Type    | Default | Description                       |
| ------------------ | ------- | ------- | --------------------------------- |
| `search`           | string  | —       | Search by name/email/phone        |
| `specialization`   | string  | —       | Filter by specialization          |
| `verification_status` | string | —    | `pending`, `approved`, `rejected` |
| `status`           | string  | —       | `active` or `inactive`            |
| `per_page`         | integer | 10      | Items per page                    |

**Response (200):** Paginated `DoctorResource` collection.

#### Get Specializations

```http
GET /admin/doctors/specializations
Authorization: Bearer <token>
```

**Response (200):** Array of all available specializations (for filter dropdowns).

#### Show Doctor

```http
GET /admin/doctors/{id}
Authorization: Bearer <token>
```

**Response (200):** Full doctor details with consultation stats, financial summary, and article count.

#### Verify Doctor

```http
PUT /admin/doctors/{id}/verify
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم الموافقة على الطبيب بنجاح", "data": { "verification_status": "approved" } }`

#### Reject Doctor

```http
PUT /admin/doctors/{id}/reject
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم رفض الطبيب", "data": { "verification_status": "rejected" } }`

#### Toggle Doctor Status

```http
PUT /admin/doctors/{id}/toggle-status
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "data": { "is_active": false } }`

#### Delete Doctor

```http
DELETE /admin/doctors/{id}
Authorization: Bearer <token>
```

**Response (200):** `{ "status": true, "message": "تم حذف الطبيب بنجاح" }`

</details>

---

### 🛡️ Admins Management

<details>
<summary><strong>Admin Management Endpoints</strong></summary>

#### List Admins

```http
GET /admin/admins
Authorization: Bearer <token>
```
**Permissions:** `manage_admins`

**Response (200):** Paginated `AdminResource` collection.

#### Get Roles

```http
GET /admin/admins/roles
Authorization: Bearer <token>
```
**Permissions:** `manage_admins`

**Response (200):** Array of available roles.

#### Show Admin

```http
GET /admin/admins/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_admins`

**Response (200):** Full `AdminResource` details for the specified admin.

#### Create Admin

```http
POST /admin/admins
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_admins`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✅ | max:255 |
| `email` | string | ✅ | valid email, unique:admins |
| `password` | string | ✅ | min:8, confirmed |
| `password_confirmation` | string | ✅ | must match password |
| `role_id` | integer | ✅ | exists:roles,id |

**Response (201):**
```json
{
  "status": true,
  "message": "تم إضافة المشرف بنجاح",
  "data": {
    "id": 2,
    "name": "أحمد محمود",
    "email": "ahmed@admin.widad.com",
    "role_id": 2,
    "is_active": true,
    "created_at": "2026-05-18T20:00:00Z"
  }
}
```

#### Update Admin

```http
PUT /admin/admins/{id}
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_admins`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ❌ | max:255 |
| `email` | string | ❌ | valid email, unique:admins |
| `password` | string | ❌ | min:8, confirmed |
| `password_confirmation` | string | ❌ | must match password |
| `role_id` | integer | ❌ | exists:roles,id |

**Response (200):** Updated `AdminResource`.

#### Toggle Admin Status

```http
PUT /admin/admins/{id}/toggle-status
Authorization: Bearer <token>
```
**Permissions:** `manage_admins`

**Response (200):** 
```json
{
  "status": true,
  "message": "تم تحديث حالة المشرف",
  "data": { "is_active": false }
}
```

#### Delete Admin

```http
DELETE /admin/admins/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_admins`

**Response (200):** 
```json
{
  "status": true,
  "message": "تم حذف المشرف بنجاح",
  "data": null
}
```

</details>

---

### 📋 Join Requests

<details>
<summary><strong>Join Request Endpoints</strong></summary>

#### List Join Requests

```http
GET /admin/join-requests
Authorization: Bearer <token>
```

#### Show Join Request

```http
GET /admin/join-requests/{id}
Authorization: Bearer <token>
```

#### Update Status

```http
PUT /admin/join-requests/{id}/status
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `status`   | string | ✅       |

#### Delete Join Request

```http
DELETE /admin/join-requests/{id}
Authorization: Bearer <token>
```

</details>

---

### 📅 Consultations Management

<details>
<summary><strong>Admin Consultation Endpoints</strong></summary>

#### List All Consultations

```http
GET /admin/consultations
Authorization: Bearer <token>
```
**Permissions:** `view_consultations`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | string | ❌ | Filter by status (`pending`, `completed`, `cancelled`) |
| `doctor_id` | integer | ❌ | Filter by doctor |
| `patient_id` | integer | ❌ | Filter by patient |
| `date_from` | date | ❌ | Consultations after this date |
| `date_to` | date | ❌ | Consultations before this date |
| `per_page` | integer | ❌ | Default: 10 |

**Response (200):** Paginated `ConsultationResource` collection.

#### Get Statistics

```http
GET /admin/consultations/stats
Authorization: Bearer <token>
```
**Permissions:** `view_consultations`

**Response (200):**
```json
{
  "status": true,
  "message": "تم جلب الإحصائيات",
  "data": {
    "total": 5000,
    "pending": 150,
    "completed": 4500,
    "cancelled": 350
  }
}
```

#### Show Consultation

```http
GET /admin/consultations/{id}
Authorization: Bearer <token>
```
**Permissions:** `view_consultations`

**Response (200):** Full `ConsultationResource` with detailed patient and doctor info.

#### Cancel Consultation

```http
PUT /admin/consultations/{id}/cancel
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_consultations`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `cancellation_reason` | string | ✅ | max:500 |
| `cancelled_by` | string | ✅ | must be 'admin' |

**Response (200):**
```json
{
  "status": true,
  "message": "تم إلغاء الاستشارة بنجاح",
  "data": {
    "id": 1024,
    "status": "cancelled",
    "cancellation_reason": "طلب من الإدارة",
    "cancelled_by": "admin"
  }
}
```

</details>

---

### 💰 Financials Management

<details>
<summary><strong>Financial Management Endpoints</strong></summary>

#### Financial Overview

```http
GET /admin/financials/overview
Authorization: Bearer <token>
```
**Permissions:** `manage_financials`

**Response (200):**
```json
{
  "status": true,
  "message": "تم جلب الملخص المالي",
  "data": {
    "total_revenue": 150000.00,
    "platform_fees": 30000.00,
    "doctor_payouts": 120000.00,
    "pending_payouts": 15000.00,
    "this_month": {
      "revenue": 25000.00,
      "transactions_count": 100
    }
  }
}
```

#### List Transactions

```http
GET /admin/financials/transactions
Authorization: Bearer <token>
```
**Permissions:** `manage_financials`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | string | ❌ | Filter by `paid`, `refunded`, etc. |
| `date_from` | date | ❌ | From date |
| `date_to` | date | ❌ | To date |
| `per_page` | integer | ❌ | Items per page |

**Response (200):** Paginated transactions array.

#### Show Transaction

```http
GET /admin/financials/transactions/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_financials`

**Response (200):** Detailed transaction info including consultation and payment details.

#### Refund Transaction

```http
POST /admin/financials/transactions/{id}/refund
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_financials`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `reason` | string | ✅ | max:500 |

**Response (200):**
```json
{
  "status": true,
  "message": "تم استرجاع المبلغ بنجاح",
  "data": {
    "transaction_id": "TXN-98765",
    "status": "refunded"
  }
}
```

#### Financial Reports

```http
GET /admin/financials/reports
Authorization: Bearer <token>
```
**Permissions:** `manage_financials`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `period` | string | ❌ | `daily`, `weekly`, `monthly`, `yearly` |
| `date_from` | date | ❌ | Reporting start |
| `date_to` | date | ❌ | Reporting end |

**Response (200):** Aggregated financial report data.

#### List Payout Requests

```http
GET /admin/financials/payouts
Authorization: Bearer <token>
```
**Permissions:** `process_payouts`

**Response (200):** Paginated list of doctor payout requests.

#### Show Payout Request

```http
GET /admin/financials/payouts/{id}
Authorization: Bearer <token>
```
**Permissions:** `process_payouts`

**Response (200):** Detailed payout request info.

#### Process Payout

```http
PUT /admin/financials/payouts/{id}/process
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `process_payouts`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `notes` | string | ❌ | optional remarks |

**Response (200):**
```json
{
  "status": true,
  "message": "تمت معالجة طلب الدفع بنجاح",
  "data": { "status": "processed" }
}
```

</details>

---

### 📰 Articles Management

<details>
<summary><strong>Article Management Endpoints</strong></summary>

#### List All Articles

```http
GET /admin/articles
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | string | ❌ | `pending`, `approved`, `rejected`, `archived` |
| `doctor_id` | integer | ❌ | Filter by author |
| `life_stage_id` | integer | ❌ | Filter by category |
| `search` | string | ❌ | Search by title/content |
| `per_page` | integer | ❌ | Default: 10 |

**Response (200):** Paginated `ArticleResource` collection.

#### Show Article

```http
GET /admin/articles/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

**Response (200):** Full `ArticleResource` details.

#### Approve Article

```http
PUT /admin/articles/{id}/approve
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

**Response (200):**
```json
{
  "status": true,
  "message": "تم الموافقة على المقال",
  "data": { "status": "approved" }
}
```

#### Reject Article

```http
PUT /admin/articles/{id}/reject
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_articles`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `rejection_reason` | string | ✅ | max:500 |

**Response (200):**
```json
{
  "status": true,
  "message": "تم رفض المقال",
  "data": { "status": "rejected", "rejection_reason": "محتوى غير دقيق" }
}
```

#### Archive Article

```http
PUT /admin/articles/{id}/archive
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

**Response (200):**
```json
{
  "status": true,
  "message": "تم أرشفة المقال",
  "data": { "status": "archived" }
}
```

#### Restore Article

```http
PUT /admin/articles/{id}/restore
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

**Response (200):**
```json
{
  "status": true,
  "message": "تم استعادة المقال",
  "data": { "status": "pending" }
}
```

#### Delete Article

```http
DELETE /admin/articles/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_articles`

**Response (200):** `{ "status": true, "message": "تم حذف المقال نهائياً" }`

</details>

---

### 📬 Contact Messages

<details>
<summary><strong>Contact Message Endpoints</strong></summary>

#### List Messages

```http
GET /admin/contact-messages
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `is_read` | boolean | ❌ | Filter read/unread |
| `search` | string | ❌ | Search name, email, subject |
| `per_page` | integer | ❌ | Default: 10 |

**Response (200):** Paginated messages array.

#### Show Message

```http
GET /admin/contact-messages/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

**Response (200):**
```json
{
  "status": true,
  "message": "تم جلب الرسالة بنجاح",
  "data": {
    "id": 1,
    "name": "مصطفى كامل",
    "email": "mostafa@example.com",
    "phone": "01099887766",
    "subject": "استفسار عن الشراكة",
    "message": "أرغب في الاستفسار عن...",
    "is_read": true,
    "created_at": "2026-05-18T14:30:00Z"
  }
}
```

#### Mark as Read

```http
PUT /admin/contact-messages/{id}/mark-read
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

**Response (200):** `{ "status": true, "data": { "is_read": true } }`

#### Mark as Unread

```http
PUT /admin/contact-messages/{id}/mark-unread
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

**Response (200):** `{ "status": true, "data": { "is_read": false } }`

#### Mark All as Read

```http
PUT /admin/contact-messages/mark-all-read
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

**Response (200):** `{ "status": true, "message": "تم تعيين كافة الرسائل كمقروءة" }`

#### Delete Message

```http
DELETE /admin/contact-messages/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_messages`

**Response (200):** `{ "status": true, "message": "تم حذف الرسالة" }`

#### Bulk Delete

```http
DELETE /admin/contact-messages/bulk-delete
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_messages`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `ids` | array | ✅ | exists:contact_messages,id |

**Response (200):** `{ "status": true, "message": "تم حذف الرسائل المحددة" }`

</details>

---

### 🔔 Notifications (Admin)

<details>
<summary><strong>Admin Notification Endpoints</strong></summary>

#### Send Notification

```http
POST /admin/notifications/send
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `send_notifications`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | ✅ | max:255 |
| `body` | string | ✅ | max:1000 |
| `target_type` | string | ✅ | `all`, `patients`, `doctors`, `specific_users` |
| `user_ids` | array | ✅ (if specific_users) | exists:users,id |
| `scheduled_at` | date | ❌ | after:now |
| `data` | object | ❌ | extra JSON payload |

**Response (200):** `{ "status": true, "message": "تم إرسال الإشعار بنجاح" }`

#### Notification History

```http
GET /admin/notifications/history
Authorization: Bearer <token>
```
**Permissions:** `send_notifications`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `target_type` | string | ❌ | Filter by target |
| `date_from` | date | ❌ | Sent after date |
| `date_to` | date | ❌ | Sent before date |
| `per_page` | integer | ❌ | Items per page |

**Response (200):** Array of notifications with `id`, `title`, `body`, `target_type`, `sent_at`, `total_recipients`, `status`.

#### Scheduled Notifications

```http
GET /admin/notifications/scheduled
Authorization: Bearer <token>
```
**Permissions:** `send_notifications`

**Response (200):** Array of pending scheduled notifications.

#### Cancel Scheduled

```http
DELETE /admin/notifications/scheduled/{id}
Authorization: Bearer <token>
```
**Permissions:** `send_notifications`

**Response (200):** `{ "status": true, "message": "تم إلغاء الإشعار المجدول" }`

</details>

---

### 📈 Analytics

<details>
<summary><strong>Analytics Endpoints</strong></summary>

#### Overview

```http
GET /admin/analytics/overview
Authorization: Bearer <token>
```
**Permissions:** `view_analytics`

**Response (200):**
```json
{
  "status": true,
  "message": "تم جلب نظرة عامة",
  "data": {
    "total_users": 12000,
    "total_doctors": 450,
    "total_consultations": 25000,
    "total_revenue": 1500000.00,
    "new_users_this_month": 350,
    "growth_rate": 5.2,
    "top_specializations": [
      { "name": "نساء وتوليد", "count": 1500 }
    ]
  }
}
```

#### Users Analytics

```http
GET /admin/analytics/users
Authorization: Bearer <token>
```
**Permissions:** `view_analytics`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `period` | string | ❌ | `daily`, `weekly`, `monthly` |
| `date_from` | date | ❌ | Start date |
| `date_to` | date | ❌ | End date |

**Response (200):** Object containing `registrations_over_time` (array of `{date, count}`), `by_life_stage`, `by_gender`, `retention_rate`.

#### Consultations Analytics

```http
GET /admin/analytics/consultations
Authorization: Bearer <token>
```
**Permissions:** `view_analytics`

**Response (200):** Object containing `by_status`, `by_specialization`, `avg_rating`, `completion_rate`, `over_time`.

#### Financial Analytics

```http
GET /admin/analytics/financials
Authorization: Bearer <token>
```
**Permissions:** `view_analytics`

**Response (200):** Object containing `revenue_over_time`, `top_earning_doctors`, `avg_transaction_value`.

#### Articles Analytics

```http
GET /admin/analytics/articles
Authorization: Bearer <token>
```
**Permissions:** `view_analytics`

**Response (200):** Object containing `total_views`, `most_read`, `by_life_stage`, `pending_review_count`.

</details>

---

### ⚙️ Settings

<details>
<summary><strong>Settings Endpoints</strong></summary>

#### Get Site Settings

```http
GET /admin/settings/site
Authorization: Bearer <token>
```
**Permissions:** `manage_settings`

**Response (200):** Returns current site settings (name, contact info, social links).

#### Update Site Settings

```http
PUT /admin/settings/site
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Permissions:** `manage_settings`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `site_name` | string | ❌ | max:255 |
| `email` | string | ❌ | email |
| `phone` | string | ❌ | Egyptian mobile format |
| `address` | string | ❌ | max:500 |
| `description` | string | ❌ | max:2000 |
| `logo` | file | ❌ | image, max:2048 |
| `facebook_url` | string | ❌ | nullable, url |
| `instagram_url`| string | ❌ | nullable, url |
| `twitter_url`  | string | ❌ | nullable, url |

**Response (200):** Updated settings.

#### Get Roles

```http
GET /admin/settings/roles
Authorization: Bearer <token>
```
**Permissions:** `manage_settings`

**Response (200):** Array of roles with their attached permissions.

#### Create Role

```http
POST /admin/settings/roles
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_settings`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✅ | max:100, unique:roles |
| `permissions` | array | ✅ | exists:permissions,name |

**Response (201):** Created role.

#### Update Role

```http
PUT /admin/settings/roles/{id}
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_settings`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✅ | max:100, unique:roles |
| `permissions` | array | ✅ | exists:permissions,name |

**Response (200):** Updated role.

#### Delete Role

```http
DELETE /admin/settings/roles/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_settings`

**Response (200):** `{ "status": true, "message": "تم حذف الصلاحية" }`

#### Get System Settings

```http
GET /admin/settings/system
Authorization: Bearer <token>
```
**Permissions:** `manage_settings`

**Response (200):**
```json
{
  "status": true,
  "message": "تم جلب إعدادات النظام",
  "data": {
    "maintenance_mode": false,
    "consultation_commission_rate": 15.0,
    "max_session_duration": 60,
    "supported_payment_methods": ["paymob_card", "paymob_wallet"]
  }
}
```

</details>

---

### ❓ FAQs Management

<details>
<summary><strong>FAQ Endpoints</strong></summary>

#### List FAQs

```http
GET /admin/faqs
Authorization: Bearer <token>
```
**Permissions:** `manage_faqs`

**Response (200):** Paginated FAQ items.

#### Create FAQ

```http
POST /admin/faqs
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_faqs`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `question` | string | ✅ | max:500 |
| `answer` | string | ✅ | max:5000 |
| `life_stage_id`| integer | ❌ | exists:life_stages,id |
| `is_active` | boolean | ❌ | default: true |
| `order` | integer | ❌ | min:0 |

**Response (201):** Created FAQ resource.

#### Reorder FAQs

```http
PUT /admin/faqs/reorder
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_faqs`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `ordered_ids` | array | ✅ | array of FAQ IDs in new order |

**Response (200):** `{ "status": true, "message": "تم إعادة ترتيب الأسئلة بنجاح" }`

#### Show FAQ

```http
GET /admin/faqs/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_faqs`

**Response (200):** Full FAQ details.

#### Update FAQ

```http
PUT /admin/faqs/{id}
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_faqs`

*(Same request body as Create FAQ)*

#### Toggle FAQ Active

```http
PUT /admin/faqs/{id}/toggle
Authorization: Bearer <token>
```
**Permissions:** `manage_faqs`

**Response (200):**
```json
{
  "status": true,
  "message": "تم تحديث حالة السؤال",
  "data": { "is_active": false }
}
```

#### Delete FAQ

```http
DELETE /admin/faqs/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_faqs`

**Response (200):** `{ "status": true, "message": "تم حذف السؤال" }`

</details>

---

### 📖 About Us Management

<details>
<summary><strong>About Us Endpoints</strong></summary>

#### Get About Us

```http
GET /admin/about-us
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** About Us page content.

#### Update About Us

```http
PUT /admin/about-us
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Permissions:** `manage_pages`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | ❌ | max:255 |
| `description` | string | ❌ | max:10000 |
| `mission` | string | ❌ | max:2000 |
| `vision` | string | ❌ | max:2000 |
| `image` | file | ❌ | image, max:5120 |

**Response (200):** Updated content.

</details>

---

### 🌟 Success Stories Management

<details>
<summary><strong>Success Stories Endpoints</strong></summary>

#### List Stories

```http
GET /admin/success-stories
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** Paginated stories.

#### Create Story

```http
POST /admin/success-stories
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Permissions:** `manage_pages`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `patient_name` | string | ✅ | max:255 |
| `story` | string | ✅ | max:5000 |
| `life_stage_id` | integer| ❌ | exists:life_stages,id |
| `image` | file | ❌ | image, max:2048 |
| `is_featured` | boolean | ❌ | default: false |
| `is_active` | boolean | ❌ | default: true |
| `order` | integer | ❌ | min:0 |

**Response (201):** Created story resource.

#### Reorder Stories

```http
PUT /admin/success-stories/reorder
Authorization: Bearer <token>
Content-Type: application/json
```
**Permissions:** `manage_pages`

| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `ordered_ids` | array | ✅ | array of story IDs |

**Response (200):** `{ "status": true, "message": "تم إعادة ترتيب القصص" }`

#### Show Story

```http
GET /admin/success-stories/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** Full story details.

#### Update Story

```http
PUT /admin/success-stories/{id}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```
**Permissions:** `manage_pages`

*(Same request body as Create Story)*

#### Toggle Featured

```http
PUT /admin/success-stories/{id}/featured
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** `{ "status": true, "data": { "is_featured": true } }`

#### Toggle Active

```http
PUT /admin/success-stories/{id}/active
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** `{ "status": true, "data": { "is_active": false } }`

#### Delete Story

```http
DELETE /admin/success-stories/{id}
Authorization: Bearer <token>
```
**Permissions:** `manage_pages`

**Response (200):** `{ "status": true, "message": "تم حذف القصة بنجاح" }`

</details>

---

## ❌ Error Codes

| HTTP Code | Meaning              | Description                         |
| --------- | -------------------- | ----------------------------------- |
| `200`     | ✅ OK                | Request successful                  |
| `201`     | ✅ Created           | Resource created successfully       |
| `400`     | ❌ Bad Request       | Invalid input or validation error   |
| `401`     | 🔒 Unauthorized      | Missing or invalid token            |
| `403`     | 🚫 Forbidden         | Insufficient permissions            |
| `404`     | 🔍 Not Found         | Resource not found                  |
| `409`     | ⚠️ Conflict          | Resource conflict (e.g., duplicate) |
| `422`     | 📋 Unprocessable     | Validation errors                   |
| `429`     | ⏰ Too Many Requests | Rate limit exceeded                 |
| `500`     | 💥 Server Error      | Internal server error               |

### Validation Error Format (422)

```json
{
  "status": false,
  "message": "The given data was invalid.",
  "errors": {
    "email": [
      "The email field is required.",
      "The email must be a valid email address."
    ],
    "password": ["The password field must be at least 8 characters."]
  }
}
```

---

<p align="center">
  <strong>📡 Total API Endpoints: 150+</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-❤️-E91E8C?style=for-the-badge" alt="Made with love" />
  <img src="https://img.shields.io/badge/Widad-Health%20Platform-FF69B4?style=for-the-badge" alt="Widad" />
</p>
