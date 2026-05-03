# 🚀 الخطوات التالية - النظام المالي والمحاسبي
**آخر تحديث:** 2026-02-11  
**المرحلة الحالية:** 2 من 8  
**الحالة:** 🔄 قيد التنفيذ

---

## ✅ ما تم إنجازه

- ✅ **المرحلة 1:** البنية التحتية (Database Models) - **مكتملة 100%**
  - 7 نماذج جديدة
  - 2 Enums
  - 12 Indexes
  - Migration ناجح

---

## 🎯 المرحلة 2: الإعدادات المالية (Current)

### الأولوية 1: صفحة الإعدادات المالية ⭐⭐⭐
**الهدف:** إنشاء "دماغ" النظام المالي الذي يغذي جميع الصفحات

#### Backend Tasks:
- [ ] **Financial Settings Controller**
  - `GET /api/settings/financial` - Get current settings
  - `PUT /api/settings/financial` - Update settings
  - `POST /api/settings/bank-accounts` - Add bank account
  - `PUT /api/settings/bank-accounts/:id` - Update bank account
  - `DELETE /api/settings/bank-accounts/:id` - Delete bank account

- [ ] **Validation Schema (Zod)**
  ```typescript
  // financial-settings.validation.ts
  - TRN: must be 15 digits
  - VAT Rate: 0-100%
  - IBAN: valid format
  - Bank details validation
  ```

#### Frontend Tasks:
- [ ] **Page: FinancialSettings.tsx**
  - Tab 1: معلومات المنشأة (Institute Info)
    - TRN Input (15 رقماً)
    - VAT Rate (افتراضي 5%)
    - العملة الرسمية (AED)
  
  - Tab 2: الحسابات البنكية (Bank Accounts)
    - جدول الحسابات البنكية
    - إضافة/تعديل/حذف حساب
    - IBAN, SWIFT, Currency
  
  - Tab 3: الخزينة النقدية (Cash Box)
    - الرصيد الافتتاحي
    - حد الخزينة الأقصى
  
  - Tab 4: معلومات الختم والتوقيع
    - رفع صورة الختم
    - توقيعات المعتمدين

- [ ] **Service: financial-settings.service.ts**
  ```typescript
  - getFinancialSettings()
  - updateFinancialSettings(data)
  - getBankAccounts()
  - createBankAccount(data)
  - updateBankAccount(id, data)
  - deleteBankAccount(id)
  ```

- [ ] **Styling: FinancialSettings.css**
  - Ultimate 2026 Design
  - Orange theme
  - Tabs navigation
  - Cards for each section

---

## 🎯 المرحلة 3: دليل الحسابات (Chart of Accounts)

### الأولوية 2: صفحة دليل الحسابات ⭐⭐⭐
**الهدف:** إنشاء وإدارة جميع الحسابات المحاسبية

#### Backend Tasks:
- [ ] **Accounts Controller**
  - `GET /api/accounting/accounts` - List all accounts
  - `GET /api/accounting/accounts/:id` - Get account by ID
  - `POST /api/accounting/accounts` - Create account
  - `PUT /api/accounting/accounts/:id` - Update account
  - `DELETE /api/accounting/accounts/:id` - Delete account (if no transactions)
  - `GET /api/accounting/accounts/tree` - Get hierarchical tree
  - `POST /api/accounting/accounts/seed-defaults` - Seed default chart of accounts

- [ ] **Accounts Service**
  ```typescript
  - createAccount(data)
  - updateAccount(id, data)
  - deleteAccount(id)
  - getAccount(id)
  - getAllAccounts(filters)
  - getAccountTree()
  - seedDefaultAccounts() // الدليل الموحد الافتراضي
  - getAccountBalance(id, asOfDate?)
  ```

- [ ] **Default Chart of Accounts (Seed Data)**
  ```
  1000 - الأصول
    1100 - الأصول المتداولة
      1110 - البنك - حساب جاري
      1120 - الخزينة النقدية
      1130 - الطلاب المدينين
      1140 - ضريبة القيمة المضافة المستردة
    1200 - الأصول الثابتة
      1210 - أثاث ومعدات
      1220 - أجهزة كمبيوتر

  2000 - الخصوم
    2100 - الخصوم المتداولة
      2110 - الموردين الدائنين
      2120 - ضريبة القيمة المضافة المستحقة
      2130 - رواتب مستحقة الدفع

  3000 - حقوق الملكية
    3100 - رأس المال
    3200 - الأرباح المحتجزة

  4000 - الإيرادات
    4100 - إيرادات الرسوم الدراسية
    4200 - رسوم التسجيل
    4300 - رسوم الشهادات
    4400 - إيرادات أخرى

  5000 - المصروفات
    5100 - الرواتب والأجور
    5200 - الإيجار
    5300 - المرافق (كهرباء، ماء)
    5400 - القرطاسية والمستلزمات
    5500 - الصيانة
    5600 - التسويق والإعلان
    5700 - مصروفات إدارية
  ```

#### Frontend Tasks:
- [ ] **Page: ChartOfAccounts.tsx**
  - عرض شجري (Tree View) للحسابات
  - إضافة حساب جديد
  - تعديل حساب موجود
  - حذف حساب (بدون معاملات)
  - عرض الرصيد الحالي
  - تصفية حسب النوع
  - بحث بالرمز أو الاسم

- [ ] **Components:**
  - `AccountTreeNode.tsx` - عقدة في الشجرة
  - `AccountModal.tsx` - modal للإضافة/التعديل
  - `AccountCard.tsx` - card لعرض تفاصيل الحساب

---

## 🎯 المرحلة 4: القيود المحاسبية

### الأولوية 3: نظام القيود اليدوية ⭐⭐
**الهدف:** السماح بإدخال قيود يدوية للمحاسب

#### Backend Tasks:
- [ ] **Journal Entry Controller**
  - `POST /api/accounting/journal-entries` - Create entry
  - `GET /api/accounting/journal-entries` - List entries
  - `GET /api/accounting/journal-entries/:id` - Get entry
  - `PUT /api/accounting/journal-entries/:id` - Update (if not posted)
  - `DELETE /api/accounting/journal-entries/:id` - Delete (if not posted)
  - `POST /api/accounting/journal-entries/:id/post` - Post entry (make final)
  - `GET /api/accounting/journal-entries/generate-number` - Get next number

- [ ] **Journal Entry Service**
  ```typescript
  - createJournalEntry(data) // مع التحقق: Debit = Credit
  - updateJournalEntry(id, data) // فقط إذا isPosted = false
  - deleteJournalEntry(id) // فقط إذا isPosted = false
  - postJournalEntry(id) // اعتماد القيد + تحديث الأرصدة
  - generateEntryNumber() // JE-2026-XXXX
  - validateBalance(lines) // التحقق من التوازن
  - updateAccountBalances(entryId) // تحديث أرصدة الحسابات
  ```

#### Frontend Tasks:
- [ ] **Page: JournalEntries.tsx**
  - جدول القيود مع حالة (Posted/Draft)
  - زر إضافة قيد جديد
  - معاينة تفاصيل القيد
  - طباعة القيد
  
- [ ] **Component: JournalEntryModal.tsx**
  - نموذج إدخال القيد:
    - التاريخ
    - الوصف
    - جدول السطور (Lines):
      - اختيار الحساب
      - مدين
      - دائن
      - ملاحظات
    - عرض الإجماليات (Total Debit / Total Credit)
    - تحذير إذا غير متوازن
    - زر حفظ (Draft)
    - زر إعتماد (Post)

---

## 🎯 المرحلة 5: سندات القبض

### الأولوية 4: نظام سندات القبض ⭐⭐⭐
**الهدف:** تسجيل وطباعة سندات القبض للطلاب

#### Backend Tasks:
- [ ] **Receipts Controller**
  - `POST /api/accounting/receipts` - Create receipt
  - `GET /api/accounting/receipts` - List receipts
  - `GET /api/accounting/receipts/:id` - Get receipt
  - `GET /api/accounting/receipts/:id/pdf` - Generate PDF
  - `PUT /api/accounting/receipts/:id` - Update receipt
  - `DELETE /api/accounting/receipts/:id` - Delete receipt
  - `GET /api/accounting/receipts/generate-number` - Get next number

- [ ] **Receipts Service**
  ```typescript
  - createReceipt(data) → Receipt + JournalEntry + Update Payment
  - generateReceiptNumber() // REC-2026-XXXX
  - generateReceiptPDF(id) // PDF Generator
  - convertAmountToWords(amount, currency) // "Five Thousand Dirhams"
  - createReceiptJournalEntry(receiptId) // قيد تلقائي
  ```

- [ ] **PDF Generator**
  - استخدام مكتبة (مثل PDFKit أو Puppeteer)
  - تصميم سند احترافي
  - معلومات المعهد + TRN
  - تفاصيل الدفعة
  - التوقيع والختم

#### Frontend Tasks:
- [ ] **Page: Receipts.tsx**
  - جدول السندات مع بحث
  - معاينة السند
  - طباعة السند
  - زر إضافة سند جديد

- [ ] **Component: ReceiptModal.tsx**
  - اختيار الطالب
  - عرض الأقساط المستحقة
  - إدخال المبلغ
  - اختيار طريقة الدفع
  - رقم المرجع (شيك، حوالة)
  - الغرض من الدفع
  - ملاحظات

- [ ] **Component: ReceiptVoucher.tsx**
  - عرض السند للطباعة
  - معلومات المعهد
  - تفاصيل الدفعة
  - المبلغ بالأرقام والحروف
  - التوقيع والختم

---

## 🎯 المرحلة 6: تطوير نظام الرواتب

### الأولوية 5: Payroll System ⭐⭐⭐
**الهدف:** نظام شامل للرواتب مع WPS

#### Backend Tasks:
- [ ] **Payroll Controller**
  - `POST /api/payroll/sheets` - Create payroll sheet
  - `GET /api/payroll/sheets` - List sheets
  - `GET /api/payroll/sheets/:id` - Get sheet
  - `PUT /api/payroll/sheets/:id` - Update (if DRAFT)
  - `POST /api/payroll/sheets/:id/approve` - Approve
  - `POST /api/payroll/sheets/:id/pay` - Mark as paid
  - `GET /api/payroll/sheets/:id/sif` - Generate SIF file
  - `GET /api/payroll/sheets/:id/pdf` - Generate PDF

-[] **Payroll Service**
  ```typescript
  - createPayrollSheet(month) // إنشاء مسير جديد
  - addEmployeeToPayroll(sheetId, employeeId) // إضافة موظف
  - calculatePayrollItem(employeeId, month) // حساب الراتب
  - calculateTotals(sheetId) // إجماليات المسير
  - approvePayroll(sheetId) // اعتماد
  - generateSIFFile(sheetId) // توليد ملف WPS
  - generateJournalEntry(sheetId) // قيد محاسبي
  ```

- [ ] **WPS SIF Generator**
  - تنسيق SIF حسب Central Bank UAE
  - حقول: Employee ID, Name, IBAN, Bank, Amount, etc.
  - Validation حسب المعايير

#### Frontend Tasks:
- [ ] **Page: Payroll.tsx (تطوير الموجود)**
  - قائمة المسيرات الشهرية
  - إنشاء مسير جديد
  - عرض تفاصيل المسير
  - اعتماد ودفع
  - تنزيل SIF
  - طباعة المسير

- [ ] **Component: PayrollSheetModal.tsx**
  - جدول الموظفين
  - تفاصيل كل موظف (Salary breakdown)
  - الإجماليات
  - حالات Workflow

---

## 🎯 المرحلة 7: الربط التلقائي

### الأولوية 6: Auto Journal Entry Generation ⭐⭐⭐
**الهدف:** توليد القيود تلقائياً من العمليات

#### Tasks:
- [ ] **ربط الفواتير:**
  - عند إصدار فاتورة للطالب → قيد تلقائي
  - Debit: حساب الطلاب المدينين
  - Credit: حساب الإيرادات المؤجلة
  - Credit: ضريبة المبيعات

- [ ] **ربط المقبوضات:**
  - عند استلام دفعة → قيد تلقائي
  - Debit: حساب البنك/الخزينة
  - Credit: حساب الطلاب المدينين

- [ ] **ربط المصاريف:**
  - عند تسجيل مصروف → قيد تلقائي
  - Debit: حساب المصروف
  - Debit: ضريبة المدخلات
  - Credit: حساب البنك/الخزينة

- [ ] **ربط الرواتب:**
  - عند دفع الرواتب → قيد تلقائي
  - Debit: حساب مصروف الرواتب
  - Credit: حساب البنك

---

## 🎯 المرحلة 8: التقارير المالية

### الأولوية 7: Financial Reports ⭐⭐⭐
**الهدف:** تقارير مالية شاملة

#### Backend Tasks:
- [ ] **Reports Controller**
  - `GET /api/reports/trial-balance` - ميزان المراجعة
  - `GET /api/reports/income-statement` - قائمة الدخل
  - `GET /api/reports/balance-sheet` - الميزانية
  - `GET /api/reports/cash-flow` - التدفقات النقدية
  - `GET /api/reports/vat-return` - تقرير الضريبة

- [ ] **Reports Service**
  ```typescript
  - generateTrialBalance(asOfDate)
  - generateIncomeStatement(startDate, endDate)
  - generateBalanceSheet(asOfDate)
  - generateCashFlow(startDate, endDate)
  - generateVATReturn(startDate, endDate)
  ```

#### Frontend Tasks:
- [ ] **Page: FinancialReports.tsx**
  - Tabs للتقارير المختلفة
  - فلاتر التاريخ
  - عرض Charts
  - تصدير PDF/Excel
  - طباعة

- [ ] **Charts:**
  - Revenue vs Expenses
  - Account Balances
  - VAT Summary

---

## 📋 Checklist - المرحلة 2

### Week 1-2: Financial Settings & Chart of Accounts

- [ ] **Day 1-2:** Backend - Financial Settings API
- [ ] **Day 3-4:** Frontend - Financial Settings Page
- [ ] **Day 5-6:** Backend - Accounts API + Seed Data
- [ ] **Day 7-8:** Frontend - Chart of Accounts Page
- [ ] **Day 9-10:** Testing & Integration

---

## 🎯 الأولويات

| المهمة | الأولوية | الحالة |
|--------|----------|---------|
| Financial Settings | ⭐⭐⭐ | ⏳ التالي |
| Chart of Accounts | ⭐⭐⭐ | ⏳ |
| Journal Entries | ⭐⭐ | ⏳ |
| Receipts | ⭐⭐⭐ | ⏳ |
| Payroll | ⭐⭐⭐ | ⏳ |
| Auto Entries | ⭐⭐⭐ | ⏳ |
| Reports | ⭐⭐⭐ | ⏳ |

---

**تحديث تلقائي:** يتم تحديث هذا الملف مع كل إنجاز جديد ✨
