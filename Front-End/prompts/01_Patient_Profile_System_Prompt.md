# Patient Profile System - Full Stack Development Prompt
## منصة وداد الصحية - نظام الملف الشخصي للمريض

---

## 📋 Overview - نظرة عامة

هذا البرمبت لبناء **نظام الملف الشخصي الكامل للمريض** في منصة وداد الصحية، يشمل:
- الباك إند (Laravel API)
- الفرونت إند (React/Lovable)
- التكامل الكامل مع نظام المصادقة الموجود

---

## 🎯 Project Context - السياق

### الأجزاء المكتملة:
✅ نظام المصادقة (Authentication) - مكتمل بالكامل
- تسجيل المستخدمين (Patients, Doctors, Admins)
- تسجيل الدخول والخروج
- التحقق من البريد الإلكتروني
- إعادة تعيين كلمة المرور
- Multi-guard authentication

### الجزء المطلوب بناؤه:
🔨 **نظام الملف الشخصي للمريض (Patient Profile)**

---

## 🗄️ Backend Requirements - متطلبات الباك إند

### 1. Database Schema (Already exists - للمراجعة فقط)

```
Table: user_profiles
- id
- patient_id (FK → patients.id)
- height (decimal 5,2) - بالسنتيمتر
- weight (decimal 5,2) - بالكيلوغرام
- blood_type (enum: A+, A-, B+, B-, AB+, AB-, O+, O-)
- date_of_birth (date)
- national_id (string)
- medical_history (text)
- chronic_diseases (json)
- allergies (json)
- current_medications (json)
- emergency_contact_name (string)
- emergency_contact_phone (string)
- timestamps

Table: patients (للتعديل)
- name
- email
- phone
- age
- image
- life_stage_id (FK → life_stages.id)
- is_active
- email_verified_at
```

### 2. API Endpoints Required

#### **GET /api/v1/patient/profile**
- Headers: `Authorization: Bearer {token}`
- Middlewares: `auth:patient`, `PatientStatus`, `PatientEmailVerify`
- Response: بيانات المريض كاملة مع الملف الشخصي

#### **PUT /api/v1/patient/profile/basic**
تحديث المعلومات الأساسية (الاسم، العمر، الصورة، المرحلة الحياتية)
- Fields:
  - name (optional, string, max:255)
  - age (optional, integer, min:12, max:100)
  - phone (optional, regex:/^01[0125][0-9]{8}$/)
  - image (optional, file, image, max:2048KB)
  - life_stage_id (optional, exists:life_stages,id)

#### **PUT /api/v1/patient/profile/medical**
تحديث المعلومات الطبية
- Fields:
  - height (optional, numeric, min:100, max:250)
  - weight (optional, numeric, min:30, max:300)
  - blood_type (optional, in:A+,A-,B+,B-,AB+,AB-,O+,O-)
  - date_of_birth (optional, date, before:today, after:1920-01-01)
  - national_id (optional, string, size:14, regex:/^[0-9]{14}$/)
  - medical_history (optional, string, max:5000)
  - chronic_diseases (optional, array)
  - allergies (optional, array)
  - current_medications (optional, array)

#### **PUT /api/v1/patient/profile/emergency**
تحديث معلومات الطوارئ
- Fields:
  - emergency_contact_name (required, string, max:255)
  - emergency_contact_phone (required, regex:/^01[0125][0-9]{8}$/)

#### **GET /api/v1/patient/profile/stats**
إحصائيات الملف الشخصي
- Response:
  - profile_completion_percentage
  - missing_fields
  - bmi (calculated)
  - bmi_category
  - health_score

#### **DELETE /api/v1/patient/profile/image**
حذف الصورة الشخصية

#### **GET /api/v1/life-stages**
قائمة المراحل الحياتية المتاحة (Public endpoint)

---

### 3. Controller Structure

**File: `app/Http/Controllers/API/Patient/ProfileController.php`**

Methods needed:
- `show()` - عرض الملف الشخصي
- `updateBasicInfo()` - تحديث المعلومات الأساسية
- `updateMedicalInfo()` - تحديث المعلومات الطبية
- `updateEmergencyContact()` - تحديث معلومات الطوارئ
- `getStats()` - الحصول على الإحصائيات
- `deleteImage()` - حذف الصورة

---

### 4. Validation Rules

**Request Files needed:**
- `UpdateBasicInfoRequest`
- `UpdateMedicalInfoRequest`
- `UpdateEmergencyContactRequest`

**Validation Examples:**

```
Height: numeric|min:100|max:250
Weight: numeric|min:30|max:300
National ID: digits:14|unique:user_profiles,national_id,{current_user_id}
Phone: regex:/^01[0125][0-9]{8}$/|unique:patients,phone,{current_user_id}
Image: image|mimes:jpeg,png,jpg,gif|max:2048
```

---

### 5. Business Logic Requirements

#### BMI Calculation:
```
BMI = weight (kg) / (height (m))²
Categories:
- Underweight: < 18.5
- Normal: 18.5 - 24.9
- Overweight: 25 - 29.9
- Obese: ≥ 30
```

#### Profile Completion Percentage:
حساب نسبة اكتمال الملف بناءً على:
- المعلومات الأساسية (30%): name, age, phone, image
- المعلومات الطبية (50%): height, weight, blood_type, date_of_birth
- معلومات الطوارئ (20%): emergency_contact_name, emergency_contact_phone

#### Image Upload:
- تخزين الصور في: `storage/app/public/patients/images/`
- إنشاء thumbnail بحجم 200x200
- حذف الصورة القديمة عند رفع صورة جديدة
- استخدام مكتبة Intervention/Image

---

### 6. Response Format

**Success Response Structure:**
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "name": "محمد أحمد",
    "email": "ahmed@example.com",
    "age": 25,
    "phone": "01012345678",
    "life_stage_id": 1,
    "life_stage": {
      "id": 1,
      "name": "pregnancy",
      "slug": "pregnancy",
      "description": "مرحلة الحمل"
    },
    "profile": {
      "id": 1,
      "height": 170,
      "weight": 65,
      "bmi": 22.49,
      "bmi_category": "Normal",
      "blood_type": "A+",
      "date_of_birth": "1999-05-15",
      "age_calculated": 26,
      "national_id": "12345678901234",
      "medical_history": "لا يوجد",
      "chronic_diseases": ["diabetes"],
      "allergies": ["penicillin"],
      "current_medications": ["insulin"],
      "emergency_contact_name": "فاطمة أحمد",
      "emergency_contact_phone": "01098765432",
      "last_update": "2026-01-30"
    },
    "profile_completion": 85,
    "missing_fields": ["image"],
    "is_active": true,
    "image_url": "http://domain.com/storage/patients/images/user-1.jpg",
    "is_verified": true,
    "joined_at": "2026-01-27"
  }
}
```

---

### 7. Security Requirements

- ✅ Middleware: `auth:patient` على كل endpoint
- ✅ Middleware: `PatientStatus` للتحقق من حالة الحساب النشط
- ✅ Middleware: `PatientEmailVerify` للتحقق من تفعيل البريد
- ✅ Rate Limiting: 60 طلب في الدقيقة
- ✅ التحقق من ملكية البيانات: المستخدم يمكنه فقط تعديل ملفه الشخصي
- ✅ تنظيف المدخلات: sanitize all text inputs
- ✅ حماية الصور: validate file types and sizes

---

## 🎨 Frontend Requirements - متطلبات الفرونت إند

### Technology Stack:
- React 18+
- React Router v6
- Axios for API calls
- React Hook Form for form management
- Tailwind CSS for styling
- React Toastify for notifications
- React Dropzone for image upload

---

### 1. Pages/Components Structure

```
src/
├── pages/
│   └── patient/
│       └── profile/
│           ├── ProfilePage.jsx (Main container)
│           ├── ProfileOverview.jsx
│           ├── EditBasicInfo.jsx
│           ├── EditMedicalInfo.jsx
│           ├── EditEmergencyContact.jsx
│           └── ProfileStats.jsx
├── components/
│   └── profile/
│       ├── ProfileHeader.jsx
│       ├── ProfileCard.jsx
│       ├── ImageUpload.jsx
│       ├── BMICard.jsx
│       ├── ProgressCircle.jsx
│       └── EmergencyContactCard.jsx
├── services/
│   └── profileService.js
└── hooks/
    └── useProfile.js
```

---

### 2. Main Pages Specifications

#### **ProfilePage.jsx**
- Container component with tabs/sections
- Sections:
  1. نظرة عامة (Overview)
  2. المعلومات الأساسية (Basic Info)
  3. المعلومات الطبية (Medical Info)
  4. معلومات الطوارئ (Emergency Contact)
  5. الإحصائيات (Stats)

#### **ProfileOverview.jsx**
Display:
- صورة المستخدم مع إمكانية التعديل
- الاسم والعمر
- البريد الإلكتروني والهاتف
- المرحلة الحياتية الحالية
- نسبة اكتمال الملف (Progress Circle)
- BMI Card (if height & weight exist)
- زر "تعديل الملف الشخصي"

#### **EditBasicInfo.jsx**
Form Fields:
- الاسم الكامل (text input)
- العمر (number input, 12-100)
- رقم الهاتف (text input with validation)
- الصورة الشخصية (image upload with preview)
- المرحلة الحياتية (dropdown/select)

Features:
- Preview image before upload
- Crop/resize image (optional)
- Validation on client side
- Loading state during upload
- Success/Error notifications

#### **EditMedicalInfo.jsx**
Form Fields:
- الطول (number input with unit: cm)
- الوزن (number input with unit: kg)
- BMI (auto-calculated, read-only)
- فصيلة الدم (select dropdown)
- تاريخ الميلاد (date picker)
- الرقم القومي (14 digits)
- التاريخ المرضي (textarea)
- الأمراض المزمنة (multi-select or chips)
- الحساسية (multi-select or chips)
- الأدوية الحالية (multi-select or chips)

Features:
- Auto-calculate BMI when height/weight change
- Show BMI category with color coding
- Age auto-calculated from date_of_birth
- Add/remove items for arrays (diseases, allergies, medications)

#### **EditEmergencyContact.jsx**
Form Fields:
- اسم جهة الاتصال (text input)
- رقم الهاتف (text input with validation)

Features:
- Phone number formatting (01X-XXXX-XXXX)
- Validation: required fields
- Quick add from contacts (optional)

#### **ProfileStats.jsx**
Display Cards:
1. **نسبة اكتمال الملف**
   - دائرة تقدم (Progress Circle)
   - قائمة بالحقول الناقصة
   - زر "أكمل الملف الآن"

2. **مؤشر كتلة الجسم (BMI)**
   - القيمة الحالية
   - الفئة (Underweight/Normal/Overweight/Obese)
   - رسم بياني بسيط أو مؤشر ملون

3. **معلومات سريعة**
   - العمر المحسوب
   - المرحلة الحياتية
   - تاريخ آخر تحديث

---

### 3. Component Specifications

#### **ProfileHeader.jsx**
```
Props:
- user (object)
- profileCompletion (number)
- onEditClick (function)

Display:
- Cover image (gradient or pattern)
- Profile image (circular, with upload icon on hover)
- Name & Email
- Completion badge
- Edit button
```

#### **ImageUpload.jsx**
```
Props:
- currentImage (string)
- onUpload (function)
- onDelete (function)

Features:
- Drag & drop zone
- Click to browse
- Image preview
- Loading spinner during upload
- Delete confirmation dialog
```

#### **BMICard.jsx**
```
Props:
- bmi (number)
- category (string)
- height (number)
- weight (number)

Display:
- BMI value (large, centered)
- Category with color (green/yellow/orange/red)
- Gauge/meter visualization
- Height & Weight labels
```

#### **ProgressCircle.jsx**
```
Props:
- percentage (number)
- size (number)
- strokeWidth (number)
- color (string)

Display:
- Circular progress bar
- Percentage in center
- Animated on mount
```

---

### 4. API Service (profileService.js)

```javascript
// Required functions:

export const profileService = {
  // Get full profile
  getProfile: async () => {...},
  
  // Update basic info
  updateBasicInfo: async (data) => {...},
  
  // Update medical info
  updateMedicalInfo: async (data) => {...},
  
  // Update emergency contact
  updateEmergencyContact: async (data) => {...},
  
  // Get profile stats
  getStats: async () => {...},
  
  // Upload profile image
  uploadImage: async (file) => {...},
  
  // Delete profile image
  deleteImage: async () => {...},
  
  // Get life stages
  getLifeStages: async () => {...}
};
```

---

### 5. Custom Hook (useProfile.js)

```javascript
// Required functionality:

export const useProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  
  // Functions:
  const fetchProfile = async () => {...};
  const updateBasic = async (data) => {...};
  const updateMedical = async (data) => {...};
  const updateEmergency = async (data) => {...};
  const uploadProfileImage = async (file) => {...};
  const deleteProfileImage = async () => {...};
  const refreshStats = async () => {...};
  
  return {
    profile,
    stats,
    loading,
    fetchProfile,
    updateBasic,
    updateMedical,
    updateEmergency,
    uploadProfileImage,
    deleteProfileImage,
    refreshStats
  };
};
```

---

### 6. Routing

```javascript
// Add to Routes:
<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}>
  <Route index element={<ProfileOverview />} />
  <Route path="basic" element={<EditBasicInfo />} />
  <Route path="medical" element={<EditMedicalInfo />} />
  <Route path="emergency" element={<EditEmergencyContact />} />
  <Route path="stats" element={<ProfileStats />} />
</Route>
```

---

### 7. UI/UX Requirements

#### Design Guidelines:
- استخدام نظام الألوان الموجود في المنصة
- تصميم responsive لجميع الشاشات
- استخدام icons من lucide-react
- رسوم متحركة سلسة (transitions)
- feedback فوري للمستخدم (loading states)

#### Validation Messages (بالعربية):
```
- "الرجاء إدخال الاسم"
- "يجب أن يكون العمر بين 12 و 100 سنة"
- "رقم الهاتف غير صحيح"
- "حجم الصورة يجب أن يكون أقل من 2 ميجابايت"
- "الرقم القومي يجب أن يكون 14 رقمًا"
```

#### Success Messages:
```
- "تم تحديث المعلومات بنجاح ✓"
- "تم رفع الصورة بنجاح ✓"
- "تم حذف الصورة بنجاح ✓"
```

---

### 8. Accessibility Requirements

- ✅ Proper label associations (for screen readers)
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ ARIA labels where needed
- ✅ Alt text for images
- ✅ High contrast mode compatible

---

## 🔗 Integration Points - نقاط التكامل

### With Authentication System:
- استخدام AuthContext الموجود للحصول على user data
- استخدام token من localStorage
- Redirect to login if token expired

### With Life Stages:
- جلب قائمة المراحل الحياتية من API
- عرض description لكل مرحلة
- تحديث life_stage_id في الملف الشخصي

### With Future Features:
- الملف الشخصي سيُستخدم في:
  - Health Trackers (Mood, Weight, Period)
  - AI Chat (تخصيص الإجابات حسب life stage)
  - Consultations (مشاركة البيانات الطبية مع الطبيب)

---

## ✅ Testing Checklist

### Backend Tests:
- [ ] Profile CRUD operations
- [ ] Image upload/delete
- [ ] BMI calculation accuracy
- [ ] Profile completion calculation
- [ ] Validation rules
- [ ] Authorization (user can only edit own profile)
- [ ] Rate limiting

### Frontend Tests:
- [ ] Form validation
- [ ] Image upload/preview
- [ ] BMI auto-calculation
- [ ] API error handling
- [ ] Loading states
- [ ] Responsive design
- [ ] Navigation between sections

---

## 📝 Implementation Order

### Phase 1: Backend Foundation
1. Create ProfileController
2. Create Form Requests (validation)
3. Implement CRUD operations
4. Add BMI calculation logic
5. Add profile completion calculation
6. Test all endpoints with Postman

### Phase 2: Frontend Foundation
1. Create profile service
2. Create useProfile hook
3. Build ProfilePage container
4. Implement routing

### Phase 3: UI Components
1. ProfileHeader
2. ProfileOverview
3. ImageUpload
4. BMICard
5. ProgressCircle

### Phase 4: Edit Forms
1. EditBasicInfo
2. EditMedicalInfo
3. EditEmergencyContact
4. Form validations

### Phase 5: Stats & Polish
1. ProfileStats page
2. Error handling
3. Loading states
4. Notifications
5. Responsive design fixes

---

## 🚀 Deliverables

عند اكتمال هذا الجزء، يجب أن يكون لديك:

### Backend:
✅ API endpoints كاملة ومختبرة
✅ Validation محكمة
✅ Image handling working
✅ BMI calculations accurate
✅ Profile completion working

### Frontend:
✅ واجهة مستخدم كاملة للملف الشخصي
✅ جميع النماذج تعمل
✅ رفع وحذف الصور
✅ حسابات تلقائية (BMI, Age)
✅ تصميم responsive
✅ تجربة مستخدم سلسة

---

## 📌 Important Notes

1. **لا تنسَ**: استخدام نظام المصادقة الموجود (AuthContext)
2. **الأمان**: كل request يحتاج Bearer token
3. **اللغة**: جميع الرسائل والنصوص بالعربية
4. **التنسيق**: اتباع نمط الكود الموجود في نظام المصادقة
5. **الصور**: تخزين في storage/app/public وليس public/
6. **التحقق**: double-check validation rules على الطرفين

---

## 🎯 Success Criteria

يُعتبر هذا الجزء مكتملًا عندما:
- ✅ المستخدم يستطيع عرض ملفه الشخصي كاملًا
- ✅ المستخدم يستطيع تعديل جميع المعلومات
- ✅ رفع وحذف الصورة الشخصية يعمل
- ✅ BMI يتم حسابه تلقائيًا
- ✅ نسبة اكتمال الملف دقيقة
- ✅ جميع التحققات تعمل بشكل صحيح
- ✅ الواجهة responsive وسهلة الاستخدام
- ✅ لا توجد أخطاء في Console أو API

---

**Note**: هذا البرمبت شامل لكل ما تحتاجه. استخدمه مع AI للحصول على كود كامل ومنظم.
