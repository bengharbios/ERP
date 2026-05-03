# 🚀 دليل التفعيل السريع - نظام التسليمات الجديد

## ✅ ما تم إنجازه

1. ✅ **AssignmentSubmissionsModal.tsx** - مكون جديد كامل
2. ✅ **خطة التنفيذ ال كاملة** في `.design/`
3. ✅ **تحديث Import** في `Assignments.tsx`
4. ✅ **إضافة State** للمودال الجديد

---

## 📝 الخطوات المتبقية (يدوياً)

### 1️⃣ إضافة زر في Action Buttons

#### الموقع: `src/pages/Assignments.tsx`

**ابحث عن**:
```tsx
<button 
    onClick={() => handleViewDetails(assignment)}
    className="btn-action-primary"
>
    تصحيح
</button>
```

**أضف بعده**:
```tsx
<button 
    onClick={() => {
        setSelectedAssignment(assignment);
        setShowSubmissionsModal(true);
    }}
    className="btn-action-secondary"
    style={{ background: '#3B82F6' }}
>
    📋 التسليمات
</button>
```

---

### 2️⃣ إضافة المودال في نهاية Component

#### الموقع: نفس الملف، قبل `</div>` الأخير

**أضف**:
```tsx
{/* Submissions Modal */}
{showSubmissionsModal && selectedAssignment && (
    <AssignmentSubmissionsModal
        assignment={selectedAssignment}
        onClose={() => {
            setShowSubmissionsModal(false);
            setSelectedAssignment(null);
        }}
        onRefresh={() => loadData()}
    />
)}
```

---

## 🎯 النتيجة المتوقعة

عند النقر على زر "📋 التسليمات":
1. ✅ يُفتح مودال كبير
2. ✅ يعرض جميع الطلاب المسجلين في الوحدة
3. ✅ يُظهر حالة كل طالب (missing/submitted/graded)
4. ✅ يمكن تعديل التواريخ والدرجات مباشرة

---

## 🔍 اختبار سريع

1. افتح صفحة الواجبات
2. اختر أي واجب
3. اضغط "📋 التسليمات"
4. يجب أن يظهر جدول بكل الطلاب المسجلين في الوحدة

---

## ❓ استكشاف الأخطاء

### "لا يوجد طلاب"
**السبب**: الوحدة ليس لها فصول نشطة  
**الحل**: تأكد أن:
- الوحدة مربوطة ببرنامج
- البرنامج له فصول
- الفصول لها طلاب مسجلين

### "فشل التحميل"
**الحل**: افتح Console وشاهد الخطأ  
**التحقق من**:
- API `/academic/units/:id/students` يعمل
- Backend يعمل على المنفذ الصحيح

---

## 📚 المراجع

- **الخطة الكاملة**: `.design/ASSIGNMENTS_REBUILD_PLAN.md`
- **التوثيق**: `.design/ASSIGNMENTS_IMPLEMENTATION_README.md`
- **الكود**: `frontend/src/components/AssignmentSubmissionsModal.tsx`

---

**حالة النظام**: ⚠️ جاهز، يحتاج فقط إضافة الزر يدوياً  
**آخر تحديث**: 2026-02-06 22:43
