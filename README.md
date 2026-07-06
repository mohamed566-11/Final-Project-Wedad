<p align="center">
  <img src="https://img.shields.io/badge/Widad-Health%20Platform-E91E8C?style=for-the-badge&logo=heart&logoColor=white" alt="Widad Health Platform" />
</p>

<h1 align="center">🌸 Widad Health Platform</h1>

<p align="center">
  <strong>منصة صحية شاملة متخصصة في صحة المرأة</strong><br/>
  <em>A comprehensive women's health platform with telemedicine, health tracking, and AI-powered insights</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/PHP-8.2+-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" alt="Status" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**Widad** (وداد) is a full-stack women's health platform designed to provide comprehensive healthcare services including telemedicine consultations, health tracking, medical articles, and AI-powered health insights. The platform connects patients with specialized doctors and provides tools for tracking various health metrics.

The platform supports three user roles: **Patients**, **Doctors**, and **Admins**, each with dedicated dashboards and features.

---

## ✨ Features

### 👩‍⚕️ For Patients

| Feature                   | Description                                                              |
| ------------------------- | ------------------------------------------------------------------------ |
| 🔐 **Authentication**     | Secure registration, login, email verification, OTP-based password reset |
| 📊 **Dashboard**          | Personalized health dashboard with summaries and quick actions           |
| 👤 **Profile Management** | Complete medical profile, emergency contacts, and health information     |
| 📅 **Consultations**      | Book, manage, and attend video consultations with doctors                |
| 💊 **Prescriptions**      | View and download prescriptions from consultations                       |
| ⭐ **Doctor Reviews**     | Rate and review doctors after consultations                              |
| 💳 **Payments**           | Secure payment integration via Paymob                                    |

### 📱 Health Trackers

| Tracker                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| 😊 **Mood Tracker**      | Track daily mood patterns and emotional wellbeing  |
| ⚖️ **Weight Tracker**    | Monitor weight changes with visual charts          |
| 🔴 **Period Tracker**    | Track menstrual cycles and symptoms                |
| 🌸 **Fertility Tracker** | Monitor fertility windows and ovulation            |
| 🤰 **Pregnancy Tracker** | Track pregnancy milestones, kicks, and medications |

### 👨‍⚕️ For Doctors

| Feature                    | Description                                        |
| -------------------------- | -------------------------------------------------- |
| 📋 **Dashboard**           | Analytics, stats, and chart data for consultations |
| 🕐 **Working Hours**       | Manage availability and working schedule           |
| 👥 **Patient Management**  | View patient history and medical records           |
| 📹 **Video Consultations** | Conduct video calls via Google Meet integration    |
| ✍️ **Articles**            | Create and publish health articles                 |
| 💰 **Financials**          | Track earnings, payouts, and financial history     |
| ⭐ **Reviews**             | View patient reviews and ratings                   |
| 🔗 **Google Connect**      | Integration with Google Calendar & Meet            |

### 🛠️ For Admins

| Feature                | Description                                         |
| ---------------------- | --------------------------------------------------- |
| 📊 **Dashboard**       | Platform-wide statistics, alerts, and activity logs |
| 👥 **User Management** | Manage patients, doctors, and admin accounts        |
| ✅ **Join Requests**   | Review and approve doctor registration requests     |
| 📋 **Consultations**   | Monitor all consultations across the platform       |
| 💰 **Financials**      | Platform financial overview and payout management   |
| 📈 **Analytics**       | Comprehensive platform analytics and reports        |
| 📰 **Articles**        | Review, approve, and manage health articles         |
| 📬 **Messages**        | Handle contact form messages                        |
| 🔔 **Notifications**   | Send and manage platform notifications              |
| ⚙️ **Settings**        | Site settings, FAQs, about us, terms & privacy      |

### 🌐 Public Pages

- 🏠 **Landing Page** — Dynamic landing with stats, features, testimonials
- 📖 **Articles** — Browse health articles by tags
- 👩‍⚕️ **Doctors Directory** — Search and view doctor profiles
- ❓ **FAQs** — Frequently asked questions
- 📞 **Contact Us** — Contact form
- 🤝 **Join as Doctor** — Doctor registration request
- 🌿 **Life Stages** — Women's health life stages information
- 🌟 **Success Stories** — Patient success stories
- 📄 **Terms & Privacy** — Legal pages

---

## 🛠️ Tech Stack

### Front-End

| Technology                    | Purpose                           |
| ----------------------------- | --------------------------------- |
| **React 19**                  | UI library with latest features   |
| **TypeScript 5.9**            | Type-safe development             |
| **Vite 7**                    | Lightning-fast build tool         |
| **TailwindCSS 3.4**           | Utility-first CSS framework       |
| **Radix UI**                  | Accessible component primitives   |
| **React Router 7**            | Client-side routing               |
| **TanStack Query 5**          | Server state management & caching |
| **React Hook Form + Zod/Yup** | Form handling & validation        |
| **Framer Motion**             | Animations & transitions          |
| **Recharts**                  | Data visualization & charts       |
| **TipTap**                    | Rich text editor for articles     |
| **Axios**                     | HTTP client                       |
| **Sonner**                    | Toast notifications               |
| **PWA**                       | Progressive Web App support       |

### Back-End

| Technology            | Purpose                            |
| --------------------- | ---------------------------------- |
| **Laravel 12**        | PHP framework                      |
| **PHP 8.2+**          | Server-side language               |
| **Laravel Sanctum**   | API token authentication           |
| **MySQL**             | Relational database                |
| **Redis**             | Caching & queues                   |
| **Predis**            | Redis PHP client                   |
| **Laravel OTP**       | One-time password verification     |
| **Paymob**            | Payment gateway integration        |
| **Google API Client** | Google Meet & Calendar integration |
| **Web Push**          | Push notifications                 |
| **Pest**              | Testing framework                  |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser/PWA)                  │
│              React + TypeScript + TailwindCSS            │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS / REST API
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   Laravel API (Back-End)                 │
│         Sanctum Auth │ Rate Limiting │ CORS              │
├─────────────────────────────────────────────────────────┤
│  Controllers  │  Services  │  Resources  │  Middleware   │
├─────────────────────────────────────────────────────────┤
│      MySQL      │     Redis Cache     │    File Storage  │
└─────────────────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────────┐
    │  Paymob  │ │  Google  │ │  Web Push    │
    │ Payments │ │ Meet/Cal │ │ Notifications│
    └──────────┘ └──────────┘ └──────────────┘
```

### API Route Prefixes

| Prefix              | Description       |
| ------------------- | ----------------- |
| `/api/v1/patient/*` | Patient endpoints |
| `/api/v1/doctor/*`  | Doctor endpoints  |
| `/api/v1/admin/*`   | Admin endpoints   |
| `/api/v1/*`         | Public endpoints  |

---

## 🚀 Getting Started

### Prerequisites

- **PHP** >= 8.2
- **Composer** >= 2.x
- **Node.js** >= 18.x
- **Bun** (recommended) or npm
- **MySQL** >= 8.0
- **Redis** >= 6.0
- **Git**

### Installation

#### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/widad-health-platform.git
cd widad-health-platform
```

#### 2️⃣ Back-End Setup

```bash
cd Back-end

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your .env file with database credentials
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=widad_health
# DB_USERNAME=root
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Seed the database (optional)
php artisan db:seed

# Create storage link
php artisan storage:link

# Start the development server
php artisan serve
```

#### 3️⃣ Front-End Setup

```bash
cd Front-End

# Install dependencies (using Bun)
bun install

# Or using npm
npm install

# Start the development server
bun dev
# Or
npm run dev
```

#### 4️⃣ Run Everything Together (Back-End)

```bash
cd Back-end
composer dev
```

This command starts the Laravel server, queue listener, and Vite dev server concurrently.

### 🐳 Quick Start URLs

| Service      | URL                            |
| ------------ | ------------------------------ |
| Front-End    | `http://localhost:8080`        |
| Back-End API | `http://localhost:8000/api/v1` |

---

## 📁 Project Structure

```
widad-health-platform/
├── 📂 Back-end/                    # Laravel API
│   ├── 📂 app/
│   │   ├── 📂 Http/
│   │   │   ├── 📂 Controllers/Api/ # API Controllers
│   │   │   ├── 📂 Middleware/      # Custom middleware
│   │   │   ├── 📂 Requests/       # Form requests & validation
│   │   │   └── 📂 Resources/      # API resources (transformers)
│   │   ├── 📂 Models/             # Eloquent models (38+ models)
│   │   ├── 📂 Services/           # Business logic services
│   │   │   ├── ArticleService
│   │   │   ├── CacheService
│   │   │   ├── ConsultationService
│   │   │   ├── GoogleMeetService
│   │   │   ├── NotificationService
│   │   │   ├── PaymobService
│   │   │   ├── WebPushService
│   │   │   └── ZoomService
│   │   ├── 📂 Notifications/      # Notification classes
│   │   ├── 📂 Jobs/               # Queue jobs
│   │   └── 📂 Traits/             # Reusable traits
│   ├── 📂 config/                 # Configuration files
│   ├── 📂 database/
│   │   ├── 📂 migrations/         # 50+ migration files
│   │   ├── 📂 factories/          # Model factories
│   │   └── 📂 seeders/            # Database seeders
│   ├── 📂 routes/
│   │   ├── admin.php              # Admin API routes
│   │   ├── doctor.php             # Doctor API routes
│   │   ├── patient.php            # Patient API routes
│   │   └── public.php             # Public API routes
│   └── 📂 tests/                  # Pest tests
│
├── 📂 Front-End/                   # React SPA
│   ├── 📂 public/                 # Static assets & PWA files
│   ├── 📂 src/
│   │   ├── 📂 components/         # Reusable UI components
│   │   │   ├── 📂 admin/          # Admin panel components
│   │   │   ├── 📂 auth/           # Authentication components
│   │   │   ├── 📂 doctor/         # Doctor portal components
│   │   │   ├── 📂 landing/        # Landing page sections
│   │   │   ├── 📂 layout/         # Layout components
│   │   │   ├── 📂 profile/        # Patient profile components
│   │   │   └── 📂 ui/             # Shadcn/UI components
│   │   ├── 📂 contexts/           # React context providers
│   │   ├── 📂 hooks/              # Custom React hooks
│   │   ├── 📂 pages/
│   │   │   ├── 📂 admin/          # Admin pages
│   │   │   ├── 📂 doctor/         # Doctor pages
│   │   │   ├── 📂 patient/        # Patient pages
│   │   │   ├── 📂 landing/        # Landing page
│   │   │   ├── 📂 public/         # Public pages
│   │   │   └── 📂 articles/       # Article pages
│   │   ├── 📂 lib/                # Utilities & helpers
│   │   └── 📂 providers/          # App providers
│   └── 📂 prompts/                # AI system prompts
│
└── 📄 README.md                    # This file
```

---

## 📡 API Documentation

> 📖 **Full API Documentation:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for the complete API reference with 150+ endpoints, request/response examples, and validation rules.

### Authentication

All protected endpoints require a Bearer token via Laravel Sanctum:

```
Authorization: Bearer <token>
```

### Key Endpoints

<details>
<summary><strong>🔐 Patient Auth</strong></summary>

| Method | Endpoint                            | Description            |
| ------ | ----------------------------------- | ---------------------- |
| `POST` | `/api/v1/patient/auth/register`     | Register new patient   |
| `POST` | `/api/v1/patient/auth/login`        | Patient login          |
| `POST` | `/api/v1/patient/auth/logout`       | Patient logout         |
| `POST` | `/api/v1/patient/auth/email/verify` | Verify email with OTP  |
| `POST` | `/api/v1/patient/password/email`    | Request password reset |
| `POST` | `/api/v1/patient/password/reset`    | Reset password         |

</details>

<details>
<summary><strong>👤 Patient Profile & Trackers</strong></summary>

| Method     | Endpoint                    | Description         |
| ---------- | --------------------------- | ------------------- |
| `GET`      | `/api/v1/patient/profile`   | Get patient profile |
| `PUT`      | `/api/v1/patient/profile`   | Update profile      |
| `GET/POST` | `/api/v1/patient/mood`      | Mood tracker        |
| `GET/POST` | `/api/v1/patient/weight`    | Weight tracker      |
| `GET/POST` | `/api/v1/patient/period`    | Period tracker      |
| `GET/POST` | `/api/v1/patient/fertility` | Fertility tracker   |
| `GET/POST` | `/api/v1/patient/pregnancy` | Pregnancy tracker   |

</details>

<details>
<summary><strong>👨‍⚕️ Doctor Portal</strong></summary>

| Method    | Endpoint                                     | Description           |
| --------- | -------------------------------------------- | --------------------- |
| `POST`    | `/api/v1/doctor/auth/register`               | Doctor registration   |
| `POST`    | `/api/v1/doctor/auth/login`                  | Doctor login          |
| `GET`     | `/api/v1/doctor/dashboard/stats`             | Dashboard statistics  |
| `GET/PUT` | `/api/v1/doctor/profile`                     | Profile management    |
| `GET/PUT` | `/api/v1/doctor/working-hours`               | Working hours         |
| `GET`     | `/api/v1/doctor/consultations`               | List consultations    |
| `PUT`     | `/api/v1/doctor/consultations/{id}/complete` | Complete consultation |

</details>

<details>
<summary><strong>🛡️ Admin Panel</strong></summary>

| Method | Endpoint                        | Description        |
| ------ | ------------------------------- | ------------------ |
| `POST` | `/api/v1/admin/auth/login`      | Admin login        |
| `GET`  | `/api/v1/admin/dashboard/stats` | Dashboard stats    |
| `GET`  | `/api/v1/admin/patients`        | List patients      |
| `GET`  | `/api/v1/admin/doctors`         | List doctors       |
| `GET`  | `/api/v1/admin/consultations`   | All consultations  |
| `GET`  | `/api/v1/admin/analytics`       | Platform analytics |

</details>

<details>
<summary><strong>🌐 Public Endpoints</strong></summary>

| Method | Endpoint                  | Description       |
| ------ | ------------------------- | ----------------- |
| `GET`  | `/api/v1/landing-page`    | Landing page data |
| `GET`  | `/api/v1/articles`        | List articles     |
| `GET`  | `/api/v1/articles/{slug}` | Article detail    |
| `GET`  | `/api/v1/about-us`        | About us page     |
| `GET`  | `/api/v1/faqs`            | FAQs              |
| `POST` | `/api/v1/contact-us`      | Contact form      |
| `GET`  | `/api/v1/life-stages`     | Life stages       |
| `GET`  | `/api/v1/search`          | Global search     |

</details>

---

## 🖼️ Screenshots

> 📸 Add screenshots of your application here

| Page              | Screenshot    |
| ----------------- | ------------- |
| Landing Page      | _Coming soon_ |
| Patient Dashboard | _Coming soon_ |
| Doctor Portal     | _Coming soon_ |
| Admin Panel       | _Coming soon_ |
| Health Trackers   | _Coming soon_ |

---

## 🔐 Environment Variables

### Back-End (`.env`)

```env
# Application
APP_NAME="Widad Health"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=widad_health
DB_USERNAME=root
DB_PASSWORD=

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:8080

# Mail
MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=

# Paymob Payment
PAYMOB_API_KEY=
PAYMOB_INTEGRATION_ID=
PAYMOB_HMAC_SECRET=

# Google API (Meet & Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=

# Web Push (VAPID Keys)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Frontend URL
FRONTEND_URL=http://localhost:8080
```

---

## 🧪 Testing

### Back-End Tests (Pest)

```bash
cd Back-end

# Run all tests
php artisan test

# Run with coverage
php artisan test --coverage
```

### Front-End Tests (Vitest)

```bash
cd Front-End

# Run tests
bun test
# or
npm run test

# Run in watch mode
bun test:watch
# or
npm run test:watch
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **Front-End**: ESLint + TypeScript strict mode
- **Back-End**: Laravel Pint (PSR-12)

---

## 📊 Database Schema

The platform includes **50+ database migrations** covering:

- 👤 Users & Profiles (patients, doctors, admins)
- 🏥 Consultations & Reviews
- 💳 Payments & Payouts
- 📊 Health Trackers (mood, weight, period, fertility, pregnancy)
- 📰 Articles & Content
- 🤖 AI/ML Predictions (preeclampsia, gestational diabetes, preterm birth)
- 🔔 Notifications & Push Subscriptions
- ⚙️ Settings & Configuration

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

<p align="center">
  <em>Built with ❤️ by the Widad Health Team</em>
</p>

---

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-❤️-E91E8C?style=for-the-badge" alt="Made with love" />
  <img src="https://img.shields.io/badge/For-Women's%20Health-FF69B4?style=for-the-badge" alt="For Women's Health" />
</p>
