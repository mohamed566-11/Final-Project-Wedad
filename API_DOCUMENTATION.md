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

**Response:** Paginated articles list

---

### Get Article Tags

```http
GET /patient/articles/tags
```

---

### Articles by Tag

```http
GET /patient/articles/tag/{tag}
```

---

### Article Detail

```http
GET /patient/articles/{slug}
```

---

### Doctor's Articles

```http
GET /patient/doctors/{doctorId}/articles
```

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
      /* PatientResource */
    },
    "token": "2|def456..."
  }
}
```

**Error (401):**

```json
{
  "status": false,
  "message": "Invalid credentials"
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

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `otp`      | string | ✅       |

</details>

<details>
<summary><strong>GET /patient/auth/email/send-again — Resend OTP</strong></summary>

```http
GET /patient/auth/email/send-again
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>POST /patient/password/email — Forgot Password (Send OTP)</strong></summary>

```http
POST /patient/password/email
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |

</details>

<details>
<summary><strong>POST /patient/password/reset — Reset Password</strong></summary>

```http
POST /patient/password/reset
Content-Type: application/json
```

| Body Param              | Type   | Required |
| ----------------------- | ------ | -------- |
| `email`                 | string | ✅       |
| `otp`                   | string | ✅       |
| `password`              | string | ✅       |
| `password_confirmation` | string | ✅       |

</details>

---

### 👤 Patient Profile

<details>
<summary><strong>GET /patient/data — Get Authenticated Patient</strong></summary>

```http
GET /patient/data
Authorization: Bearer <token>
```

**Response:** Full `PatientResource` with `lifeStage` and `profile` relations

</details>

<details>
<summary><strong>GET /patient/profile — View Profile</strong></summary>

```http
GET /patient/profile
Authorization: Bearer <token>
```

**Response:**

```json
{
  "data": {
    "user": {
      /* Full PatientResource */
    },
    "profile_completion": 80,
    "missing_fields": ["emergency_contact_name", "blood_type"]
  }
}
```

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

**Response:** Updated `PatientResource`

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

**Response:**

```json
{
  "data": {
    "profile_completion_percentage": 80,
    "missing_fields": [],
    "bmi": 22.5,
    "bmi_category": "normal",
    "health_score": 75,
    "last_updated": "2026-02-14T10:30:00Z"
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

</details>

<details>
<summary><strong>DELETE /patient/profile/image — Delete Profile Image</strong></summary>

```http
DELETE /patient/profile/image
Authorization: Bearer <token>
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

**Response:** Patient-specific dashboard data with summaries and quick actions

</details>

---

### 📱 Health Trackers

<details>
<summary><strong>GET /patient/trackers/summary — Trackers Summary</strong></summary>

```http
GET /patient/trackers/summary
Authorization: Bearer <token>
```

**Response:** Summary of all health trackers for the patient

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
| `specialization` | string  | ❌       | `gynecology`, `obstetrics`, `fertility`, `endocrinology`, `general_practitioner`, `pediatrics`, `nutrition`, `other` |
| `life_stage_id`  | integer | ❌       | exists in life_stages                                                                                                |
| `min_price`      | numeric | ❌       | min:0                                                                                                                |
| `max_price`      | numeric | ❌       | min:0, gte:min_price                                                                                                 |
| `min_rating`     | numeric | ❌       | min:1, max:5                                                                                                         |
| `languages`      | array   | ❌       | `ar`, `en`                                                                                                           |
| `session_type`   | string  | ❌       | `video`, `offline`, `both`                                                                                           |
| `availability`   | string  | ❌       | `today`, `this_week`, `this_month`                                                                                   |
| `sort_by`        | string  | ❌       | `rating`, `price_low`, `price_high`, `experience`, `consultations`                                                   |
| `page`           | integer | ❌       | min:1                                                                                                                |
| `per_page`       | integer | ❌       | min:1, max:50                                                                                                        |

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

#### Mark as Read

```http
POST /patient/notifications/{id}/read
Authorization: Bearer <token>
```

#### Mark All as Read

```http
POST /patient/notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification

```http
DELETE /patient/notifications/{id}
Authorization: Bearer <token>
```

#### Get Unread Count

```http
GET /patient/notifications/unread-count
Authorization: Bearer <token>
```

#### Get Notification Settings

```http
GET /patient/notifications/settings
Authorization: Bearer <token>
```

#### Update Notification Settings

```http
PUT /patient/notifications/settings
Authorization: Bearer <token>
```

#### Get VAPID Public Key (Web Push)

```http
GET /patient/notifications/vapid-key
Authorization: Bearer <token>
```

#### Subscribe to Push Notifications

```http
POST /patient/notifications/subscribe
Authorization: Bearer <token>
```

#### Unsubscribe from Push Notifications

```http
POST /patient/notifications/unsubscribe
Authorization: Bearer <token>
```

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

> ⚠️ Rate limited. Doctor needs admin approval after registration.

**Response (201):** Doctor resource + token

</details>

<details>
<summary><strong>POST /doctor/auth/login — Doctor Login</strong></summary>

```http
POST /doctor/auth/login
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Response (200):** Doctor resource + token

</details>

<details>
<summary><strong>POST /doctor/auth/logout — Logout</strong></summary>

```http
POST /doctor/auth/logout
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>POST /doctor/auth/logout/all — Logout All Devices</strong></summary>

```http
POST /doctor/auth/logout/all
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>POST /doctor/password/email — Forgot Password</strong></summary>

```http
POST /doctor/password/email
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |

</details>

<details>
<summary><strong>POST /doctor/password/reset — Reset Password</strong></summary>

```http
POST /doctor/password/reset
Content-Type: application/json
```

| Body Param              | Type   | Required |
| ----------------------- | ------ | -------- |
| `email`                 | string | ✅       |
| `otp`                   | string | ✅       |
| `password`              | string | ✅       |
| `password_confirmation` | string | ✅       |

</details>

---

### 📊 Doctor Dashboard

<details>
<summary><strong>GET /doctor/data — Get Authenticated Doctor</strong></summary>

```http
GET /doctor/data
Authorization: Bearer <token>
```

**Response:** Full `DoctorResource`

</details>

<details>
<summary><strong>GET /doctor/dashboard/stats — Dashboard Stats</strong></summary>

```http
GET /doctor/dashboard/stats
Authorization: Bearer <token>
```

**Response:** Dashboard statistics (consultations, earnings, ratings, etc.)

</details>

<details>
<summary><strong>GET /doctor/dashboard/chart-data — Chart Data</strong></summary>

```http
GET /doctor/dashboard/chart-data
Authorization: Bearer <token>
```

**Response:** Chart data for dashboard visualizations

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

| Body Param           | Type    | Required | Rules                      |
| -------------------- | ------- | -------- | -------------------------- |
| `name`               | string  | ❌       | max:255                    |
| `phone`              | string  | ❌       | Egyptian mobile, unique    |
| `age`                | integer | ❌       | min:25, max:80             |
| `image`              | file    | ❌       | jpeg,png,jpg — max:2MB     |
| `bio`                | string  | ❌       | max:1000                   |
| `consultation_price` | numeric | ❌       | min:50, max:5000 (EGP)     |
| `session_type`       | string  | ❌       | `video`, `offline`, `both` |
| `languages`          | array   | ❌       | `ar`, `en`, `fr`           |
| `clinic_address`     | string  | ❌       | max:500                    |
| `life_stage_ids`     | array   | ❌       | must exist in life_stages  |

**Response:** Updated `DoctorResource`

</details>

<details>
<summary><strong>PUT /doctor/profile/availability — Toggle Availability</strong></summary>

```http
PUT /doctor/profile/availability
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param     | Type    | Required |
| -------------- | ------- | -------- |
| `is_available` | boolean | ✅       |

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

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/confirm — Confirm Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/confirm
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>PUT /doctor/consultations/{id}/start — Start Consultation</strong></summary>

```http
PUT /doctor/consultations/{id}/start
Authorization: Bearer <token>
```

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

**Response:** List of patients who had consultations with this doctor

</details>

<details>
<summary><strong>GET /doctor/patients/{id} — Patient Detail</strong></summary>

```http
GET /doctor/patients/{id}
Authorization: Bearer <token>
```

</details>

<details>
<summary><strong>POST /doctor/patients/{id}/notes — Add Patient Note</strong></summary>

```http
POST /doctor/patients/{id}/notes
Authorization: Bearer <token>
Content-Type: application/json
```

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `note`     | string | ✅       |

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

#### Create Article

```http
POST /doctor/articles
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Get Article

```http
GET /doctor/articles/{id}
Authorization: Bearer <token>
```

#### Update Article

```http
PUT /doctor/articles/{id}
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Submit for Review

```http
PUT /doctor/articles/{id}/submit
Authorization: Bearer <token>
```

#### Delete Article

```http
DELETE /doctor/articles/{id}
Authorization: Bearer <token>
```

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

#### Transaction History

```http
GET /doctor/financials/transactions
Authorization: Bearer <token>
```

#### Payout History

```http
GET /doctor/financials/payouts
Authorization: Bearer <token>
```

#### Request Payout

```http
POST /doctor/financials/request-payout
Authorization: Bearer <token>
```

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

| Body Param | Type   | Required |
| ---------- | ------ | -------- |
| `email`    | string | ✅       |
| `password` | string | ✅       |

**Response:** Admin resource + token

#### Logout

```http
POST /admin/auth/logout
Authorization: Bearer <token>
```

#### Logout All Devices

```http
POST /admin/auth/logout/all
Authorization: Bearer <token>
```

#### Forgot Password

```http
POST /admin/password/email
```

#### Reset Password

```http
POST /admin/password/reset
```

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

#### Dashboard Stats

```http
GET /admin/dashboard/stats
Authorization: Bearer <token>
```

#### Recent Activity

```http
GET /admin/dashboard/recent-activity
Authorization: Bearer <token>
```

#### Alerts

```http
GET /admin/dashboard/alerts
Authorization: Bearer <token>
```

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

#### Get Life Stages

```http
GET /admin/patients/life-stages
Authorization: Bearer <token>
```

#### Show Patient

```http
GET /admin/patients/{id}
Authorization: Bearer <token>
```

#### Toggle Patient Status

```http
PUT /admin/patients/{id}/toggle-status
Authorization: Bearer <token>
```

#### Delete Patient

```http
DELETE /admin/patients/{id}
Authorization: Bearer <token>
```

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

#### Get Specializations

```http
GET /admin/doctors/specializations
Authorization: Bearer <token>
```

#### Show Doctor

```http
GET /admin/doctors/{id}
Authorization: Bearer <token>
```

#### Verify Doctor

```http
PUT /admin/doctors/{id}/verify
Authorization: Bearer <token>
```

#### Reject Doctor

```http
PUT /admin/doctors/{id}/reject
Authorization: Bearer <token>
```

#### Toggle Doctor Status

```http
PUT /admin/doctors/{id}/toggle-status
Authorization: Bearer <token>
```

#### Delete Doctor

```http
DELETE /admin/doctors/{id}
Authorization: Bearer <token>
```

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

#### Get Roles

```http
GET /admin/admins/roles
Authorization: Bearer <token>
```

#### Show Admin

```http
GET /admin/admins/{id}
Authorization: Bearer <token>
```

#### Create Admin

```http
POST /admin/admins
Authorization: Bearer <token>
Content-Type: application/json
```

#### Update Admin

```http
PUT /admin/admins/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

#### Toggle Admin Status

```http
PUT /admin/admins/{id}/toggle-status
Authorization: Bearer <token>
```

#### Delete Admin

```http
DELETE /admin/admins/{id}
Authorization: Bearer <token>
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

#### Get Statistics

```http
GET /admin/consultations/stats
Authorization: Bearer <token>
```

#### Show Consultation

```http
GET /admin/consultations/{id}
Authorization: Bearer <token>
```

#### Cancel Consultation

```http
PUT /admin/consultations/{id}/cancel
Authorization: Bearer <token>
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

#### List Transactions

```http
GET /admin/financials/transactions
Authorization: Bearer <token>
```

#### Show Transaction

```http
GET /admin/financials/transactions/{id}
Authorization: Bearer <token>
```

#### Refund Transaction

```http
POST /admin/financials/transactions/{id}/refund
Authorization: Bearer <token>
```

#### Financial Reports

```http
GET /admin/financials/reports
Authorization: Bearer <token>
```

#### List Payout Requests

```http
GET /admin/financials/payouts
Authorization: Bearer <token>
```

#### Show Payout Request

```http
GET /admin/financials/payouts/{id}
Authorization: Bearer <token>
```

#### Process Payout

```http
PUT /admin/financials/payouts/{id}/process
Authorization: Bearer <token>
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

#### Show Article

```http
GET /admin/articles/{id}
Authorization: Bearer <token>
```

#### Approve Article

```http
PUT /admin/articles/{id}/approve
Authorization: Bearer <token>
```

#### Reject Article

```http
PUT /admin/articles/{id}/reject
Authorization: Bearer <token>
```

#### Archive Article

```http
PUT /admin/articles/{id}/archive
Authorization: Bearer <token>
```

#### Restore Article

```http
PUT /admin/articles/{id}/restore
Authorization: Bearer <token>
```

#### Delete Article

```http
DELETE /admin/articles/{id}
Authorization: Bearer <token>
```

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

#### Show Message

```http
GET /admin/contact-messages/{id}
Authorization: Bearer <token>
```

#### Mark as Read

```http
PUT /admin/contact-messages/{id}/mark-read
Authorization: Bearer <token>
```

#### Mark as Unread

```http
PUT /admin/contact-messages/{id}/mark-unread
Authorization: Bearer <token>
```

#### Mark All as Read

```http
PUT /admin/contact-messages/mark-all-read
Authorization: Bearer <token>
```

#### Delete Message

```http
DELETE /admin/contact-messages/{id}
Authorization: Bearer <token>
```

#### Bulk Delete

```http
DELETE /admin/contact-messages/bulk-delete
Authorization: Bearer <token>
```

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

#### Notification History

```http
GET /admin/notifications/history
Authorization: Bearer <token>
```

#### Scheduled Notifications

```http
GET /admin/notifications/scheduled
Authorization: Bearer <token>
```

#### Cancel Scheduled

```http
DELETE /admin/notifications/scheduled/{id}
Authorization: Bearer <token>
```

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

#### Users Analytics

```http
GET /admin/analytics/users
Authorization: Bearer <token>
```

#### Consultations Analytics

```http
GET /admin/analytics/consultations
Authorization: Bearer <token>
```

#### Financial Analytics

```http
GET /admin/analytics/financials
Authorization: Bearer <token>
```

#### Articles Analytics

```http
GET /admin/analytics/articles
Authorization: Bearer <token>
```

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

#### Update Site Settings

```http
PUT /admin/settings/site
Authorization: Bearer <token>
Content-Type: application/json
```

#### Get Roles

```http
GET /admin/settings/roles
Authorization: Bearer <token>
```

#### Create Role

```http
POST /admin/settings/roles
Authorization: Bearer <token>
Content-Type: application/json
```

#### Update Role

```http
PUT /admin/settings/roles/{id}
Authorization: Bearer <token>
```

#### Delete Role

```http
DELETE /admin/settings/roles/{id}
Authorization: Bearer <token>
```

#### Get System Settings

```http
GET /admin/settings/system
Authorization: Bearer <token>
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

#### Create FAQ

```http
POST /admin/faqs
Authorization: Bearer <token>
Content-Type: application/json
```

#### Reorder FAQs

```http
PUT /admin/faqs/reorder
Authorization: Bearer <token>
```

#### Show FAQ

```http
GET /admin/faqs/{id}
Authorization: Bearer <token>
```

#### Update FAQ

```http
PUT /admin/faqs/{id}
Authorization: Bearer <token>
```

#### Toggle FAQ Active

```http
PUT /admin/faqs/{id}/toggle
Authorization: Bearer <token>
```

#### Delete FAQ

```http
DELETE /admin/faqs/{id}
Authorization: Bearer <token>
```

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

#### Update About Us

```http
PUT /admin/about-us
Authorization: Bearer <token>
Content-Type: application/json
```

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

#### Create Story

```http
POST /admin/success-stories
Authorization: Bearer <token>
Content-Type: application/json
```

#### Reorder Stories

```http
PUT /admin/success-stories/reorder
Authorization: Bearer <token>
```

#### Show Story

```http
GET /admin/success-stories/{id}
Authorization: Bearer <token>
```

#### Update Story

```http
PUT /admin/success-stories/{id}
Authorization: Bearer <token>
```

#### Toggle Featured

```http
PUT /admin/success-stories/{id}/featured
Authorization: Bearer <token>
```

#### Toggle Active

```http
PUT /admin/success-stories/{id}/active
Authorization: Bearer <token>
```

#### Delete Story

```http
DELETE /admin/success-stories/{id}
Authorization: Bearer <token>
```

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
