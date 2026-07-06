# Health Trackers System - Full Stack Development Prompt
## منصة وداد الصحية - نظام المتتبعات الصحية

---

## 📋 Overview - نظرة عامة

هذا البرمبت لبناء **نظام المتتبعات الصحية الكامل** في منصة وداد الصحية، يشمل:
- متتبع المزاج (Mood Tracker)
- متتبع الوزن (Weight Tracker)
- متتبع الدورة الشهرية (Period Tracker)
- متتبع الخصوبة (Fertility Tracker)

---

## 🎯 Project Context - السياق

### الأجزاء المكتملة:
✅ نظام المصادقة (Authentication)
✅ نظام الملف الشخصي (Patient Profile)

### الجزء المطلوب بناؤه:
🔨 **أنظمة التتبع الصحي الأربعة**

---

## 🗄️ Database Schema (Already Exists - للمراجعة)

### 1. mood_entries
```sql
- id
- patient_id (FK → patients.id)
- mood (enum: 'very_bad', 'bad', 'neutral', 'good', 'very_good')
- notes (text, nullable)
- factors (json, nullable) - sleep, stress, exercise, etc.
- entry_date (date)
- entry_time (time)
- timestamps
- unique(patient_id, entry_date)
- index(patient_id, entry_date)
```

### 2. weight_entries
```sql
- id
- patient_id (FK → patients.id)
- weight (decimal 5,2) - kg
- height (decimal 5,2, nullable) - cm
- bmi (decimal 4,2, nullable)
- entry_date (date)
- entry_time (time)
- notes (text, nullable)
- timestamps
- index(patient_id, entry_date)
```

### 3. period_cycles
```sql
- id
- patient_id (FK → patients.id)
- start_date (date)
- end_date (date, nullable)
- cycle_length (integer, nullable)
- period_length (integer, nullable)
- flow (enum: 'light', 'medium', 'heavy', nullable)
- symptoms (json, nullable) - cramps, mood_swings, headache, etc.
- notes (text, nullable)
- is_predicted (boolean, default: false)
- timestamps
- index(patient_id, start_date)
```

### 4. fertility_entries
```sql
- id
- patient_id (FK → patients.id)
- entry_date (date)
- bbt (decimal 4,2, nullable) - Basal Body Temperature
- cervical_mucus (enum: 'dry', 'sticky', 'creamy', 'watery', 'egg_white', nullable)
- ovulation_test_positive (boolean, default: false)
- intercourse (boolean, default: false)
- notes (text, nullable)
- timestamps
- unique(patient_id, entry_date)
```

---

## 🔨 Backend API Endpoints

### 📊 Mood Tracker Endpoints

#### **POST /api/v1/patient/mood**
إضافة تسجيل مزاج جديد
```
Headers: Authorization: Bearer {token}
Middlewares: auth:patient, PatientStatus, PatientEmailVerify

Request Body:
{
  "mood": "good", // required, enum
  "notes": "شعرت بتحسن اليوم", // optional
  "factors": { // optional
    "sleep_hours": 8,
    "stress_level": "low",
    "exercise": true,
    "social_interaction": true
  },
  "entry_date": "2026-01-30", // optional, defaults to today
  "entry_time": "14:30" // optional, defaults to now
}

Validation:
- mood: required|in:very_bad,bad,neutral,good,very_good
- notes: nullable|string|max:1000
- factors: nullable|array
- entry_date: nullable|date|before_or_equal:today
- entry_time: nullable|date_format:H:i

Response (201):
{
  "status": true,
  "message": "Mood entry added successfully",
  "data": {
    "id": 1,
    "mood": "good",
    "mood_emoji": "😊",
    "notes": "شعرت بتحسن اليوم",
    "factors": {...},
    "entry_date": "2026-01-30",
    "entry_time": "14:30",
    "created_at": "2026-01-30 14:30:00"
  }
}
```

#### **GET /api/v1/patient/mood**
جلب تسجيلات المزاج
```
Query Parameters:
- date: optional, specific date (YYYY-MM-DD)
- month: optional, month (YYYY-MM)
- start_date: optional
- end_date: optional
- limit: optional, default: 30
- page: optional, default: 1

Response (200):
{
  "status": true,
  "message": "Mood entries retrieved successfully",
  "data": {
    "entries": [
      {
        "id": 1,
        "mood": "good",
        "mood_emoji": "😊",
        "mood_label": "جيد",
        "notes": "...",
        "factors": {...},
        "entry_date": "2026-01-30",
        "entry_time": "14:30"
      }
    ],
    "pagination": {
      "total": 45,
      "per_page": 30,
      "current_page": 1,
      "last_page": 2
    }
  }
}
```

#### **GET /api/v1/patient/mood/analytics**
تحليلات المزاج
```
Query Parameters:
- period: optional, enum: 'week', 'month', 'year' (default: 'month')

Response (200):
{
  "status": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "period": "month",
    "date_range": {
      "start": "2026-01-01",
      "end": "2026-01-30"
    },
    "mood_distribution": {
      "very_good": 10,
      "good": 12,
      "neutral": 5,
      "bad": 2,
      "very_bad": 1
    },
    "mood_percentages": {
      "very_good": 33.3,
      "good": 40.0,
      "neutral": 16.7,
      "bad": 6.7,
      "very_bad": 3.3
    },
    "average_mood_score": 4.1,
    "most_common_mood": "good",
    "mood_trend": "improving", // improving, declining, stable
    "factors_analysis": {
      "sleep_impact": "positive",
      "stress_impact": "negative",
      "exercise_impact": "positive"
    },
    "insights": [
      "مزاجك يتحسن تدريجيًا هذا الشهر",
      "النوم الجيد يؤثر إيجابيًا على مزاجك"
    ]
  }
}
```

#### **PUT /api/v1/patient/mood/{id}**
تحديث تسجيل مزاج

#### **DELETE /api/v1/patient/mood/{id}**
حذف تسجيل مزاج

---

### ⚖️ Weight Tracker Endpoints

#### **POST /api/v1/patient/weight**
إضافة تسجيل وزن جديد
```
Request Body:
{
  "weight": 65.5, // required, numeric, min:30, max:300
  "height": 170, // optional, numeric, min:100, max:250
  "notes": "بعد الرياضة", // optional
  "entry_date": "2026-01-30", // optional
  "entry_time": "08:00" // optional
}

Response (201):
{
  "status": true,
  "message": "Weight entry added successfully",
  "data": {
    "id": 1,
    "weight": 65.5,
    "height": 170,
    "bmi": 22.49,
    "bmi_category": "Normal",
    "notes": "بعد الرياضة",
    "entry_date": "2026-01-30",
    "entry_time": "08:00",
    "weight_change": "+0.5", // compared to last entry
    "created_at": "2026-01-30 08:00:00"
  }
}
```

#### **GET /api/v1/patient/weight**
جلب تسجيلات الوزن
```
Query Parameters:
- period: week, month, 3months, 6months, year, all
- limit: default 50

Response (200):
{
  "status": true,
  "message": "Weight entries retrieved successfully",
  "data": {
    "entries": [...],
    "stats": {
      "current_weight": 65.5,
      "starting_weight": 68.0,
      "total_change": -2.5,
      "average_weight": 66.2,
      "min_weight": 64.8,
      "max_weight": 68.0,
      "trend": "decreasing"
    }
  }
}
```

#### **GET /api/v1/patient/weight/chart**
بيانات الرسم البياني
```
Query Parameters:
- period: week, month, 3months, 6months, year

Response (200):
{
  "status": true,
  "data": {
    "chart_data": [
      {
        "date": "2026-01-01",
        "weight": 68.0,
        "bmi": 23.5
      },
      {
        "date": "2026-01-15",
        "weight": 66.5,
        "bmi": 23.0
      }
    ],
    "goal": 65.0, // if user set a goal
    "progress_percentage": 75
  }
}
```

#### **PUT /api/v1/patient/weight/{id}**
تحديث تسجيل وزن

#### **DELETE /api/v1/patient/weight/{id}**
حذف تسجيل وزن

---

### 🩸 Period Tracker Endpoints

#### **POST /api/v1/patient/period/start**
بدء دورة جديدة
```
Request Body:
{
  "start_date": "2026-01-25", // required
  "flow": "medium", // optional
  "symptoms": ["cramps", "headache", "mood_swings"], // optional
  "notes": "دورة عادية" // optional
}

Response (201):
{
  "status": true,
  "message": "Period cycle started successfully",
  "data": {
    "id": 1,
    "start_date": "2026-01-25",
    "end_date": null,
    "flow": "medium",
    "symptoms": ["cramps", "headache", "mood_swings"],
    "notes": "دورة عادية",
    "is_active": true,
    "expected_end_date": "2026-01-30", // based on history
    "created_at": "2026-01-25 10:00:00"
  }
}
```

#### **PUT /api/v1/patient/period/{id}/end**
إنهاء دورة
```
Request Body:
{
  "end_date": "2026-01-30" // required
}

Response (200):
{
  "status": true,
  "message": "Period cycle ended successfully",
  "data": {
    "id": 1,
    "start_date": "2026-01-25",
    "end_date": "2026-01-30",
    "period_length": 5,
    "cycle_length": 28, // calculated from previous cycle
    "flow": "medium",
    "symptoms": [...],
    "is_active": false
  }
}
```

#### **GET /api/v1/patient/period**
جلب سجل الدورات
```
Query Parameters:
- limit: default 12
- include_predictions: boolean, default true

Response (200):
{
  "status": true,
  "data": {
    "cycles": [
      {
        "id": 1,
        "start_date": "2026-01-25",
        "end_date": "2026-01-30",
        "cycle_length": 28,
        "period_length": 5,
        "flow": "medium",
        "symptoms": [...],
        "is_predicted": false
      }
    ],
    "current_cycle": {...}, // if active
    "stats": {
      "average_cycle_length": 28,
      "average_period_length": 5,
      "cycle_regularity": "regular", // regular, irregular
      "most_common_symptoms": ["cramps", "headache"]
    }
  }
}
```

#### **GET /api/v1/patient/period/predictions**
توقعات الدورات القادمة
```
Response (200):
{
  "status": true,
  "data": {
    "next_periods": [
      {
        "predicted_start": "2026-02-22",
        "predicted_end": "2026-02-27",
        "confidence": "high", // based on regularity
        "ovulation_window": {
          "start": "2026-02-08",
          "end": "2026-02-12"
        }
      },
      {
        "predicted_start": "2026-03-22",
        "predicted_end": "2026-03-27",
        "confidence": "medium"
      }
    ],
    "calendar_data": {
      // For rendering calendar view
      "period_days": ["2026-02-22", "2026-02-23", ...],
      "ovulation_days": ["2026-02-08", "2026-02-09", ...],
      "fertile_days": ["2026-02-06", "2026-02-07", ...]
    }
  }
}
```

#### **PUT /api/v1/patient/period/{id}**
تحديث معلومات دورة

#### **DELETE /api/v1/patient/period/{id}**
حذف دورة (only if is_predicted = true)

---

### 🌸 Fertility Tracker Endpoints

#### **POST /api/v1/patient/fertility**
إضافة تسجيل خصوبة يومي
```
Request Body:
{
  "entry_date": "2026-01-30", // required
  "bbt": 36.7, // optional, Basal Body Temperature
  "cervical_mucus": "egg_white", // optional
  "ovulation_test_positive": false, // optional
  "intercourse": false, // optional
  "notes": "ملاحظات" // optional
}

Validation:
- entry_date: required|date|before_or_equal:today
- bbt: nullable|numeric|min:35|max:40
- cervical_mucus: nullable|in:dry,sticky,creamy,watery,egg_white
- ovulation_test_positive: boolean
- intercourse: boolean
- notes: nullable|string|max:500

Response (201):
{
  "status": true,
  "message": "Fertility entry added successfully",
  "data": {
    "id": 1,
    "entry_date": "2026-01-30",
    "bbt": 36.7,
    "cervical_mucus": "egg_white",
    "ovulation_test_positive": false,
    "intercourse": false,
    "notes": "...",
    "is_fertile_day": true, // calculated
    "ovulation_likelihood": "high", // high, medium, low
    "created_at": "2026-01-30 08:00:00"
  }
}
```

#### **GET /api/v1/patient/fertility**
جلب تسجيلات الخصوبة
```
Query Parameters:
- month: YYYY-MM (default: current month)
- start_date: optional
- end_date: optional

Response (200):
{
  "status": true,
  "data": {
    "entries": [
      {
        "entry_date": "2026-01-30",
        "bbt": 36.7,
        "cervical_mucus": "egg_white",
        "ovulation_test_positive": false,
        "intercourse": false,
        "is_fertile_day": true,
        "ovulation_likelihood": "high"
      }
    ]
  }
}
```

#### **GET /api/v1/patient/fertility/window**
نافذة الخصوبة الحالية
```
Response (200):
{
  "status": true,
  "data": {
    "fertile_window": {
      "start_date": "2026-01-28",
      "end_date": "2026-02-02",
      "peak_day": "2026-01-31",
      "days_remaining": 3
    },
    "ovulation": {
      "predicted_date": "2026-01-31",
      "confidence": "high",
      "indicators": [
        "BBT increase detected",
        "Egg white cervical mucus"
      ]
    },
    "bbt_chart": {
      "dates": ["2026-01-20", "2026-01-21", ...],
      "temperatures": [36.5, 36.4, 36.6, ...]
    },
    "recommendations": [
      "الآن هو الوقت المثالي للحمل",
      "استمري في تسجيل درجة الحرارة يوميًا"
    ]
  }
}
```

#### **PUT /api/v1/patient/fertility/{id}**
تحديث تسجيل خصوبة

#### **DELETE /api/v1/patient/fertility/{id}**
حذف تسجيل خصوبة

---

### 🎨 Common Endpoints for All Trackers

#### **GET /api/v1/patient/trackers/summary**
ملخص جميع المتتبعات
```
Response (200):
{
  "status": true,
  "data": {
    "mood": {
      "latest_entry": {...},
      "average_this_week": "good",
      "total_entries": 45
    },
    "weight": {
      "current": 65.5,
      "change_this_month": -1.5,
      "total_entries": 30
    },
    "period": {
      "last_period_start": "2026-01-25",
      "next_predicted": "2026-02-22",
      "days_until_next": 23,
      "is_active": true
    },
    "fertility": {
      "in_fertile_window": true,
      "ovulation_in_days": 2,
      "total_entries": 20
    }
  }
}
```

---

## 🎨 Frontend Requirements

### Technology Stack:
- React 18+
- React Router v6
- Recharts (for charts and graphs)
- React Calendar (for period/fertility calendars)
- Framer Motion (for animations)
- Date-fns (for date manipulation)

---

### Pages Structure

```
src/
├── pages/
│   └── patient/
│       └── trackers/
│           ├── TrackersHub.jsx (Dashboard)
│           ├── mood/
│           │   ├── MoodTracker.jsx
│           │   ├── MoodEntry.jsx
│           │   ├── MoodAnalytics.jsx
│           │   └── MoodCalendar.jsx
│           ├── weight/
│           │   ├── WeightTracker.jsx
│           │   ├── WeightEntry.jsx
│           │   ├── WeightChart.jsx
│           │   └── WeightGoal.jsx
│           ├── period/
│           │   ├── PeriodTracker.jsx
│           │   ├── PeriodCalendar.jsx
│           │   ├── PeriodLog.jsx
│           │   └── PeriodPredictions.jsx
│           └── fertility/
│               ├── FertilityTracker.jsx
│               ├── FertilityCalendar.jsx
│               ├── FertilityEntry.jsx
│               ├── BBTChart.jsx
│               └── FertileWindow.jsx
├── components/
│   └── trackers/
│       ├── TrackerCard.jsx
│       ├── QuickAddButton.jsx
│       ├── StatsCard.jsx
│       ├── ChartContainer.jsx
│       └── EmptyState.jsx
├── services/
│   ├── moodService.js
│   ├── weightService.js
│   ├── periodService.js
│   └── fertilityService.js
└── hooks/
    ├── useMoodTracker.js
    ├── useWeightTracker.js
    ├── usePeriodTracker.js
    └── useFertilityTracker.js
```

---

## 📱 Mood Tracker Frontend

### **MoodTracker.jsx** (Main Page)
Features:
- عرض آخر 7 أيام من المزاج (visual timeline)
- زر سريع لإضافة مزاج اليوم
- Mood distribution chart (pie/donut)
- Mood trend line chart
- Access to analytics page

### **MoodEntry.jsx** (Add/Edit Modal)
Form:
- 5 mood options with emojis:
  - 😢 سيئ جدًا (very_bad)
  - 😞 سيئ (bad)
  - 😐 متوسط (neutral)
  - 😊 جيد (good)
  - 😄 ممتاز (very_good)
- Notes textarea
- Factors checkboxes/toggles:
  - ساعات النوم (sleep)
  - مستوى التوتر (stress)
  - ممارسة الرياضة (exercise)
  - التفاعل الاجتماعي (social)
- Date picker (default: today)
- Time picker (default: now)

### **MoodAnalytics.jsx**
Display:
1. **Period selector**: أسبوع، شهر، سنة
2. **Mood distribution chart** (pie/donut)
3. **Mood trend line chart** (over time)
4. **Factors analysis**:
   - تأثير النوم على المزاج
   - تأثير التوتر
   - تأثير الرياضة
5. **Insights cards**:
   - "مزاجك يتحسن تدريجيًا"
   - "النوم الجيد يحسن مزاجك بنسبة 80%"

### **MoodCalendar.jsx**
Features:
- Calendar view with mood colors
- Click on day to see details
- Color coding:
  - 😄 ممتاز → أخضر
  - 😊 جيد → أخضر فاتح
  - 😐 متوسط → أصفر
  - 😞 سيئ → برتقالي
  - 😢 سيئ جدًا → أحمر

---

## ⚖️ Weight Tracker Frontend

### **WeightTracker.jsx** (Main Page)
Features:
- Current weight display (large, prominent)
- Weight change indicator (↑/↓ with color)
- Line chart showing weight over time
- Stats cards:
  - الوزن الحالي
  - التغيير الشهري
  - أعلى وزن
  - أقل وزن
- Quick add button
- Goal progress (if goal set)

### **WeightEntry.jsx** (Add/Edit Modal)
Form:
- الوزن (kg) - number input
- الطول (cm) - number input (optional)
- BMI - auto-calculated, read-only
- ملاحظات - textarea
- التاريخ - date picker
- الوقت - time picker

Display:
- BMI calculation and category
- Weight change from last entry

### **WeightChart.jsx**
Features:
- Interactive line chart
- Zoom/pan controls
- Date range selector: أسبوع، شهر، 3 أشهر، 6 أشهر، سنة
- Goal line (if set)
- Tooltips showing exact values
- Export chart as image

### **WeightGoal.jsx** (Optional)
Features:
- Set target weight
- Set target date
- Progress bar
- Recommended weekly loss/gain
- Motivational messages

---

## 🩸 Period Tracker Frontend

### **PeriodTracker.jsx** (Main Page)
Features:
- Current status banner:
  - إذا نشط: "الدورة الحالية - اليوم X من Y"
  - إذا غير نشط: "الدورة القادمة خلال X يوم"
- Calendar view (main component)
- Quick actions:
  - بدء دورة
  - إنهاء دورة
  - تسجيل أعراض
- Stats summary:
  - متوسط طول الدورة
  - متوسط طول الحيض
  - الانتظام

### **PeriodCalendar.jsx**
Features:
- Full month calendar view
- Color coding:
  - 🔴 أيام الدورة الحالية
  - 🩷 أيام متوقعة
  - 🟢 أيام الخصوبة
  - 💛 يوم الإباضة المتوقع
- Click on day for details
- Legend explaining colors
- Navigation between months

### **PeriodLog.jsx**
Display:
- List of past cycles (cards)
- Each card shows:
  - تاريخ البدء والانتهاء
  - طول الدورة
  - شدة التدفق
  - الأعراض
  - ملاحظات
- Edit/delete options

### **PeriodPredictions.jsx**
Display:
- Next 3 predicted periods
- Confidence level for each
- Ovulation windows
- Fertile windows
- Disclaimer: "التوقعات تعتمد على المعدل السابق"

---

## 🌸 Fertility Tracker Frontend

### **FertilityTracker.jsx** (Main Page)
Features:
- Fertile window status (prominent):
  - "أنتِ في نافذة الخصوبة" (green banner)
  - "الإباضة خلال X يوم" (countdown)
- Calendar view
- BBT chart
- Quick add entry button
- Today's checklist:
  - ☐ تسجيل درجة الحرارة
  - ☐ تسجيل المخاط العنقي
  - ☐ اختبار الإباضة (optional)

### **FertilityCalendar.jsx**
Features:
- Month calendar view
- Color coding:
  - 💙 أيام تسجيل BBT
  - 🟢 أيام خصوبة عالية
  - 🌟 يوم الإباضة
  - 💗 أيام مسجلة بالجماع
- Indicators for:
  - Positive ovulation test
  - Egg white cervical mucus
- Click on day for full details

### **FertilityEntry.jsx** (Daily Entry Modal)
Form:
- تاريخ التسجيل
- **درجة حرارة الجسم القاعدية (BBT)**:
  - Number input (35.0 - 40.0)
  - Tip: "قيسي قبل القيام من السرير"
- **المخاط العنقي**:
  - Select dropdown with images/icons
  - Options: جاف، لزج، كريمي، مائي، بياض البيض
- **اختبار الإباضة**:
  - Toggle: إيجابي / سلبي
- **الجماع**:
  - Checkbox
- **ملاحظات**:
  - Textarea

### **BBTChart.jsx**
Features:
- Line chart for BBT over cycle
- Cover line (average of first 6 temps)
- Ovulation indicator
- Temperature shift highlighting
- Date range: current cycle or last 3 months
- Tooltips with exact temperatures

### **FertileWindow.jsx**
Display:
- Visual representation of fertile window
- Timeline showing:
  - أيام قبل الإباضة (fertile)
  - يوم الإباضة (peak)
  - أيام بعد الإباضة
- Indicators:
  - BBT shift detected
  - Cervical mucus quality
  - Positive ovulation test
- Recommendations based on data

---

## 📊 TrackersHub.jsx (Dashboard)

### Layout:
```
┌─────────────────────────────────────┐
│     🏠 لوحة التحكم الصحية          │
├─────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐        │
│  │  المزاج   │  │  الوزن   │        │
│  │   😊      │  │  65.5kg  │        │
│  │   جيد     │  │  ↓-1.5   │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  الدورة   │  │ الخصوبة  │        │
│  │  23 يوم   │  │ نافذة 🟢 │        │
│  │  القادمة   │  │  خصوبة    │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  📈 ملخص هذا الأسبوع               │
│  ─────────────────────────          │
│  • تم تسجيل 7 حالات مزاج           │
│  • تم تسجيل 3 أوزان                │
│  • دورة نشطة (اليوم 3)             │
│  • 2 تسجيل خصوبة                   │
└─────────────────────────────────────┘
```

### Features:
- Quick summary cards for each tracker
- Direct navigation to each tracker
- Recent activity feed
- Quick add buttons
- Health insights/tips

---

## 🎨 Common UI Components

### **TrackerCard.jsx**
Props:
- title
- icon
- value
- subtitle
- color
- onClick
- actionButton

### **QuickAddButton.jsx**
Features:
- Floating action button (FAB)
- Opens add modal for current tracker
- Different icon per tracker

### **StatsCard.jsx**
Props:
- title
- value
- change (optional)
- trend (up/down/neutral)
- icon

### **ChartContainer.jsx**
Props:
- children (chart component)
- title
- periodSelector
- exportButton

### **EmptyState.jsx**
Props:
- icon
- title
- message
- actionButton

---

## 🔗 API Services

### **moodService.js**
```javascript
export const moodService = {
  addEntry: async (data) => {},
  getEntries: async (params) => {},
  getAnalytics: async (period) => {},
  updateEntry: async (id, data) => {},
  deleteEntry: async (id) => {}
};
```

### **weightService.js**
```javascript
export const weightService = {
  addEntry: async (data) => {},
  getEntries: async (period) => {},
  getChartData: async (period) => {},
  updateEntry: async (id, data) => {},
  deleteEntry: async (id) => {},
  setGoal: async (goal) => {}
};
```

### **periodService.js**
```javascript
export const periodService = {
  startCycle: async (data) => {},
  endCycle: async (id, endDate) => {},
  getCycles: async (limit) => {},
  getPredictions: async () => {},
  updateCycle: async (id, data) => {},
  deleteCycle: async (id) => {}
};
```

### **fertilityService.js**
```javascript
export const fertilityService = {
  addEntry: async (data) => {},
  getEntries: async (params) => {},
  getFertileWindow: async () => {},
  updateEntry: async (id, data) => {},
  deleteEntry: async (id) => {}
};
```

---

## 🎯 Backend Business Logic

### Mood Analytics Calculations:
1. **Mood Score**: very_bad=1, bad=2, neutral=3, good=4, very_good=5
2. **Average**: sum(scores) / count
3. **Trend**: compare average of last 7 days vs previous 7 days
4. **Factors Analysis**: correlation between factors and mood

### Weight Tracker Calculations:
1. **BMI**: weight / (height/100)²
2. **Trend**: linear regression over last 30 days
3. **Average**: mean of all entries in period

### Period Predictions Algorithm:
1. Calculate average cycle length from last 6 cycles
2. Use last period start date + average cycle length
3. Confidence: 
   - High: if cycles are regular (SD < 3 days)
   - Medium: if SD between 3-7 days
   - Low: if SD > 7 days or < 3 cycles recorded

### Ovulation Predictions:
1. Ovulation typically occurs 14 days before next period
2. Fertile window: 5 days before + day of ovulation
3. BBT rise confirms ovulation (0.3-0.5°C increase)

### Fertility Indicators:
- **Egg white mucus** → high fertility
- **BBT dip then rise** → ovulation occurred
- **Positive ovulation test** → ovulation in 24-48h

---

## ✅ Validation Rules Summary

### Mood:
- mood: required, enum
- notes: max 1000 chars
- entry_date: not future

### Weight:
- weight: 30-300 kg
- height: 100-250 cm
- entry_date: not future

### Period:
- start_date: required, not future
- end_date: after start_date
- flow: enum
- symptoms: array of valid symptoms

### Fertility:
- entry_date: required, not future, unique per patient
- bbt: 35-40 °C
- cervical_mucus: enum

---

## 🔔 Notifications & Reminders (Future)

يمكن إضافتها لاحقًا:
- تذكير يومي لتسجيل المزاج
- تذكير أسبوعي لتسجيل الوزن
- تنبيه قبل موعد الدورة بـ 3 أيام
- تنبيه بدخول نافذة الخصوبة
- تذكير بتسجيل BBT صباحًا

---

## 📱 Responsive Design Requirements

### Mobile (< 768px):
- Single column layout
- Simplified charts
- Bottom navigation
- FAB for quick add
- Swipe gestures

### Tablet (768px - 1024px):
- Two column layout
- Full charts
- Side navigation
- Optimized calendar view

### Desktop (> 1024px):
- Multi-column layout
- Large, detailed charts
- Sidebar navigation
- More data on screen

---

## 🎨 Color Scheme Suggestions

### Mood:
- Very Bad: #EF4444 (red)
- Bad: #F97316 (orange)
- Neutral: #EAB308 (yellow)
- Good: #84CC16 (lime)
- Very Good: #10B981 (green)

### Period:
- Period days: #EC4899 (pink)
- Predicted: #FDA4AF (light pink)
- Ovulation: #FBBF24 (yellow)
- Fertile: #34D399 (green)

### Weight:
- Decreasing: #10B981 (green)
- Increasing: #3B82F6 (blue)
- Goal line: #8B5CF6 (purple)

### Fertility:
- High fertility: #10B981 (green)
- Medium: #FBBF24 (yellow)
- Low: #94A3B8 (gray)

---

## ✅ Testing Checklist

### Backend:
- [ ] All CRUD operations work
- [ ] Calculations are accurate (BMI, averages, predictions)
- [ ] Validations prevent invalid data
- [ ] Authorization: users can only access their own data
- [ ] Date/time handling is correct
- [ ] Analytics/stats are accurate

### Frontend:
- [ ] All forms submit correctly
- [ ] Charts render properly
- [ ] Calendar views work
- [ ] Responsive on all devices
- [ ] Date/time pickers work
- [ ] Validation messages display
- [ ] Loading states show
- [ ] Empty states display
- [ ] Error handling works
- [ ] Navigation between trackers

---

## 🚀 Implementation Priority

### Phase 1: Core Functionality
1. Mood Tracker (simplest)
2. Weight Tracker
3. Period Tracker (most complex backend)
4. Fertility Tracker (depends on period)

### Phase 2: Analytics
1. Mood analytics
2. Weight charts
3. Period predictions
4. Fertility window calculations

### Phase 3: Polish
1. Responsive design
2. Animations
3. Empty states
4. Error handling
5. Performance optimization

---

## 📌 Important Notes

1. **Date/Time Handling**: Use UTC in backend, display in user's timezone
2. **Privacy**: All tracker data is highly sensitive
3. **Performance**: Lazy load charts and calendar data
4. **Offline**: Consider caching recent data
5. **Validation**: Always validate on both client and server
6. **Predictions**: Always include disclaimer about accuracy

---

## 🎯 Success Criteria

System is complete when:
- ✅ All 4 trackers functional
- ✅ Data entry is smooth and quick
- ✅ Charts and analytics accurate
- ✅ Predictions working (period/fertility)
- ✅ Mobile responsive
- ✅ No performance issues
- ✅ Secure and private

---

**ملاحظة**: هذا نظام كبير ومعقد. يُفضل البدء بـ Mood Tracker أولاً لأنه الأبسط، ثم التدرج للأنظمة الأخرى.
