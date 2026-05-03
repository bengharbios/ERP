# Institute ERP - Ultimate 2026 Detailed Master Prompt

## 1. Project Vision & Architecture
**Philosophy:** Build the **"Ultimate 2026 Institute ERP"** - a futuristic, highly responsive, and deeply integrated system prioritizing **Student-Centric** management and **IFRS-15 Compliant** Finance.
-   **Visual Language:** "Glassmorphism 2.0" (Translucent layers, Blur Effects, Vibrant Gradients).
-   **Navigation:** Seamless transitions. Every entity (Student, Payment, Grade) is intertwined.
-   **Tech:** React (Vite) + Node.js (Express) + Prisma (PostgreSQL).

---

## 2. The Student Lifecycle & Data Richness

### A. The Student Hub (`/students`)
**Objective:** The command center for student operations.
-   **List View:** Smart table with key columns: Avatar, Full Name (Ar/En), Student ID, Program, Status (Active/Graduated), Balance Due.
-   **Smart Filters:** "Program Level" (High School/Diploma), "Payment Status" (Overdue/Paid), "Academic Standing".
-   **Bulk Actions:** Select students -> "Generate Invoice", "Enroll in Class", "Change Status".

### B. Student Profile (`/students/:id`) - The "Data Warehouse"
**Objective:** A single page containing **ALL** student data points.
-   **Header:** Quick Stats (Cumulative GPA, Attendance %, Total Outstanding Balance).
-   **Detailed Technical Data:**
    -   **Identity:** National ID/Passport (Number, Issued Date, Expiry Date), Date of Birth, Gender, Nationality.
    -   **Contact:** Mobile 1 (Student), Mobile 2 (WhastApp), Email, Address (City, Area, Street, Building No).
    -   **Guardians:**
        -   **Father:** Name, Mobile, Job Title, National ID.
        -   **Mother:** Name, Mobile.
        -   **Emergency:** Contact Name, Relation, Phone.
    -   **Academic History:** Previous School/University, Graduation Year, Grades obtained.
    -   **Medical/Special Needs:** Notes field for allergies or meaningful disabilities.
    -   **System:** Username, Password Reset, Role (Student).

### C. Fee Calculation Logic (`StudentFeeCalculation`)
**Objective:** Precise financial tracking.
-   **Formula:**
    1.  **Base Tuition:** Fetch from `FeeTemplate` (e.g., "HND Computing Year 1" = 15,000 SAR).
    2.  **Add-ons:** + Registration Fee (500 SAR) + Books (1,000 SAR) + Uniform (200 SAR).
    3.  **Discounts:** - Scholarship (10%) OR - Sibling Discount (500 SAR).
    4.  **Tax:** + VAT (15% on Taxable Items).
    5.  **Net Total:** = (Base + Add-ons - Discounts) * 1.15.
-   **Installment Logic:**
    -   **Down Payment:** 20% due immediately upon registration.
    -   **Schedule:** Remaining 80% divided into 4 equal monthly installments.
    -   **Due Dates:** 1st of every month starting the month after registration.

### D. Academic Distribution & Scheduling

#### 1. Program Structure
-   **Program:** "BTEC Level 5 HND in Computing".
-   **Units (Subjects):**
    -   Unit 1: Programming (15 Credits).
    -   Unit 2: Networking (15 Credits).
    -   Unit 3: Professional Practice (15 Credits).
    -   **Total:** 8 Units per Year = 120 Credits.

#### 2. Class & Session Distribution
-   **Class:** "Computing Fall 2026 - Cohort A".
-   **Term Duration:** 12 Weeks.
-   **Weekly Schedule:**
    -   **Unit 1 (Programming):** 2 Lectures/week (Sunday & Tuesday, 10:00 - 12:00).
    -   **Unit 2 (Networking):** 1 Lab/week (Monday, 14:00 - 17:00).
    -   **Unit 3 (Professional Practice):** 1 Workshop/week (Thursday, 09:00 - 12:00).
-   **Algorithm:** Ensure no overlap for the same "Cohort".
-   **Room Allocation:** Assign "Computer Lab 1" for Programming, "Lecture Hall A" for Theory.

---

## 3. Implementation Prompts

**Prompt for "Fee Generation Backend":**
> "Create a `finance.controller.ts` with `generateStudentFees(studentId, templateId, discountCode)`.
> 1. Fetch `FeeTemplate` items.
> 2. Create `StudentFeeCalculation`.
> 3. Add items: Tuition, Reg Fee, Books.
> 4. Apply Discount if valid.
> 5. Calculate VAT (15%) on applicable items.
> 6. Create `InstallmentPlan`: Splits the Net Total into a Down Payment (20%) and 4 Monthly Installments.
> 7. Return the full object."

**Prompt for "Class Scheduling":**
> "Create a `schedule.service.ts` to manage `ClassUnitSchedule`.
> 1. Function `createSchedule(classId, unitId, days[], startTime, endTime, room)`.
> 2. Validation: Check if `room` is occupied at that time. Check if `class` already has a lecture at that time.
> 3. Generate `Lecture` records for the entire term (12 weeks) based on the `startDate` and `days[]`."

**Prompt for "Student Profile Frontend":**
> "Build `StudentProfile.tsx`.
> 1. Tab 1 'Personal': Form with inputs for National ID, Passport, Expiry, Contact Info, Guardian Details.
> 2. Tab 2 'Academic': List of Enrolled Classes. For each class, show the Schedule (e.g., 'Programming: Sun/Tue 10-12').
> 3. Tab 3 'Finance': Show the `StudentFeeCalculation` breakdown (Base, Discount, Tax, Net). Display the `InstallmentPlan` as a progress bar."
