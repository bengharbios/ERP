# خطة النظام المالي والمحاسبي المتكامل
## Institute ERP - Advanced Financial & Accounting System

**تاريخ الإنشاء:** 2026-02-11  
**المعايير المحاسبية:** مبدأ الاستحقاق (Accrual Basis) + القيد المزدوج (Double Entry)  
**الامتثال الضريبي:** قانون ضريبة القيمة المضافة الإماراتي (UAE VAT)  
**المرجع:** خطة وضعها خبير محاسبي محترف

---

## 📋 الهدف الاستراتيجي

بناء نظام مالي ومحاسبي متكامل لمعهد تعليمي في الإمارات يربط جميع العمليات المالية (إيرادات، مصاريف، رواتب) بنظام محاسبي احترافي يتوافق مع:
- **معايير IFRS 15** (الإيرادات من العقود مع العملاء)
- **قانون ضريبة القيمة المضافة الإماراتي** (VAT 5%)
- **نظام حماية الأجور WPS** (Wage Protection System)
- **مبدأ القيد المزدوج** (Double Entry Bookkeeping)

---

## 🏗️ البرومبت الأم (Master Prompt)

```
أريد بناء نظام مالي ومحاسبي متكامل لمعهد تعليمي في الإمارات. 

المبادئ الأساسية:
1. يعتمد النظام على مبدأ الاستحقاق (Accrual Basis) والقيد المزدوج
2. يتم استدعاء رقم التسجيل الضريبي TRN (15 رقم) ونسبة الضريبة 5% من صفحة الإعدادات
3. النظام يربط بيانات الطلاب والرسوم بجميع الحسابات المالية والرواتب
4. كل عملية مالية تولد قيود محاسبية تلقائية
5. النظام يدعم إصدار التقارير المالية والضريبية المطلوبة للجهات الحكومية
```

---

## 🔗 مخطط الترابط المحاسبي

```
[الإعدادات المالية] → (TRN + VAT 5% + IBAN)
        ↓
[الفواتير والإيرادات] → قيد: مدين الطالب / دائن الإيرادات المؤجلة
        ↓
[المقبوضات] → قيد: مدين البنك/الخزينة / دائن مديونية الطالب
        ↓
[المصاريف] → قيد: مدين المصروف / دائن البنك/الخزينة
        ↓
[الرواتب] → قيد: مدين مصروف الرواتب / دائن البنك
        ↓
[التقارير المالية] → ميزان المراجعة + قائمة الدخل + تقرير VAT
        ↓
[الدليل المحاسبي] → دليل الحسابات الموحد (Chart of Accounts)
```

---

## 📊 الصفحات المطلوبة (6 صفحات + دليل)

### 1️⃣ صفحة الإعدادات المالية (Financial Settings)
**الهدف:** الدماغ المركزي الذي يغذي جميع الصفحات بالبيانات الثابتة

**الحقول المطلوبة:**
- ✅ اسم المنشأة القانوني (عربي + إنجليزي)
- ✅ رقم التسجيل الضريبي TRN (15 رقم - إلزامي)
- ✅ نسبة ضريبة القيمة المضافة (افتراضي: 5%)
- ✅ العملة الرسمية (AED)
- ✅ إدارة الحسابات البنكية:
  - اسم البنك
  - رقم IBAN
  - رمز SWIFT (اختياري)
  - العملة
- ✅ إدارة الخزينة النقدية (Safe/Cash Box)
- ✅ معلومات الختم والتوقيع الرسمي

**الحالة الحالية:** ✅ موجود في `Settings` model
**المطلوب:** إنشاء واجهة Frontend لإدارة هذه الإعدادات

---

### 2️⃣ صفحة الفواتير والإيرادات (Invoicing & Revenue)
**الهدف:** تحويل بيانات التسجيل إلى قيود مالية وإصدار فواتير ضريبية

**الوظائف المطلوبة:**
1. **توليد الفاتورة تلقائياً** عند تسجيل طالب جديد:
   - استيراد الرسوم من `StudentFeeCalculation`
   - حساب الضريبة (5%) على المبالغ الخاضعة
   - إنشاء رقم فاتورة فريد
   
2. **إصدار فاتورة ضريبية رسمية** تحتوي على:
   - رقم TRN من الإعدادات
   - تفاصيل الرسوم (دراسية، تسجيل، شهادة، إلخ)
   - المبلغ قبل الضريبة
   - قيمة الضريبة (5%)
   - الإجمالي
   
3. **جدولة الأقساط:**
   - ربط مع `InstallmentPlan` و `Installment`
   - عرض حالة كل قسط (معلق/مدفوع/متأخر)
   
4. **القيد المحاسبي التلقائي:**
```
عند إصدار الفاتورة:
مدين: حساب الطلاب المدينين (Accounts Receivable) = 38,850 AED
   دائن: حساب الإيرادات المؤجلة (Deferred Revenue) = 36,857.14 AED
   دائن: حساب ضريبة المبيعات المستحقة (VAT Payable) = 1,952.86 AED
```

**الحالة الحالية:** ✅ Partial - نظام الرسوم موجود لكن بدون واجهة فواتير
**المطلوب:** إنشاء واجهة عرض وطباعة الفواتير الضريبية

---

### 3️⃣ صفحة المقبوضات وسندات القبض (Receipt Vouchers)
**الهدف:** إثبات دخول السيولة فعلياً وتحديث الأرصدة

**الوظائف المطلوبة:**
1. **واجهة استلام الدفعات:**
   - اختيار الطالب
   - عرض الأقساط المستحقة تلقائياً
   - إدخال المبلغ المدفوع
   - اختيار طريقة الدفع (نقدي، تحويل بنكي، شيك، POS)
   
2. **إصدار سند قبض آلي** يحتوي على:
   - رقم سند فريد
   - اسم المستلم منه (الطالب)
   - المبلغ (بالأرقام والحروف)
   - تاريخ الاستلام
   - طريقة الدفع
   - التوقيع والختم
   
3. **تحديث الأرصدة تلقائياً:**
   - تحديث حالة القسط من "معلق" إلى "مدفوع"
   - خصم المبلغ من رصيد الطالب
   - إضافة المبلغ لرصيد البنك/الخزينة
   
4. **القيد المحاسبي التلقائي:**
```
عند استلام دفعة:
مدين: حساب البنك / الخزينة = 1,500 AED
   دائن: حساب الطلاب المدينين = 1,500 AED
```

**الحالة الحالية:** ❌ غير موجود
**المطلوب:** إنشاء نموذج `Receipt` + واجهة كاملة + طباعة سند

---

### 4️⃣ صفحة المصاريف والموردين (Expenses)
**الهدف:** تتبع خروج الأموال وضريبة المشتريات المستردة

**الوظائف المطلوبة:**
1. **تسجيل المصروف:**
   - اختيار فئة المصروف (إيجار، كهرباء، قرطاسية، رواتب، إلخ)
   - المبلغ قبل الضريبة
   - حساب الضريبة تلقائياً (5%)
   - الإجمالي
   - طريقة الدفع
   - المستلم (المورد)
   
2. **ضريبة المدخلات (Input VAT):**
   - حساب قيمة الضريبة القابلة للاسترداد
   - تسجيلها في حساب منفصل لاستخدامها في الإقرار الضريبي
   
3. **رفع صور الفواتير:**
   - خاصية رفع صورة الفاتورة الأصلية للأرشفة
   
4. **القيد المحاسبي التلقائي:**
```
عند تسجيل مصروف:
مدين: حساب المصروف (حسب النوع) = 10,000 AED
مدين: حساب ضريبة المدخلات (VAT Receivable) = 500 AED
   دائن: حساب البنك / الخزينة = 10,500 AED
```

**الحالة الحالية:** ✅ موجود - Expenses page جاهزة
**المطلوب:** إضافة رفع الصور + ربط القيد المحاسبي

---

### 5️⃣ صفحة الرواتب (Payroll & WPS)
**الهدف:** ربط الموارد البشرية بالمالية وفق قانون الإمارات

**الوظائف المطلوبة:**
1. **إدارة بيانات الموظفين:**
   - الراتب الأساسي
   - البدلات (سكن، مواصلات، هاتف)
   - الاستقطاعات (تأمين، قروض)
   
2. **مسير الرواتب الشهري:**
   - حساب الراتب الإجمالي = الأساسي + البدلات
   - خصم الاستقطاعات
   - الصافي المستحق
   
3. **ملف SIF للـ WPS:**
   - توليد ملف بصيغة SIF متوافق مع نظام حماية الأجور
   - يحتوي على: (رقم الموظف، الاسم، IBAN، الصافي، البنك)
   
4. **القيد المحاسبي التلقائي:**
```
عند صرف الرواتب:
مدين: حساب مصروف الرواتب = 50,000 AED
   دائن: حساب البنك = 50,000 AED
```

**الحالة الحالية:** 🟡 Partial - جدول الموظفين موجود لكن بدون payroll
**المطلوب:** إنشاء نموذج `Payroll` + `PayrollItem` + واجهة + SIF export

---

### 6️⃣ صفحة التقارير المالية (Financial Reports)
**الهدف:** استخراج النتائج النهائية للمدير المالي والمحاسب

**التقارير المطلوبة:**

1. **ميزان المراجعة (Trial Balance):**
   - جميع الحسابات مع أرصدتها المدينة والدائنة
   - التحقق من تساوي طرفي الميزان
   
2. **قائمة الدخل (Income Statement):**
```
الإيرادات:
  + رسوم الطلاب (المحققة فعلياً)
  + إيرادات أخرى
  = إجمالي الإيرادات

المصروفات:
  - الرواتب
  - الإيجار والمرافق
  - المشتريات والقرطاسية
  - الصيانة
  = إجمالي المصروفات
  
صافي الربح = الإيرادات - المصروفات
```

3. **تقرير ضريبة القيمة المضافة (VAT Return):**
```
ضريبة المخرجات (VAT Payable):
  من فواتير الطلاب = +XX,XXX AED
  
ضريبة المدخلات (VAT Receivable):
  من المشتريات والمصروفات = -X,XXX AED
  
صافي الضريبة المستحقة للدفع = الفرق
```

4. **تقرير التدفقات النقدية (Cash Flow):**
   - النقد الداخل (من الطلاب)
   - النقد الخارج (مصروفات + رواتب)
   - صافي التدفق النقدي
   - رصيد البنك والخزينة

**الحالة الحالية:** ❌ غير موجود
**المطلوب:** إنشاء صفحة تقارير كاملة مع Charts

---

### 7️⃣ صفحة الدليل المحاسبي (Chart of Accounts Guide)
**الهدف:** مرجع داخلي يوضح دليل الحسابات وترابط النظام

**الأقسام المطلوبة:**

1. **دليل الحسابات (Chart of Accounts):**

```
1000 - الأصول (Assets)
  1100 - الأصول المتداولة
    1110 - البنك - حساب جاري
    1120 - الخزينة النقدية
    1130 - الطلاب المدينين (Accounts Receivable)
    1140 - ضريبة القيمة المضافة المستردة

2000 - الخصوم (Liabilities)
  2100 - الخصوم المتداولة
    2110 - الموردين الدائنين
    2120 - ضريبة القيمة المضافة المستحقة
    2130 - رواتب مستحقة

3000 - حقوق الملكية (Equity)
  3100 - رأس المال
  3200 - الأرباح المحتجزة

4000 - الإيرادات (Revenue)
  4100 - إيرادات الرسوم الدراسية
  4200 - رسوم التسجيل
  4300 - رسوم الشهادات

5000 - المصروفات (Expenses)
  5100 - الرواتب والأجور
  5200 - الإيجار
  5300 - المرافق (كهرباء، ماء)
  5400 - القرطاسية والمستلزمات
  5500 - الصيانة
```

2. **مخطط ترابط الصفحات:**
   - جدول يوضح كيف تتفاعل الصفحات مع بعضها محاسبياً
   
3. **أمثلة عملية:**
   - سيناريوهات محاسبية كاملة من البداية للنهاية

**الحالة الحالية:** ❌ غير موجود
**المطلوب:** إنشاء صفحة توثيقية تعليمية

---

## 🗄️ النماذج (Models) المطلوبة في قاعدة البيانات

### نماذج جديدة مطلوبة:

```prisma
// نموذج الحساب المحاسبي
model Account {
  id            String   @id @default(uuid())
  code          String   @unique // e.g. "1110"
  name          String
  nameAr        String
  type          AccountType // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentId      String?
  balance       Decimal  @default(0) @db.Decimal(15, 2)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  journalEntries JournalEntry[]
}

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

// نموذج القيد المحاسبي
model JournalEntry {
  id              String   @id @default(uuid())
  entryNumber     String   @unique
  date            DateTime @db.Date
  description     String
  referenceType   String?  // INVOICE, PAYMENT, EXPENSE, PAYROLL
  referenceId     String?
  createdBy       String?
  isPosted        Boolean  @default(false)
  createdAt       DateTime @default(now())
  
  lines JournalLine[]
}

// سطور القيد
model JournalLine {
  id        String  @id @default(uuid())
  entryId   String
  accountId String
  debit     Decimal @default(0) @db.Decimal(15, 2)
  credit    Decimal @default(0) @db.Decimal(15, 2)
  notes     String?
  
  entry   JournalEntry @relation(fields: [entryId], references: [id])
  account Account      @relation(fields: [accountId], references: [id])
}

// نموذج سند القبض
model Receipt {
  id            String        @id @default(uuid())
  receiptNumber String        @unique
  studentId     String
  amount        Decimal       @db.Decimal(10, 2)
  paymentMethod PaymentMethod
  referenceNo   String?
  receivedDate  DateTime      @db.Date
  notes         String?
  receivedBy    String?
  journalEntryId String?
  createdAt     DateTime      @default(now())
  
  student Student @relation(fields: [studentId], references: [id])
}

// نموذج مسير الرواتب
model Payroll {
  id            String   @id @default(uuid())
  month         DateTime @db.Date
  totalGross    Decimal  @db.Decimal(15, 2)
  totalNet      Decimal  @db.Decimal(15, 2)
  status        String   @default("DRAFT") // DRAFT, APPROVED, PAID
  approvedBy    String?
  paidDate      DateTime? @db.Date
  journalEntryId String?
  sifFileUrl    String?
  createdAt     DateTime @default(now())
  
  items PayrollItem[]
}

model PayrollItem {
  id           String  @id @default(uuid())
  payrollId    String
  employeeId   String
  basicSalary  Decimal @db.Decimal(10, 2)
  allowances   Decimal @default(0) @db.Decimal(10, 2)
  deductions   Decimal @default(0) @db.Decimal(10, 2)
  netSalary    Decimal @db.Decimal(10, 2)
  
  payroll  Payroll  @relation(fields: [payrollId], references: [id])
  employee Employee @relation(fields: [employeeId], references: [id])
}
```

---

## 📁 هيكل الملفات المطلوب

```
institute-erp/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma (تحديث)
│   ├── src/
│   │   └── modules/
│   │       ├── finance/
│   │       │   ├── accounting/
│   │       │   │   ├── accounts.controller.ts
│   │       │   │   ├── accounts.service.ts
│   │       │   │   ├── accounts.validation.ts
│   │       │   │   ├── journal.controller.ts
│   │       │   │   ├── journal.service.ts
│   │       │   │   └── reports.service.ts
│   │       │   ├── invoices/
│   │       │   │   ├── invoices.controller.ts
│   │       │   │   ├── invoices.service.ts
│   │       │   │   └── invoices.validation.ts
│   │       │   ├── receipts/
│   │       │   │   ├── receipts.controller.ts
│   │       │   │   ├── receipts.service.ts
│   │       │   │   └── receipts.validation.ts
│   │       │   └── payroll/
│   │       │       ├── payroll.controller.ts
│   │       │       ├── payroll.service.ts
│   │       │       ├── wps.service.ts (SIF generation)
│   │       │       └── payroll.validation.ts
│   │       └── settings/
│   │           ├── financial-settings.controller.ts
│   │           └── financial-settings.service.ts
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── FinancialSettings.tsx
│       │   ├── FinancialSettings.css
│       │   ├── Invoices.tsx
│       │   ├── Invoices.css
│       │   ├── Receipts.tsx
│       │   ├── Receipts.css
│       │   ├── Payroll.tsx (تطوير الموجود)
│       │   ├── FinancialReports.tsx
│       │   ├── FinancialReports.css
│       │   ├── ChartOfAccounts.tsx
│       │   └── ChartOfAccounts.css
│       └── services/
│           ├── accounting.service.ts
│           ├── invoice.service.ts
│           ├── receipt.service.ts
│           └── payroll.service.ts
```

---

## 📅 خطة التنفيذ المرحلية

### المرحلة 1: البنية التحتية (الأسبوع 1) ✅ **مكتملة**
- [x] مراجعة الـ Schema الحالي
- [x] إضافة نماذج المحاسبة (Account, JournalEntry, JournalLine)
- [x] إضافة نموذج Receipt (سندات القبض)
- [x] إضافة نماذج PayrollSheet & PayrollItem
- [x] تشغيل Migration: `add_accounting_module`
- [x] توثيق النماذج: `ACCOUNTING_MODELS_SUMMARY.md`

**الإنجازات:**
- ✅ 7 نماذج جديدة (Account, JournalEntry, JournalLine, Receipt, PayrollSheet, PayrollItem, TrialBalance)
- ✅ 2 Enums جديدة (AccountType, PayrollStatus)  
- ✅ 12 Index للأداء الأمثل
- ✅ Relations محدّثة في Student & Employee models
- ✅ Migration ناجح على قاعدة البيانات

**الملفات المنشأة:**
- `FINANCIAL_ACCOUNTING_MASTER_PLAN.md` - الخطة الشاملة
- `ACCOUNTING_MODELS_SUMMARY.md` - ملخص النماذج المضافة

---

### المرحلة 2: الإعدادات المالية (الأسبوع 1-2) 🔄 **قيد التنفيذ**
- [ ] Backend: Financial Settings API
- [ ] Frontend: صفحة الإعدادات المالية
- [ ] ربط TRN و VAT مع باقي النظام

### المرحلة 3: الفواتير والإيرادات (الأسبوع 2-3)
- [ ] Backend: Invoices API + PDF generation
- [ ] Frontend: صفحة الفواتير
- [ ] ربط مع StudentFeeCalculation
- [ ] توليد القيود المحاسبية تلقائياً

### المرحلة 4: المقبوضات (الأسبوع 3-4)
- [ ] Backend: Receipts API + PDF generation
- [ ] Frontend: صفحة سندات القبض
- [ ] ربط مع Payments و Installments
- [ ] توليد القيود المحاسبية

### المرحلة 5: تطوير المصاريف (الأسبوع 4)
- [ ] إضافة رفع الصور للمصروفات
- [ ] ربط المصاريف بالقيود المحاسبية
- [ ] حساب ضريبة المدخلات

### المرحلة 6: الرواتب و WPS (الأسبوع 5)
- [ ] Backend: Payroll API
- [ ] Frontend: تطوير صفحة Payroll
- [ ] WPS SIF File Generation
- [ ] ربط بالقيود المحاسبية

### المرحلة 7: التقارير المالية (الأسبوع 6)
- [ ] Backend: Reports API
- [ ] Frontend: صفحة التقارير
- [ ] Trial Balance
- [ ] Income Statement
- [ ] VAT Return
- [ ] Cash Flow

### المرحلة 8: الدليل المحاسبي (الأسبوع 7)
- [ ] إنشاء Chart of Accounts كامل
- [ ] صفحة الدليل التعليمية
- [ ] التوثيق الكامل

---

## ✅ معايير القبول (Acceptance Criteria)

### للإعدادات المالية:
- [x] يمكن إدخال وحفظ TRN (15 رقم)
- [x] يمكن تعيين نسبة الضريبة (5%)
- [x] يمكن إدارة حسابات بنكية متعددة

### للفواتير:
- [ ] توليد فاتورة ضريبية تلقائياً عند تسجيل طالب
- [ ] طباعة الفاتورة بصيغة PDF
- [ ] ظهور TRN على الفاتورة
- [ ] عرض تفاصيل الأقساط

### للمقبوضات:
- [ ] إصدار سند قبض عند استلام دفعة
- [ ] تحديث حالة القسط تلقائياً
- [ ] طباعة سند القبض

### للرواتب:
- [ ] حساب الصافي = الأساسي + البدلات - الاستقطاعات
- [ ] توليد ملف SIF
- [ ] ربط بالحسابات المحاسبية

### للتقارير:
- [ ] تساوي طرفي ميزان المراجعة
- [ ] صحة حساب قائمة الدخل
- [ ] دقة تقرير الضريبة

---

## 🎯 المؤشرات الرئيسية (KPIs)

1. **دقة البيانات:** التطابق 100% بين القيود والأرصدة
2. **الأتمتة:** 90% من القيود تولد تلقائياً
3. **الامتثال الضريبي:** جاهزية 100% للإقرار الضريبي
4. **السرعة:** إصدار فاتورة في أقل من 5 ثواني
5. **التكامل:** ترابط 100% بين جميع الصفحات

---

## 📚 المراجع والمعايير

- IFRS 15: Revenue from Contracts with Customers
- UAE VAT Law: Federal Decree-Law No. 8 of 2017
- WPS: UAE Wage Protection System
- Double Entry Bookkeeping Principles
- UAE Chart of Accounts Standards

---

**تم إعداد هذه الخطة بواسطة:** خبير محاسبي محترف  
**تاريخ آخر تحديث:** 2026-02-11  
**الحالة:** جاهز للتنفيذ 🚀
