import { z } from 'zod';

// Student Schemas
// Student Schemas
export const createStudentSchema = z.object({
    studentNumber: z.string().min(3).max(50).optional(), // Auto-generated if not provided
    firstNameEn: z.string().min(2),
    lastNameEn: z.string().min(2),
    firstNameAr: z.string().min(2),
    lastNameAr: z.string().min(2),
    fullNameId: z.string().optional(),
    fullNamePassport: z.string().optional(),
    certificateName: z.string().optional(),
    dateOfBirth: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(), // YYYY-MM-DD
    gender: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum(['male', 'female'])),
    nationality: z.string().optional(),
    nationalId: z.string().optional(),
    passportNumber: z.string().optional(),
    passportExpiryDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
    email: z.union([z.string().email(), z.literal('')]).optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    registrationNumberPearson: z.string().optional(),
    enrolmentNumberAlsalam: z.string().optional(),
    registrationDateAlsalam: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
    specialization: z.string().optional(),
    certificateCourseTitle: z.string().optional(),
    notificationCourseTitle: z.string().optional(),
    qualificationLevel: z.string().optional(),
    awardType: z.enum(['Academic', 'Vocational']).optional(),
    yearOfAward: z.string().optional(),
    admissionDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
    status: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum(['active', 'suspended', 'graduated', 'withdrawn'])).optional(),
    platformUsername: z.string().optional(),
    platformPassword: z.string().optional(),
    profilePicture: z.string().optional(),
    isTaxExempt: z.boolean().optional(),

    // Financial Info
    registrationFee: z.number().optional(),
    initialPayment: z.number().optional(),
    tuitionFee: z.number().optional(),
    installmentCount: z.number().optional(),
    firstInstallmentDate: z.string().optional(),
    registrationFeeDate: z.string().optional(),
    discountType: z.preprocess((val) => (typeof val === 'string' ? val.toLowerCase() : val), z.enum(['percentage', 'fixed'])).optional(),
    discountValue: z.number().optional(),
    includeRegistrationInInstallments: z.boolean().optional(),
    deductInitialPaymentFromInstallments: z.boolean().optional(),

    // Academic & Enrollment
    programId: z.string().optional(),
    classId: z.string().optional(),
    enrollmentDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
    username: z.string().min(3).max(50).optional(), // Allow username in update payload
});

// Enrollment Schemas
export const enrollStudentSchema = z.object({
    studentId: z.string(),
    classId: z.string(),
    enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(['enrolled', 'completed', 'dropped']).optional(),
});

export const updateEnrollmentSchema = z.object({
    status: z.enum(['enrolled', 'completed', 'dropped']),
    completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    grade: z.string().optional(),
    remarks: z.string().optional(),
});

// Parent/Guardian Schemas
export const addParentSchema = z.object({
    studentId: z.string(),
    nameEn: z.string().min(2),
    nameAr: z.string().min(2),
    relationship: z.enum(['father', 'mother', 'guardian', 'other']),
    phone: z.string(),
    email: z.string().email().optional(),
    nationalId: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
});

export const updateParentSchema = z.object({
    nameEn: z.string().min(2).optional(),
    nameAr: z.string().min(2).optional(),
    relationship: z.enum(['father', 'mother', 'guardian', 'other']).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    nationalId: z.string().optional(),
    occupation: z.string().optional(),
    address: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>;
export type AddParentInput = z.infer<typeof addParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
