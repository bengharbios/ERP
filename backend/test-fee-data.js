// ============================================
// نماذج بيانات اختبارية لنظام الرسوم
// ============================================

const testData = {
    // 1. قالب رسوم BTEC Level 5
    btecTemplate: {
        name: "BTEC Level 5 Standard Fees",
        nameAr: "رسوم BTEC المستوى الخامس القياسية",
        programId: null, // سيتم تحديثه
        currency: "SAR",
        isDefault: true,
        description: "Standard fee structure for BTEC Level 5 programs",
        feeItems: [
            {
                name: "Registration Fee",
                nameAr: "رسوم التسجيل",
                type: "REGISTRATION",
                amount: 500,
                isIncludedInTuition: false,
                isOptional: false,
                displayOrder: 1
            },
            {
                name: "Tuition Fee - Year 1",
                nameAr: "الرسوم الدراسية - السنة الأولى",
                type: "TUITION",
                amount: 15000,
                isIncludedInTuition: true,
                isOptional: false,
                displayOrder: 2
            },
            {
                name: "Certificate Fee",
                nameAr: "رسوم الشهادة",
                type: "CERTIFICATE",
                amount: 300,
                isIncludedInTuition: false,
                isOptional: false,
                displayOrder: 3
            },
            {
                name: "Shipping Fee",
                nameAr: "رسوم الشحن",
                type: "SHIPPING",
                amount: 100,
                isIncludedInTuition: false,
                isOptional: true,
                displayOrder: 4
            }
        ]
    },

    // 2. قالب رسوم دبلوم المحاسبة
    accountingTemplate: {
        name: "Accounting Diploma Fees",
        nameAr: "رسوم دبلوم المحاسبة",
        programId: null,
        currency: "SAR",
        isDefault: false,
        feeItems: [
            {
                name: "Registration",
                nameAr: "التسجيل",
                type: "REGISTRATION",
                amount: 400,
                isIncludedInTuition: false,
                displayOrder: 1
            },
            {
                name: "Tuition",
                nameAr: "الرسوم الدراسية",
                type: "TUITION",
                amount: 12000,
                isIncludedInTuition: true,
                displayOrder: 2
            }
        ]
    },

    // 3. حساب رسوم طالب مع خصم
    studentCalculationWithDiscount: {
        studentId: null, // سيتم تحديثه
        templateId: null, // سيتم تحديثه
        title: "BTEC Level 5 - أحمد محمد علي",
        currency: "SAR",
        dueDate: "2026-09-01",
        notes: "First semester fees",
        feeItems: [
            {
                name: "Registration Fee",
                nameAr: "رسوم التسجيل",
                type: "REGISTRATION",
                amount: 500,
                isIncludedInTuition: false,
                displayOrder: 1
            },
            {
                name: "Tuition Fee",
                nameAr: "الرسوم الدراسية",
                type: "TUITION",
                amount: 15000,
                isIncludedInTuition: true,
                displayOrder: 2
            },
            {
                name: "Certificate Fee",
                nameAr: "رسوم الشهادة",
                type: "CERTIFICATE",
                amount: 300,
                isIncludedInTuition: false,
                displayOrder: 3
            }
        ],
        discounts: [
            {
                name: "Early Bird Discount",
                nameAr: "خصم الدفع المبكر",
                type: "PERCENTAGE",
                percentage: 10,
                isScholarship: false,
                description: "10% discount for early payment"
            }
        ]
    },

    // 4. حساب رسوم طالب مع منحة
    studentCalculationWithScholarship: {
        studentId: null,
        title: "BTEC Level 5 - فاطمة أحمد (منحة)",
        currency: "SAR",
        feeItems: [
            {
                name: "Tuition Fee",
                nameAr: "الرسوم الدراسية",
                type: "TUITION",
                amount: 15000,
                isIncludedInTuition: true,
                displayOrder: 1
            }
        ],
        discounts: [
            {
                name: "Excellence Scholarship",
                nameAr: "منحة التفوق",
                type: "PERCENTAGE",
                percentage: 50,
                isScholarship: true,
                sponsorName: "مؤسسة الخير للتعليم",
                description: "50% scholarship for academic excellence"
            }
        ]
    },

    // 5. خطة أقساط 12 شهر
    installmentPlan12Months: {
        calculationId: null, // سيتم تحديثه
        name: "12-Month Installment Plan",
        nameAr: "خطة الأقساط 12 شهر",
        numberOfMonths: 12,
        startDate: "2026-03-01",
        dayOfMonth: 1,
        notes: "Monthly installments starting March 2026"
    },

    // 6. خطة أقساط 6 أشهر
    installmentPlan6Months: {
        calculationId: null,
        name: "6-Month Installment Plan",
        nameAr: "خطة الأقساط 6 أشهر",
        numberOfMonths: 6,
        startDate: "2026-03-01",
        dayOfMonth: 15,
        notes: "Bi-monthly installments"
    },

    // 7. خصم نسبة مئوية
    percentageDiscount: {
        code: "EARLY2026",
        name: "Early Registration 2026",
        nameAr: "خصم التسجيل المبكر 2026",
        type: "PERCENTAGE",
        percentage: 15,
        isScholarship: false,
        validFrom: "2026-01-01",
        validUntil: "2026-03-31",
        maxUses: 100,
        description: "15% discount for early registration"
    },

    // 8. خصم قيمة ثابتة
    fixedDiscount: {
        code: "SIBLING500",
        name: "Sibling Discount",
        nameAr: "خصم الأخوة",
        type: "FIXED_AMOUNT",
        fixedAmount: 500,
        isScholarship: false,
        description: "500 SAR discount for siblings"
    },

    // 9. منحة دراسية
    scholarship: {
        code: "EXCELLENCE2026",
        name: "Excellence Scholarship",
        nameAr: "منحة التفوق",
        type: "SCHOLARSHIP",
        percentage: 100,
        isScholarship: true,
        sponsorName: "وزارة التعليم",
        validFrom: "2026-01-01",
        validUntil: "2026-12-31",
        maxUses: 10,
        description: "Full scholarship for top students"
    }
};

// ============================================
// دوال مساعدة للاختبار
// ============================================

function calculateExpectedTotals(feeItems, discounts) {
    const subtotal = feeItems.reduce((sum, item) => sum + item.amount, 0);

    let discountAmount = 0;
    let scholarshipAmount = 0;

    discounts.forEach(discount => {
        let amount = 0;
        if (discount.type === 'PERCENTAGE') {
            amount = (subtotal * discount.percentage) / 100;
        } else if (discount.type === 'FIXED_AMOUNT') {
            amount = Math.min(discount.fixedAmount, subtotal);
        }

        if (discount.isScholarship) {
            scholarshipAmount += amount;
        } else {
            discountAmount += amount;
        }
    });

    const totalAmount = subtotal - discountAmount - scholarshipAmount;

    return {
        subtotal,
        discountAmount,
        scholarshipAmount,
        totalAmount,
        balance: totalAmount
    };
}

function generateInstallmentSchedule(totalAmount, numberOfMonths, startDate, dayOfMonth = 1) {
    const installmentAmount = Math.ceil((totalAmount / numberOfMonths) * 100) / 100;
    const schedule = [];

    const start = new Date(startDate);

    for (let i = 0; i < numberOfMonths; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + i);
        dueDate.setDate(Math.min(dayOfMonth, 28));

        schedule.push({
            installmentNumber: i + 1,
            dueDate: dueDate.toISOString().split('T')[0],
            amount: installmentAmount,
            status: 'PENDING'
        });
    }

    return {
        totalAmount,
        numberOfMonths,
        installmentAmount,
        schedule
    };
}

// ============================================
// أمثلة الحسابات المتوقعة
// ============================================

const expectedCalculations = {
    btecWithEarlyBird: calculateExpectedTotals(
        testData.studentCalculationWithDiscount.feeItems,
        testData.studentCalculationWithDiscount.discounts
    ),
    // النتيجة المتوقعة:
    // subtotal: 15,800
    // discountAmount: 1,580 (10%)
    // totalAmount: 14,220

    btecWithScholarship: calculateExpectedTotals(
        testData.studentCalculationWithScholarship.feeItems,
        testData.studentCalculationWithScholarship.discounts
    ),
    // النتيجة المتوقعة:
    // subtotal: 15,000
    // scholarshipAmount: 7,500 (50%)
    // totalAmount: 7,500

    installment12Months: generateInstallmentSchedule(14220, 12, "2026-03-01", 1),
    // النتيجة المتوقعة:
    // installmentAmount: 1,185
    // 12 أقساط شهرية

    installment6Months: generateInstallmentSchedule(14220, 6, "2026-03-01", 15)
    // النتيجة المتوقعة:
    // installmentAmount: 2,370
    // 6 أقساط نصف شهرية
};

// ============================================
// تصدير البيانات
// ============================================

module.exports = {
    testData,
    calculateExpectedTotals,
    generateInstallmentSchedule,
    expectedCalculations
};

// ============================================
// أمثلة الاستخدام
// ============================================

if (require.main === module) {
    console.log('📊 نماذج بيانات الاختبار\n');
    console.log('═══════════════════════════════════════\n');

    console.log('1️⃣ قالب BTEC:');
    console.log(`   - عدد البنود: ${testData.btecTemplate.feeItems.length}`);
    console.log(`   - الإجمالي: ${testData.btecTemplate.feeItems.reduce((s, i) => s + i.amount, 0)} ر.س\n`);

    console.log('2️⃣ حساب مع خصم 10%:');
    console.log(`   - المجموع الفرعي: ${expectedCalculations.btecWithEarlyBird.subtotal} ر.س`);
    console.log(`   - الخصم: ${expectedCalculations.btecWithEarlyBird.discountAmount} ر.س`);
    console.log(`   - الإجمالي: ${expectedCalculations.btecWithEarlyBird.totalAmount} ر.س\n`);

    console.log('3️⃣ حساب مع منحة 50%:');
    console.log(`   - المجموع الفرعي: ${expectedCalculations.btecWithScholarship.subtotal} ر.س`);
    console.log(`   - المنحة: ${expectedCalculations.btecWithScholarship.scholarshipAmount} ر.س`);
    console.log(`   - الإجمالي: ${expectedCalculations.btecWithScholarship.totalAmount} ر.س\n`);

    console.log('4️⃣ خطة أقساط 12 شهر:');
    console.log(`   - المبلغ الكلي: ${expectedCalculations.installment12Months.totalAmount} ر.س`);
    console.log(`   - قيمة القسط: ${expectedCalculations.installment12Months.installmentAmount} ر.س`);
    console.log(`   - عدد الأقساط: ${expectedCalculations.installment12Months.numberOfMonths}\n`);

    console.log('═══════════════════════════════════════\n');
}
