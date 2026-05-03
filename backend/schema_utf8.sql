-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "profile_picture" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,

    PRIMARY KEY ("role_id", "permission_id"),
    CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "scope_type" TEXT,
    "scope_id" TEXT,
    "expires_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT,
    "resource_id" TEXT,
    "before_data" TEXT,
    "after_data" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "program_levels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "awarding_bodies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "duration_months" INTEGER NOT NULL,
    "total_units" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "awarding_body_id" TEXT,
    "level_id" TEXT,
    CONSTRAINT "programs_awarding_body_id_fkey" FOREIGN KEY ("awarding_body_id") REFERENCES "awarding_bodies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "programs_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "program_levels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "credit_hours" INTEGER,
    "total_lectures" INTEGER NOT NULL,
    "default_instructor_id" TEXT,
    "learning_outcomes" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "program_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "program_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "sequence_order" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "program_units_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "program_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "expected_end_date" DATETIME,
    "actual_end_date" DATETIME,
    "study_days_per_week" INTEGER,
    "study_days" TEXT NOT NULL DEFAULT '',
    "lecture_start_time" DATETIME,
    "lecture_end_time" DATETIME,
    "default_room" TEXT,
    "max_students" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "study_mode" TEXT NOT NULL DEFAULT 'IN_PERSON',
    "study_language" TEXT NOT NULL DEFAULT 'Arabic',
    "classroom" TEXT,
    "building" TEXT,
    "default_zoom_link" TEXT,
    "study_mode_changed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "academic_year_id" TEXT,
    CONSTRAINT "classes_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "classes_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "instructor_id" TEXT,
    "sequence_number" INTEGER NOT NULL,
    "scheduled_date" DATETIME NOT NULL,
    "scheduled_start_time" DATETIME NOT NULL,
    "scheduled_end_time" DATETIME NOT NULL,
    "actual_start_time" DATETIME,
    "actual_end_time" DATETIME,
    "room" TEXT,
    "topic" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "cancellation_reason" TEXT,
    "notes" TEXT,
    "zoom_link" TEXT,
    "zoom_meeting_id" TEXT,
    "zoom_password" TEXT,
    "actual_classroom" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "lectures_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lectures_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "lectures_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "student_number" TEXT NOT NULL,
    "first_name_ar" TEXT,
    "last_name_ar" TEXT,
    "first_name_en" TEXT,
    "last_name_en" TEXT,
    "date_of_birth" DATETIME,
    "gender" TEXT,
    "nationality" TEXT,
    "national_id" TEXT,
    "passport_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "enrollment_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "platform_password" TEXT,
    "platform_username" TEXT,
    "award_type" TEXT,
    "certificate_course_title" TEXT,
    "certificate_name" TEXT,
    "email" TEXT,
    "enrolment_number_alsalam" TEXT,
    "full_name_id" TEXT,
    "full_name_passport" TEXT,
    "notification_course_title" TEXT,
    "phone" TEXT,
    "phone2" TEXT,
    "qualification_level" TEXT,
    "registration_date_alsalam" DATETIME,
    "registration_number_pearson" TEXT,
    "specialization" TEXT,
    "year_of_award" TEXT,
    "passport_expiry_date" DATETIME,
    "is_tax_exempt" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "relationship" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT,
    "name_ar" TEXT,
    "name_en" TEXT,
    "national_id" TEXT,
    "occupation" TEXT,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "parents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_parents" (
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("student_id", "parent_id"),
    CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parents" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "enrollment_date" DATETIME NOT NULL,
    "start_unit_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "completion_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_enrollments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_unit_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "enrollment_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "start_date" DATETIME,
    "completion_date" DATETIME,
    "grade" TEXT,
    "gpa" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "student_unit_progress_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "student_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lecture_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "check_in_time" DATETIME,
    "check_in_method" TEXT,
    "notes" TEXT,
    "recorded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "student_enrollment_id" TEXT,
    CONSTRAINT "attendance_records_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unit_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brief_file_url" TEXT,
    "rubric_file_url" TEXT,
    "total_marks" INTEGER,
    "pass_threshold" REAL,
    "merit_threshold" REAL,
    "distinction_threshold" REAL,
    "release_date" DATETIME,
    "submission_deadline" DATETIME NOT NULL,
    "grace_period_days" INTEGER DEFAULT 0,
    "assessor_id" TEXT,
    "internal_verifier_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '',
    "distinction_criteria" TEXT,
    "instructions" TEXT,
    "learning_outcomes" TEXT NOT NULL DEFAULT '',
    "merit_criteria" TEXT,
    "pass_criteria" TEXT,
    CONSTRAINT "assignments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submission_file_url" TEXT,
    "submission_date" DATETIME,
    "is_late" BOOLEAN NOT NULL DEFAULT false,
    "plagiarism_score" REAL,
    "assessed_by" TEXT,
    "assessed_at" DATETIME,
    "marks" REAL,
    "grade" TEXT,
    "assessor_feedback" TEXT,
    "assessor_feedback_file_url" TEXT,
    "verified_by" TEXT,
    "verified_at" DATETIME,
    "verification_status" TEXT,
    "verifier_notes" TEXT,
    "final_status" TEXT NOT NULL DEFAULT 'pending_submission',
    "grade_published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '',
    "content" TEXT,
    "remarks" TEXT,
    "student_enrollment_id" TEXT,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_assignments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "assignments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_assignments_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" DATETIME,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT
);

-- CreateTable
CREATE TABLE "class_unit_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    CONSTRAINT "class_unit_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_unit_schedules_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "email_enabled" BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("user_id", "notification_type")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT,
    "data_type" TEXT,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "institute_name" TEXT NOT NULL,
    "institute_name_ar" TEXT NOT NULL,
    "institute_name_en" TEXT NOT NULL,
    "institute_logo" TEXT,
    "institute_email" TEXT,
    "institute_phone" TEXT,
    "institute_address" TEXT,
    "institute_website" TEXT,
    "awarding_bodies" TEXT NOT NULL DEFAULT '[]',
    "default_academic_year" TEXT,
    "grade_passing_percentage" INTEGER NOT NULL DEFAULT 50,
    "attendance_threshold" INTEGER NOT NULL DEFAULT 75,
    "default_language" TEXT NOT NULL DEFAULT 'ar',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "student_number_prefix" TEXT NOT NULL DEFAULT 'STU-',
    "auto_generate_student_number" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_username" TEXT,
    "smtp_password" TEXT,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_provider" TEXT,
    "sms_api_key" TEXT,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "full_payment_discount_amount" REAL NOT NULL DEFAULT 0,
    "full_payment_discount_percentage" REAL NOT NULL DEFAULT 0,
    "late_fee_amount" REAL NOT NULL DEFAULT 0,
    "late_fee_grace_days" INTEGER NOT NULL DEFAULT 0,
    "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tax_rate" REAL NOT NULL DEFAULT 15,
    "external_ai_api_key" TEXT,
    "external_ai_enabled" BOOLEAN NOT NULL DEFAULT false,
    "external_ai_provider" TEXT DEFAULT 'openai',
    "country" TEXT NOT NULL DEFAULT 'SA',
    "student_number_length" INTEGER NOT NULL DEFAULT 6,
    "bank_account_name" TEXT,
    "bank_currency" TEXT DEFAULT 'AED',
    "bank_iban" TEXT,
    "bank_name" TEXT,
    "bank_swift" TEXT,
    "trn" TEXT,
    "hr_working_days" TEXT NOT NULL DEFAULT '["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]',
    "hr_work_start_time" TEXT NOT NULL DEFAULT '09:00',
    "hr_work_end_time" TEXT NOT NULL DEFAULT '17:00',
    "hr_late_grace_period" INTEGER NOT NULL DEFAULT 15,
    "hr_absence_threshold" INTEGER NOT NULL DEFAULT 60,
    "hr_late_hour_deduction" REAL NOT NULL DEFAULT 0,
    "hr_shift_enabled" BOOLEAN NOT NULL DEFAULT false,
    "active_template" TEXT NOT NULL DEFAULT 'legacy',
    "announcement_ticker" TEXT
);

-- CreateTable
CREATE TABLE "student_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "awarding_body_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "registration_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "student_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "program_id" TEXT,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "totalAmount" REAL NOT NULL,
    "tuitionAmount" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "income_account_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fee_templates_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "amount" REAL NOT NULL,
    "is_included_in_tuition" BOOLEAN NOT NULL DEFAULT false,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "is_taxable" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "revenue_account_id" TEXT,
    "income_account_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "fee_items_revenue_account_id_fkey" FOREIGN KEY ("revenue_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fee_items_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fee_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "fee_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_fee_calculations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "template_id" TEXT,
    "program_id" TEXT,
    "calculation_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtotal" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "scholarshipAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issue_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATETIME,
    "notes" TEXT,
    "internal_notes" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "student_fee_calculations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_fee_calculations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "fee_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_calculation_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculation_id" TEXT NOT NULL,
    "fee_item_id" TEXT,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "is_tax_able" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "income_account_id" TEXT,
    CONSTRAINT "fee_calculation_items_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "student_fee_calculations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "fee_calculation_items_fee_item_id_fkey" FOREIGN KEY ("fee_item_id") REFERENCES "fee_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "fee_calculation_items_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fee_calculation_discounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "percentage" REAL,
    "fixedAmount" REAL,
    "calculated_amount" REAL NOT NULL,
    "is_scholarship" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fee_calculation_discounts_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "student_fee_calculations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "installment_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "calculation_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "totalAmount" REAL NOT NULL,
    "number_of_months" INTEGER NOT NULL,
    "installment_amount" REAL NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "day_of_month" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "invoice_id" TEXT,
    CONSTRAINT "installment_plans_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "student_fee_calculations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "installment_plans_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "installments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "paid_amount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_date" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "installments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "installment_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "percentage" REAL,
    "fixedAmount" REAL,
    "is_scholarship" BOOLEAN NOT NULL DEFAULT false,
    "sponsor_name" TEXT,
    "valid_from" DATETIME,
    "valid_until" DATETIME,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "student_fees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TUITION',
    "amount" REAL NOT NULL,
    "discount_id" TEXT,
    "discountAmount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL,
    "paidAmount" REAL NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "student_fees_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "student_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fee_id" TEXT,
    "calculation_id" TEXT,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "reference_no" TEXT,
    "payment_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "discount_amount" REAL NOT NULL DEFAULT 0,
    "installment_id" TEXT,
    "late_fee_amount" REAL NOT NULL DEFAULT 0,
    "receipt_number" TEXT,
    "student_id" TEXT,
    "reconciliation_status" TEXT NOT NULL DEFAULT 'PENDING',
    "journal_id" TEXT,
    CONSTRAINT "payments_calculation_id_fkey" FOREIGN KEY ("calculation_id") REFERENCES "student_fee_calculations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "student_fees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "financial_journals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "expense_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "description" TEXT,
    "expense_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL DEFAULT 'CASH',
    "reference_no" TEXT,
    "receipt_image" TEXT,
    "recorded_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "expense_number" TEXT,
    "notes" TEXT,
    "paid_to" TEXT,
    "tax_amount" REAL DEFAULT 0,
    "tax_rate" REAL DEFAULT 0,
    "total_amount" REAL,
    CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "expense_categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_audiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CORE',
    "rules" TEXT,
    "source_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "audience_id" TEXT,
    "content" TEXT,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "budget" REAL,
    "spent" REAL DEFAULT 0,
    "ai_score" REAL,
    "ai_optimization" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketing_campaigns_audience_id_fkey" FOREIGN KEY ("audience_id") REFERENCES "marketing_audiences" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "interest_score" INTEGER,
    "ai_follow_up_notes" TEXT,
    "last_activity" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "marketing_leads_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "deliveries" INTEGER,
    "read_count" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_analytics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "marketing_funnels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "drop_off_rate" REAL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketing_funnels_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_scoring" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "demographic_score" INTEGER NOT NULL DEFAULT 50,
    "engagement_score" INTEGER NOT NULL DEFAULT 50,
    "behavior_score" INTEGER NOT NULL DEFAULT 50,
    "total_score" INTEGER NOT NULL DEFAULT 50,
    "quality" TEXT NOT NULL DEFAULT 'COLD',
    "conversion_probability" REAL,
    "recommended_action" TEXT,
    "last_calculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "campaign_roi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "total_spent" REAL NOT NULL DEFAULT 0,
    "setup_cost" REAL NOT NULL DEFAULT 0,
    "media_cost" REAL NOT NULL DEFAULT 0,
    "total_revenue" REAL NOT NULL DEFAULT 0,
    "cost_per_lead" REAL,
    "cost_per_acquisition" REAL,
    "roi" REAL,
    "roas" REAL,
    "calculated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "campaign_roi_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "channel" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lead_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "marketing_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_variants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "traffic_split" REAL NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "campaign_variants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_test_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variant_id" TEXT NOT NULL,
    "conversion_rate" REAL NOT NULL,
    "click_through_rate" REAL NOT NULL,
    "p_value" REAL,
    "confidence" REAL,
    "sample_size" INTEGER NOT NULL,
    "calculated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ab_test_results_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "campaign_variants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ab_test_winners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaign_id" TEXT NOT NULL,
    "winner_variant_id" TEXT NOT NULL,
    "improvement_rate" REAL NOT NULL,
    "confidence_level" REAL NOT NULL,
    "declared_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declared_by" TEXT,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "customer_journeys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "current_stage" TEXT NOT NULL DEFAULT 'AWARENESS',
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" DATETIME NOT NULL,
    "is_converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" DATETIME,
    "conversion_value" REAL,
    "touchpoint_count" INTEGER NOT NULL DEFAULT 0,
    "duration_days" INTEGER,
    CONSTRAINT "customer_journeys_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "marketing_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journey_touchpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journey_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "channel" TEXT,
    "campaign_id" TEXT,
    "description" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engagement_score" INTEGER,
    CONSTRAINT "journey_touchpoints_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "customer_journeys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "triggerType" TEXT NOT NULL,
    "triggerConfig" TEXT,
    "createdBy" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "total_executions" INTEGER NOT NULL DEFAULT 0,
    "successful_runs" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_config" TEXT NOT NULL,
    "conditions" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workflow_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflow_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "current_step" INTEGER,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "workflow_executions_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "automation_workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "execution_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "execution_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "action_type" TEXT NOT NULL,
    "action_data" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "execution_logs_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "workflow_executions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "file_path" TEXT,
    "content" TEXT,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ai_memories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "department_id" TEXT,
    "employee_code" TEXT NOT NULL,
    "job_title_ar" TEXT,
    "job_title_en" TEXT,
    "hiring_date" DATETIME,
    "salary" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "status" TEXT NOT NULL DEFAULT 'active',
    "status_change_date" DATETIME,
    "last_working_date" DATETIME,
    "personal_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "contract_type" TEXT,
    "housing_allowance" REAL NOT NULL DEFAULT 0,
    "other_allowances" REAL NOT NULL DEFAULT 0,
    "total_deductions" REAL NOT NULL DEFAULT 0,
    "transport_allowance" REAL NOT NULL DEFAULT 0,
    "commission_rate" REAL,
    "hourly_rate" REAL,
    "hourly_unit" INTEGER DEFAULT 1,
    "is_commission_percentage" BOOLEAN NOT NULL DEFAULT false,
    "salary_type" TEXT NOT NULL DEFAULT 'FIXED',
    "target_type" TEXT,
    "target_value" REAL,
    "bank_name" TEXT,
    "date_of_birth" DATETIME,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_relation" TEXT,
    "gender" TEXT,
    "iban" TEXT,
    "id_expiry" DATETIME,
    "joining_date" DATETIME,
    "labor_card_expiry" DATETIME,
    "labor_card_number" TEXT,
    "marital_status" TEXT,
    "national_id" TEXT,
    "nationality" TEXT,
    "notice_period" INTEGER DEFAULT 30,
    "passport_expiry" DATETIME,
    "passport_number" TEXT,
    "probation_period" INTEGER DEFAULT 90,
    "swift_code" TEXT,
    "visa_expiry" DATETIME,
    "visa_number" TEXT,
    "commission_logic" TEXT NOT NULL DEFAULT 'POSITIVE',
    "minimum_salary_floor" REAL NOT NULL DEFAULT 0,
    "shift_id" TEXT,
    "biometric_id" TEXT,
    CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "employee_shifts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "serial_number" TEXT,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'assigned',
    "assignment_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "return_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_assets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "review_date" DATETIME NOT NULL,
    "period" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "goals" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "performance_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_trainings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "provider" TEXT,
    "completion_date" DATETIME,
    "expiry_date" DATETIME,
    "certificate_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_trainings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_commission_tiers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "target_number" INTEGER NOT NULL,
    "target_threshold" REAL NOT NULL,
    "commission_amount" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_commission_tiers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "staff_attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "check_in" DATETIME,
    "check_out" DATETIME,
    "first_check_in" DATETIME,
    "last_check_out" DATETIME,
    "total_break_minutes" INTEGER DEFAULT 0,
    "total_work_minutes" INTEGER DEFAULT 0,
    "target_work_hours" REAL DEFAULT 0,
    "target_break_minutes" INTEGER DEFAULT 0,
    "late_minutes" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'present',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "staff_attendance_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "attendance_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_time" DATETIME NOT NULL,
    "method" TEXT,
    "device_info" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attendance_events_attendance_id_fkey" FOREIGN KEY ("attendance_id") REFERENCES "staff_attendance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "action_date" DATETIME,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "old_payroll_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "basic_salary" REAL NOT NULL,
    "housing_allowance" REAL NOT NULL DEFAULT 0,
    "transport_allowance" REAL NOT NULL DEFAULT 0,
    "other_allowances" REAL NOT NULL DEFAULT 0,
    "deductions" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "net_salary" REAL NOT NULL,
    "achieved_target" REAL,
    "hours_worked" REAL,
    "payment_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "old_payroll_records_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payroll_sheets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payroll_number" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "month_name" TEXT,
    "total_gross" REAL NOT NULL,
    "total_allowances" REAL NOT NULL DEFAULT 0,
    "total_deductions" REAL NOT NULL DEFAULT 0,
    "total_net" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "paid_date" DATETIME,
    "payment_method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "journal_entry_id" TEXT,
    "sif_file_url" TEXT,
    "sif_generated_at" DATETIME,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "payroll_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payroll_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "basic_salary" REAL NOT NULL,
    "housing_allowance" REAL NOT NULL DEFAULT 0,
    "transport_allowance" REAL NOT NULL DEFAULT 0,
    "phone_allowance" REAL NOT NULL DEFAULT 0,
    "other_allowances" REAL NOT NULL DEFAULT 0,
    "total_allowances" REAL NOT NULL,
    "insurance" REAL NOT NULL DEFAULT 0,
    "loans" REAL NOT NULL DEFAULT 0,
    "other_deductions" REAL NOT NULL DEFAULT 0,
    "total_deductions" REAL NOT NULL,
    "gross_salary" REAL NOT NULL,
    "net_salary" REAL NOT NULL,
    "bank_name" TEXT,
    "iban" TEXT,
    "notes" TEXT,
    CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "payroll_sheets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_openings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deadline" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "job_openings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "job_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "resume_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "job_openings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_awards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "award_type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "gift" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_awards_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_warnings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "warning_by" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_warnings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "employee_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "complaint_against" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "employee_complaints_complaint_against_fkey" FOREIGN KEY ("complaint_against") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "employee_complaints_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "promotion_date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "promotions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "transfer_date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "transfers_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transfers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "resignations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "notice_date" DATETIME NOT NULL,
    "resignation_date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "resignations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "terminations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "notice_date" DATETIME NOT NULL,
    "termination_date" DATETIME NOT NULL,
    "termination_type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "terminations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "department_id" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "announcements_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hr_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "time" TEXT,
    "location" TEXT,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "hr_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "employee_shifts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "type" TEXT DEFAULT 'M',
    "is_split" BOOLEAN NOT NULL DEFAULT false,
    "start_time_2" TEXT,
    "end_time_2" TEXT,
    "break_duration" INTEGER DEFAULT 0,
    "total_hours" REAL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "assigned_to" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "birthday" DATETIME,
    "gender" TEXT,
    "last_contacted" DATETIME,
    "nationality" TEXT,
    "preferred_program_id" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "custom_fields" TEXT,
    CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'GLOBAL',
    "custom_fields_config" TEXT,
    "pipeline_settings" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "title" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'INQUIRY',
    "amount" REAL,
    "close_date" DATETIME,
    "expected_close" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT,
    "deal_id" TEXT,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,
    "result" TEXT,
    CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "crm_activities_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "crm_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_automation_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "condition" TEXT,
    "action" TEXT NOT NULL,
    "actionData" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "visualGraph" TEXT
);

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'lead',
    "partner_id" TEXT,
    "contact_name" TEXT,
    "email_from" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "expected_revenue" REAL,
    "probability" REAL NOT NULL DEFAULT 10.0,
    "stage_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT '1',
    "salesperson_id" TEXT,
    "team_id" TEXT,
    "campaign_id" TEXT,
    "source_id" TEXT,
    "medium_id" TEXT,
    "date_open" DATETIME,
    "date_closed" DATETIME,
    "date_last_stage_update" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "date_deadline" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "duplicate_count" INTEGER NOT NULL DEFAULT 0,
    "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
    "mobile_normalized" TEXT,
    "phone_normalized" TEXT,
    "custom_fields" TEXT,
    CONSTRAINT "crm_leads_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "crm_leads_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_stages" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "crm_leads_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "crm_teams" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "name_ar" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "probability" REAL NOT NULL DEFAULT 10.0,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_lost" BOOLEAN NOT NULL DEFAULT false,
    "is_folded" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requirements" TEXT
);

-- CreateTable
CREATE TABLE "crm_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "leader_id" TEXT,
    "invoiced_target" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "crm_teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_activities_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "res_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,
    "summary" TEXT,
    "note" TEXT,
    "date_deadline" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_activities_new_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "crm_activity_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crm_activities_new_res_id_fkey" FOREIGN KEY ("res_id") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_activities_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_activity_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'fa-tasks',
    "color" TEXT NOT NULL DEFAULT '#06b6d4',
    "action" TEXT NOT NULL DEFAULT 'none',
    "description" TEXT,
    "chaining_type" TEXT NOT NULL DEFAULT 'suggest',
    "days_delay" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "crm_activity_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "crm_activity_plan_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "plan_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,
    "summary" TEXT,
    "assignment" TEXT NOT NULL DEFAULT 'ask',
    "assigned_to_id" TEXT,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "interval_unit" TEXT NOT NULL DEFAULT 'days',
    "trigger" TEXT NOT NULL DEFAULT 'after',
    "sequence" INTEGER NOT NULL DEFAULT 10,
    CONSTRAINT "crm_activity_plan_steps_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "crm_activity_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_activity_plan_steps_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "crm_activity_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "crm_activity_plan_steps_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "crm_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parent_id" TEXT,
    "balance" REAL NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entry_number" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "journal_id" TEXT,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "posted_by" TEXT,
    "posted_at" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "reference" TEXT,
    CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "financial_journals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_journals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "default_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "financial_journals_default_account_id_fkey" FOREIGN KEY ("default_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entry_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "description" TEXT,
    CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "journal_lines_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "journal_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year_name" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receipt_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "amount_in_words" TEXT,
    "payment_method" TEXT NOT NULL,
    "reference_no" TEXT,
    "received_date" DATETIME NOT NULL,
    "notes" TEXT,
    "purpose" TEXT,
    "received_by" TEXT,
    "journal_entry_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "financial_account_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    CONSTRAINT "receipts_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipts_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trial_balance_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "debit" REAL NOT NULL,
    "credit" REAL NOT NULL,
    "as_of_date" DATETIME NOT NULL,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "financial_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_name_ar" TEXT NOT NULL,
    "company_name_en" TEXT NOT NULL,
    "trn" TEXT NOT NULL,
    "vat_rate" REAL NOT NULL DEFAULT 5.00,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "bank_name" TEXT,
    "iban" TEXT,
    "swift_code" TEXT,
    "bank_address" TEXT,
    "default_cash_account_id" TEXT,
    "default_bank_account_id" TEXT,
    "default_vat_account_id" TEXT,
    "default_income_account_id" TEXT,
    "default_sales_discount_account_id" TEXT,
    "default_payroll_expense_account_id" TEXT,
    "default_payroll_payable_account_id" TEXT,
    "default_supplier_payable_account_id" TEXT,
    "default_bank_suspense_account_id" TEXT,
    "default_student_receivable_account_id" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_number" TEXT NOT NULL,
    "student_id" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATETIME,
    "subtotal" REAL NOT NULL,
    "vat_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "trn_snapshot" TEXT,
    "vat_rate_snapshot" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "payment_id" TEXT,
    CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" REAL NOT NULL,
    "taxable_amount" REAL NOT NULL,
    "vat_amount" REAL NOT NULL,
    "total_amount" REAL NOT NULL,
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "biometric_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 80,
    "username" TEXT NOT NULL DEFAULT 'admin',
    "password" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'ISAPI',
    "model" TEXT,
    "serial_number" TEXT,
    "last_sync" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_CrmTeamMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CrmTeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "crm_teams" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CrmTeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "awarding_bodies_code_key" ON "awarding_bodies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "units_code_key" ON "units"("code");

-- CreateIndex
CREATE UNIQUE INDEX "program_units_program_id_unit_id_key" ON "program_units"("program_id", "unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_name_key" ON "academic_years"("name");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE INDEX "lectures_class_id_idx" ON "lectures"("class_id");

-- CreateIndex
CREATE INDEX "lectures_scheduled_date_idx" ON "lectures"("scheduled_date");

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "students"("student_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_enrolment_number_alsalam_key" ON "students"("enrolment_number_alsalam");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_number_pearson_key" ON "students"("registration_number_pearson");

-- CreateIndex
CREATE UNIQUE INDEX "parents_user_id_key" ON "parents"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_id_class_id_key" ON "student_enrollments"("student_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_unit_progress_student_id_enrollment_id_unit_id_key" ON "student_unit_progress"("student_id", "enrollment_id", "unit_id");

-- CreateIndex
CREATE INDEX "attendance_records_student_id_idx" ON "attendance_records"("student_id");

-- CreateIndex
CREATE INDEX "attendance_records_lecture_id_idx" ON "attendance_records"("lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_lecture_id_student_id_key" ON "attendance_records"("lecture_id", "student_id");

-- CreateIndex
CREATE INDEX "student_assignments_final_status_idx" ON "student_assignments"("final_status");

-- CreateIndex
CREATE UNIQUE INDEX "student_assignments_assignment_id_student_id_key" ON "student_assignments"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE UNIQUE INDEX "class_unit_schedules_class_id_unit_id_key" ON "class_unit_schedules"("class_id", "unit_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_registrations_student_id_awarding_body_id_key" ON "student_registrations"("student_id", "awarding_body_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_calculations_calculation_number_key" ON "student_fee_calculations"("calculation_number");

-- CreateIndex
CREATE INDEX "student_fee_calculations_student_id_idx" ON "student_fee_calculations"("student_id");

-- CreateIndex
CREATE INDEX "student_fee_calculations_status_idx" ON "student_fee_calculations"("status");

-- CreateIndex
CREATE INDEX "student_fee_calculations_calculation_number_idx" ON "student_fee_calculations"("calculation_number");

-- CreateIndex
CREATE INDEX "installments_plan_id_idx" ON "installments"("plan_id");

-- CreateIndex
CREATE INDEX "installments_due_date_idx" ON "installments"("due_date");

-- CreateIndex
CREATE INDEX "installments_status_idx" ON "installments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "discounts"("code");

-- CreateIndex
CREATE INDEX "student_fees_student_id_idx" ON "student_fees"("student_id");

-- CreateIndex
CREATE INDEX "student_fees_due_date_idx" ON "student_fees"("due_date");

-- CreateIndex
CREATE INDEX "student_fees_status_idx" ON "student_fees"("status");

-- CreateIndex
CREATE INDEX "payments_fee_id_idx" ON "payments"("fee_id");

-- CreateIndex
CREATE INDEX "payments_calculation_id_idx" ON "payments"("calculation_id");

-- CreateIndex
CREATE INDEX "payments_installment_id_idx" ON "payments"("installment_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_number_key" ON "expenses"("expense_number");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "marketing_leads_email_idx" ON "marketing_leads"("email");

-- CreateIndex
CREATE INDEX "marketing_leads_phone_idx" ON "marketing_leads"("phone");

-- CreateIndex
CREATE INDEX "marketing_leads_status_idx" ON "marketing_leads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_analytics_campaign_id_date_key" ON "marketing_analytics"("campaign_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_funnels_campaign_id_stage_date_key" ON "marketing_funnels"("campaign_id", "stage", "date");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scoring_lead_id_key" ON "lead_scoring"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_roi_campaign_id_key" ON "campaign_roi"("campaign_id");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities"("lead_id");

-- CreateIndex
CREATE INDEX "lead_activities_activity_type_idx" ON "lead_activities"("activity_type");

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_winners_campaign_id_key" ON "ab_test_winners"("campaign_id");

-- CreateIndex
CREATE INDEX "customer_journeys_lead_id_idx" ON "customer_journeys"("lead_id");

-- CreateIndex
CREATE INDEX "journey_touchpoints_journey_id_idx" ON "journey_touchpoints"("journey_id");

-- CreateIndex
CREATE INDEX "journey_touchpoints_type_idx" ON "journey_touchpoints"("type");

-- CreateIndex
CREATE INDEX "automation_workflows_status_idx" ON "automation_workflows"("status");

-- CreateIndex
CREATE INDEX "automation_workflows_triggerType_idx" ON "automation_workflows"("triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_steps_workflow_id_step_order_key" ON "workflow_steps"("workflow_id", "step_order");

-- CreateIndex
CREATE INDEX "workflow_executions_workflow_id_idx" ON "workflow_executions"("workflow_id");

-- CreateIndex
CREATE INDEX "workflow_executions_lead_id_idx" ON "workflow_executions"("lead_id");

-- CreateIndex
CREATE INDEX "workflow_executions_status_idx" ON "workflow_executions"("status");

-- CreateIndex
CREATE INDEX "execution_logs_execution_id_idx" ON "execution_logs"("execution_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_memories_key_key" ON "ai_memories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_code_key" ON "employees"("employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_biometric_id_key" ON "employees"("biometric_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_commission_tiers_employee_id_target_number_key" ON "employee_commission_tiers"("employee_id", "target_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_attendance_employee_id_date_key" ON "staff_attendance"("employee_id", "date");

-- CreateIndex
CREATE INDEX "attendance_events_attendance_id_idx" ON "attendance_events"("attendance_id");

-- CreateIndex
CREATE INDEX "attendance_events_event_time_idx" ON "attendance_events"("event_time");

-- CreateIndex
CREATE UNIQUE INDEX "old_payroll_records_employee_id_month_year_key" ON "old_payroll_records"("employee_id", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_sheets_payroll_number_key" ON "payroll_sheets"("payroll_number");

-- CreateIndex
CREATE INDEX "payroll_sheets_month_idx" ON "payroll_sheets"("month");

-- CreateIndex
CREATE INDEX "payroll_sheets_status_idx" ON "payroll_sheets"("status");

-- CreateIndex
CREATE INDEX "payroll_items_employee_id_idx" ON "payroll_items"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_items_payroll_id_employee_id_key" ON "payroll_items"("payroll_id", "employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "resignations_employee_id_key" ON "resignations"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "terminations_employee_id_key" ON "terminations"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "crm_teams_name_key" ON "crm_teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

-- CreateIndex
CREATE INDEX "accounts_type_idx" ON "accounts"("type");

-- CreateIndex
CREATE INDEX "accounts_code_idx" ON "accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_entry_number_key" ON "journal_entries"("entry_number");

-- CreateIndex
CREATE INDEX "journal_entries_date_idx" ON "journal_entries"("date");

-- CreateIndex
CREATE INDEX "journal_entries_reference_type_reference_id_idx" ON "journal_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_journals_code_key" ON "financial_journals"("code");

-- CreateIndex
CREATE INDEX "journal_lines_entry_id_idx" ON "journal_lines"("entry_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "journal_lines"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "receipts_student_id_idx" ON "receipts"("student_id");

-- CreateIndex
CREATE INDEX "receipts_received_date_idx" ON "receipts"("received_date");

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- CreateIndex
CREATE INDEX "trial_balance_cache_as_of_date_idx" ON "trial_balance_cache"("as_of_date");

-- CreateIndex
CREATE UNIQUE INDEX "financial_settings_trn_key" ON "financial_settings"("trn");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "invoices"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "_CrmTeamMembers_AB_unique" ON "_CrmTeamMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_CrmTeamMembers_B_index" ON "_CrmTeamMembers"("B");

