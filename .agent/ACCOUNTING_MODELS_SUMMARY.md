# ملخص النماذج المحاسبية المضافة
## Accounting Module - Database Models Summary

**تاريخ الإضافة:** 2026-02-11  
**حالة Migration:** ✅ مكتمل  
**اسم Migration:** `add_accounting_module`

---

## 📊 النماذج المضافة (6 Models + 2 Enums)

### 1. Account (الحسابات المحاسبية)
**الجدول:** `accounts`  
**الهدف:** دليل الحسابات (Chart of Accounts) - القلب النابض للنظام المحاسبي

```prisma
model Account {
  id          String      @id @default(uuid())
  code        String      @unique // e.g. "1110", "4100"
  name        String      // e.g. "Bank Account"
  nameAr      String      @map("name_ar")
  type        AccountType // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
  parentId    String?     @map("parent_id")
  balance     Decimal     @default(0)
  isActive    Boolean     @default(true)
  description String?
}
```

**الحقول الرئيسية:**
- `code`: رمز الحساب (1110 = البنك، 4100 = إيرادات الرسوم)
- `type`: نوع الحساب (أصول، خصوم، حقوق ملكية، إيرادات، مصروفات)
- `parentId`: للحسابات الهرمية
- `balance`: الرصيد الحالي

**الاستخدام:**
```typescript
// مثال: إنشاء حساب البنك
const bankAccount = await prisma.account.create({
  data: {
    code: "1110",
    name: "Emirates NBD - Current Account",
    nameAr: "بنك الإمارات دبي الوطني - حساب جاري",
    type: "ASSET",
    balance: 150000.00
  }
});
```

---

### 2. JournalEntry (القيد المحاسبي)
**الجدول:** `journal_entries`  
**الهدف:** تسجيل جميع القيود المحاسبية (مبدأ القيد المزدوج)

```prisma
model JournalEntry {
  id              String   @id @default(uuid())
  entryNumber     String   @unique
  date            DateTime
  description     String
  referenceType   String?  // INVOICE, PAYMENT, EXPENSE, PAYROLL, RECEIPT
  referenceId     String?  // Link to source transaction
  isPosted        Boolean  @default(false)
  postedBy        String?
  postedAt        DateTime?
  createdBy       String?
}
```

**الحقول الرئيسية:**
- `entryNumber`: رقم القيد الفريد (JE-2026-001)
- `referenceType`: نوع المصدر (فاتورة، دفعة، مصروف، راتب)
- `isPosted`: هل القيد معتمد؟ (القيود المعتمدة لا يمكن تعديلها)

**الاستخدام:**
```typescript
// مثال: إصدار قيد عند استلام دفعة
const entry = await prisma.journalEntry.create({
  data: {
    entryNumber: "JE-2026-001",
    date: new Date(),
    description: "استلام دفعة من الطالب أحمد",
    referenceType: "PAYMENT",
    referenceId: paymentId,
    lines: {
      create: [
        { accountId: bankId, debit: 1500, credit: 0 },
        { accountId: receivablesId, debit: 0, credit: 1500 }
      ]
    }
  }
});
```

---

### 3. JournalLine (سطر القيد)
**الجدول:** `journal_lines`  
**الهدف:** سطور القيد المحاسبي (مدين/دائن)

```prisma
model JournalLine {
  id        String  @id @default(uuid())
  entryId   String
  accountId String
  debit     Decimal @default(0)
  credit    Decimal @default(0)
  notes     String?
}
```

**قاعدة هامة:**  
في القيد المزدوج: **مجموع المدين = مجموع الدائن**
- إما debit أو credit (ليس الاثنين معاً)
- كل قيد محاسبي يحتوي على سطرين على الأقل

---

### 4. Receipt (سند القبض)
**الجدول:** `receipts`  
**الهدف:** تسجيل سندات القبض للطلاب

```prisma
model Receipt {
  id              String        @id @default(uuid())
  receiptNumber   String        @unique
  studentId       String
  amount          Decimal
  amountInWords   String?
  paymentMethod   PaymentMethod
  referenceNo     String?
  receivedDate    DateTime
  notes           String?
  purpose         String?
  receivedBy      String?
  journalEntryId  String?  // Link to accounting entry
}
```

**الحقول الرئيسية:**
- `receiptNumber`: رقم السند (REC-2026-001)
- `amountInWords`: المبلغ بالحروف (خمسة آلاف درهم)
- `journalEntryId`: ربط بالقيد المحاسبي المقابل

**الاستخدام:**
```typescript
// مثال: إصدار سند قبض
const receipt = await prisma.receipt.create({
  data: {
    receiptNumber: "REC-2026-001",
    studentId: studentId,
    amount: 1500,
    amountInWords: "One Thousand Five Hundred Dirhams",
    paymentMethod: "CASH",
    receivedDate: new Date(),
    purpose: "First installment payment",
    receivedBy: userId
  }
});
```

---

### 5. PayrollSheet (مسير الرواتب)
**الجدول:** `payroll_sheets`  
**الهدف:** مسير رواتب شهري شامل لجميع الموظفين

```prisma
model PayrollSheet {
  id             String        @id @default(uuid())
  payrollNumber  String        @unique
  month          DateTime
  monthName      String?
  totalGross     Decimal
  totalAllowances Decimal      @default(0)
  totalDeductions Decimal      @default(0)
  totalNet       Decimal
  status         PayrollStatus @default(DRAFT)
  approvedBy     String?
  approvedAt     DateTime?
  paidDate       DateTime?
  paymentMethod  PaymentMethod @default(BANK_TRANSFER)
  journalEntryId String?
  sifFileUrl     String?  // WPS SIF file
  sifGeneratedAt DateTime?
  notes          String?
}
```

**الحقول الرئيسية:**
- `payrollNumber`: رقم المسير (PAY-2026-01)
- `status`: DRAFT, APPROVED, PAID, CANCELLED
- `sifFileUrl`: ملف WPS (Wage Protection System) للإمارات

**الاستخدام:**
```typescript
// مثال: إنشاء مسير رواتب شهري
const payroll = await prisma.payrollSheet.create({
  data: {
    payrollNumber: "PAY-2026-01",
    month: new Date("2026-01-01"),
    monthName: "January 2026",
    totalGross: 50000,
    totalNet: 47500,
    status: "DRAFT"
  }
});
```

---

### 6. PayrollItem (عنصر في المسير)
**الجدول:** `payroll_items`  
**الهدف:** تفاصيل راتب كل موظف في المسير

```prisma
model PayrollItem {
  id            String  @id @default(uuid())
  payrollId     String
  employeeId    String
  basicSalary   Decimal
  housingAllowance      Decimal @default(0)
  transportAllowance    Decimal @default(0)
  phoneAllowance        Decimal @default(0)
  otherAllowances       Decimal @default(0)
  totalAllowances       Decimal
  insurance             Decimal @default(0)
  loans                 Decimal @default(0)
  otherDeductions       Decimal @default(0)
  totalDeductions       Decimal
  grossSalary   Decimal  // Basic + Allowances
  netSalary     Decimal  // Gross - Deductions
  bankName      String?
  iban          String?
  notes         String?
}
```

**الحسابات:**
- `grossSalary` = `basicSalary` + `totalAllowances`
- `netSalary` = `grossSalary` - `totalDeductions`

---

### 7. TrialBalance (ميزان المراجعة - Cache)
**الجدول:** `trial_balance_cache`  
**الهدف:** Cache لتحسين أداء تقارير ميزان المراجعة

```prisma
model TrialBalance {
  id          String   @id @default(uuid())
  accountId   String
  accountCode String
  accountName String
  debit       Decimal
  credit      Decimal
  asOfDate    DateTime
  generatedAt DateTime @default(now())
}
```

---

## 🔄 العلاقات المضافة (Relations)

### في Student Model:
```prisma
receipts  Receipt[]  // سندات القبض للطالب
```

### في Employee Model:
```prisma
oldPayrollRecords  Payroll[]      @relation("OldPayrollRecords")
payrollItems       PayrollItem[]  // عناصر الرواتب الجديدة
```

---

## 📝 Enums المضافة

### 1. AccountType
```prisma
enum AccountType {
  ASSET      // أصول
  LIABILITY  // خصوم
  EQUITY     // حقوق الملكية
  REVENUE    // إيرادات
  EXPENSE    // مصروفات
}
```

### 2. PayrollStatus
```prisma
enum PayrollStatus {
  DRAFT      // مسودة
  APPROVED   // معتمد
  PAID       // مدفوع
  CANCELLED  // ملغي
}
```

---

## ✅ Indexes المضافة

لتحسين الأداء، تم إضافة Indexes على:

### Account:
- `type` - للبحث حسب نوع الحساب
- `code` - للبحث السريع بالرمز

### JournalEntry:
- `date` - لتصفية القيود حسب التاريخ
- `(referenceType, referenceId)` - للربط مع المصادر

### JournalLine:
- `entryId` - للاستعلام عن سطور قيد معين
- `accountId` - للحصول على عمليات حساب معين

### Receipt:
- `studentId` - لعرض سندات طالب معين
- `receivedDate` - لتصفية السندات حسب التاريخ

### PayrollSheet:
- `month` - للبحث حسب الشهر
- `status` - لتصفية حسب الحالة

### PayrollItem:
- `employeeId` - لعرض سجلات راتب موظف معين

---

## 🔗 مخطط الترابط المحاسبي

```
Transaction → JournalEntry → JournalLines → Accounts
     ↓              ↓            ↓              ↓
  Receipt      (JE-001)    [Debit: Bank]   [Balance +]
  Payment                  [Credit: AR]    [Balance -]
  Expense
  Payroll
```

---

## 🎯 الخطوات التالية

1. ✅ **Database Migration** - مكتمل
2. ⏳ **إنشاء Services** للعمليات المحاسبية
3. ⏳ **إنشاء Controllers** للـ API
4. ⏳ **إنشاء Validation Schemas**
5. ⏳ **إنشاء واجهات Frontend**

---

## 📚 مراجع مفيدة

- **Double Entry Bookkeeping**: كل قيد يجب أن يكون طرفاه متساويين
- **Trial Balance**: مجموع المدين = مجموع الدائن
- **Accounting Equation**: Assets = Liabilities + Equity

---

**تم التحديث:** 2026-02-11  
**الحالة:** ✅ جاهز للتطوير على Backend & Frontend
