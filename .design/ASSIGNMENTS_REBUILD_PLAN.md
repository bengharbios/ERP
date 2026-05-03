# 📋 خطة إعادة بناء نظام إدارة الواجبات
## التاريخ: 2026-02-06
## الهدف: بناء نظام عالمي المستوى لإدارة مهام الطلاب

---

## 🎯 المفهوم الأساسي

### القاعدة الذهبية ⭐
**عرض فقط الطلاب المسجلين في الوحدة (Unit) حسب سجل الحضور**

```
Assignment → Unit → Classes → StudentEnrollments → Students
```

### رحلة المهمة (Assignment Journey)
```
1. إنشاء المهمة (Create)
   ↓
2. جلب الطلاب المسجلين تلقائياً (Auto-fetch enrolled students)
   ↓
3. تسجيل التسليمات (Record submissions)
   ↓
4. إرسال للمصحح (Send to assessor)
   ↓
5. التصحيح (Assessment)
   ↓
6. النشر والتقارير (Publish & Reports)
```

---

## 📊 قاعدة البيانات (Database Schema)

### ✅ الموجود حالياً

#### `Assignment` جدول
- ✅ `id`, `unitId`, `title`, `description`
- ✅ `totalMarks`, `passThreshold`, `meritThreshold`, `distinctionThreshold`
- ✅ `submissionDeadline`, `assessorId`
- ✅ `status` (draft/published/closed)

#### `StudentAssignment` جدول
- ✅ `id`, `assignmentId`, `studentId`, `studentEnrollmentId`
- ✅ `submittedAt`, `content`, `attachments`
- ✅ `assessedBy`, `assessedAt`, `marks`, `grade`
- ✅ `finalStatus` (pending_submission/submitted/being_assessed/etc.)

### ⚠️ المطلوب إضافته

#### في `Assignment`:
-  `gradingSystem` (100/20/10/letters/pass_fail)
- ✅ `status` موجود
- ✅ `assessorId` موجود

#### في `StudentAssignment`:
- ✅ `submittedAt` موجود (تاريخ التسليم)
- ⚠️ `sentToAssessorAt` (متى أُرسل للمصحح) - **مطلوب إضافته**
- ✅ `assessedBy` موجود (من المصحح)
- ✅ `assessedAt` موجود (متى تم التصحيح)
- ✅ `finalStatus` موجود

---

## 🔧 Backend APIs المطلوبة

### ✅ APIs الموجودة
1. `GET /assignments` - جلب جميع المهام
2. `GET /assignments/:id` - تفاصيل مهمة
3. `POST /assignments` - إنشاء مهمة
4. `PUT /assignments/:id` - تحديث مهمة
5. `GET /assignments/:id/submissions` - جلب التسليمات

### 🆕 APIs الجديدة المطلوبة
1. **`GET /assignments/:id/students`** - جلب جميع الطلاب المسجلين في وحدة المهمة مع حالة التسليم
   ```json
   {
     "students": [
       {
         "studentId": "...",
         "studentNumber": "2021001",
         "name": "أحمد محمد",
         "enrollmentId": "...",
         "submission": {
           "id": "..." | null,
           "submittedAt": "..." | null,
           "sentToAssessorAt": "..." | null,
           "assessedBy": "..." | null,
           "assessedAt": "..." | null,
           "grade": "..." | null,
           "finalStatus": "missing" | "submitted" | "being_assessed" | "graded"
         }
       }
     ]
   }
   ```

2. **`POST /assignments/:assignmentId/students/:studentId/submission`** - تسجيل تسليم يدوياً
3. **`PUT /assignments/submissions/:id/send-to-assessor`** - إرسال التسليم للمصحح
4. **`PUT /assignments/submissions/:id/assess`** - تسجيل الدرجة

---

## 🎨 Frontend - التصميم الجديد

### 1️⃣ صفحة Assignments الرئيسية

#### بطاقات المهام (Cards)
```
┌────────────────────────────────────┐
│ 📝 Coding Assignment 1             │
│ 🔵 Homework | 📚 Programming       │
│ 📅 10/03/2024 | ⚖️ 15%            │
│                                    │
│ ████████░░ 80% submitted          │
│ 👥 20  ✅ 16  ✔️ 12               │
│                                    │
│ [🔍 Details] [📋 Submissions]     │
└────────────────────────────────────┘
```

#### ألوان أنواع المهام
- 🔵 Homework → `#3B82F6` (أزرق)
- 🔴 Exam → `#EF4444` (أحمر)
- 🟢 Project → `#10B981` (أخضر)
- 🟠 Quiz → `#F59E0B` (برتقالي)

### 2️⃣ نافذة التسليمات (Submissions Modal)

#### الجدول الكامل
```
┌─┬────────────┬────────┬──────────────┬────────────┬──────────────┬─────────┬──────────────┬────────┬─────┐
│#│ الطالب     │ الرقم  │تاريخ التسليم│  الحالة    │أُرسل للمصحح │المصحح  │تاريخ التصحيح│ الدرجة │حفظ │
├─┼────────────┼────────┼──────────────┼────────────┼──────────────┼─────────┼──────────────┼────────┼─────┤
│1│أحمد محمد   │2021001 │[Date Picker] │✅ تم التسليم│[Date Picker] │د.محمد  │[Date Picker] │[__/100]│💾  │
│2│فاطمة أحمد  │2021002 │     -        │❌ لم يسلم   │      -       │   -     │      -       │   -    │    │
│3│سارة علي    │2021003 │10/03 14:20   │🟢 تم التصحيح│10/03 15:00   │د.نادية │11/03 9:00    │  95    │    │
└─┴────────────┴────────┴──────────────┴────────────┴──────────────┴─────────┴──────────────┴────────┴─────┘
```

#### ألوان الحالات
- 🟢 `graded` → `#D1FAE5` background, `#065F46` text
- 🟠 `being_assessed` → `#FED7AA` background, `#92400E` text
- 🔵 `submitted` → `#DBEAFE` background, `#1E40AF` text
- 🔴 `missing` → `#FEE2E2` background, `#991B1B` text

---

## 🚀 خطة التنفيذ التفصيلية

### المرحلة 1: تحديث Schema ⚠️
- [ ] إضافة `sentToAssessorAt DateTime?` إلى `StudentAssignment`
- [ ] إضافة `gradingSystem String?` إلى `Assignment`
- [ ] تشغيل `npx prisma migrate dev`

### المرحلة 2: Backend APIs 🔧
- [ ] إنشاء `GET /assignments/:id/students` لجلب الطلاب + التسليمات
- [ ] تحديث `getAssignmentSubmissions` ليجلب كل الطلاب
- [ ] إضافة `PUT /assignments/submissions/:id/send-to-assessor`
- [ ] تحديث validation schemas

### المرحلة 3: Frontend Services 🌐
- [ ] تحديث `assignments.service.ts` بالـ APIs الجديدة
- [ ] إضافة types للطلاب والتسليمات

### المرحلة 4: Frontend Components 🎨
- [ ] إعادة بناء `AssignmentDetailsModal` بالكامل
- [ ] إنشاء `SubmissionsTable` component
- [ ] إضافة DatePicker components
- [ ] نظام الألوان والحالات

### المرحلة 5: اختبار وتحسين ✅
- [ ] اختبار سيناريوهات مختلفة
- [ ] التأكد من عرض الطلاب الصحيحين
- [ ] التأكد من حفظ البيانات

---

## 🎯 معايير النجاح

✅ يجب أن يعرض النظام **جميع** الطلاب المسجلين في الوحدة  
✅ يجب أن تكون الحالات واضحة ومرمزة بالألوان  
✅ يجب أن يكون تسجيل التسليم سهلاً وسريعاً  
✅ يجب أن تكون واجهة المستخدم احترافية وسلسة  
✅ يجب أن تكون البيانات دقيقة ومتسقة  

---

## 📌 ملاحظات مهمة

1. **الأولوية للطلاب المسجلين**: النظام يجب أن يعتمد على `StudentEnrollment` وليس مجرد قائمة الطلاب
2. **الحالات الافتراضية**: الطلاب غير المسلمين يعتبرون `missing` حتى يسلموا
3. **تتبع كامل**: كل خطوة في رحلة المهمة يجب أن تُسجل بتاريخ ووقت
4. **المصححون**: يجب أن يكون بالإمكان تعيين مصحح مختلف لكل طالب إذا لزم الأمر

---

## ⏭️ الخطوات التالية

1. ✅ **الآن**: البدء بتحديث Schema
2. ⬜ بناء Backend APIs
3. ⬜ بناء Frontend
4. ⬜ الاختبار النهائي
