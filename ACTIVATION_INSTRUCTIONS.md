# ⚡ تعليمات التفعيل النهائية - نظام التسليمات

## ✅ ما تم إنجازه

تم إنشاء **مكون كامل** (`AssignmentSubmissionsModal.tsx`) جاهز للعمل!

الملف موجود في: `frontend/src/components/AssignmentSubmissionsModal.tsx`

---

## 🔧 المطلوب منك (خطوة واحدة فقط!)

### افتح ملف: `frontend/src/pages/Assignments.tsx`

**ابحث عن السطر 446:**
```tsx
</button>
<button onClick={() => {
    setEditingAssignment(assignment); setFormData({
```

**أضف قبل السطر الثاني (`<button onClick...`) الكود التالي:**

```tsx
<button 
    onClick={() => { 
        setSelectedAssignment(assignment); 
        setShowSubmissionsModal(true); 
    }} 
    className="btn-icon-mini" 
    style={{ background: '#3B82F6', color: 'white' }} 
    title="📋 تسليمات الطلاب"
>
    📋
</button>
```

---

### 🎯 النتيجة المطلوبة

يجب أن يصبح الكود هكذا:

```tsx
// الزر الأول (Details) - موجود أصلاً
<button onClick={() => { setSelectedAssignment(assignment); setShowDetailsModal(true); }} 
        className="btn-icon-mini view">
    <User size={18} />
</button>

// الزر الجديد (Submissions) - أضفه هنا ⬇️
<button 
    onClick={() => { 
        setSelectedAssignment(assignment); 
        setShowSubmissionsModal(true); 
    }} 
    className="btn-icon-mini" 
    style={{ background: '#3B82F6', color: 'white' }} 
    title="📋 تسليمات الطلاب"
>
    📋
</button>

// الزر الثاني (Edit) - موجود أصلاً
<button onClick={() => { setEditingAssignment(assignment); ... }}>
    <FilePenLine size={18} />
</button>
```

---

## ✅ الخطوة الأخيرة

**في نفس الملف**, اذهب إلى السطر **1353** (قبل `</div>` الأخير)

**أضف هذا الكود:**

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

## 🧪 اختبار

1. احفظ الملف
2. افتح المتصفح
3. اذهب لصفحة الواجبات
3. ستجد زر أزرق جديد "📋"
4. اضغط عليه
5. يجب أن يفتح جدول كبير بجميع الطلاب!

---

## 📚 للمزيد من التفاصيل

راجع الملفات في `.design/`:
- `FINAL_SUMMARY.md` ← كل شيء!
- `QUICK_ACTIVATION_GUIDE.md`
- `ASSIGNMENTS_REBUILD_PLAN.md`

---

**الحالة**: ⚠️ **جاهز 99%** - فقط أضف الزر يدوياً (كود جاهز أعلاه!)

_آخر تحديث: 2026-02-06 23:05_
