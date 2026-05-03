import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testCompleteStudentForm() {
    console.log('🚀 محاكاة إدخال طالب جديد بجميع البيانات...\n');

    try {
        // 1. تسجيل الدخول
        console.log('🔐 تسجيل الدخول...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',  // Changed from email to username
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ تم تسجيل الدخول بنجاح\n');

        // 2. جلب البرامج والصفوف المتاحة
        console.log('📚 جلب البرامج والصفوف...');
        const programsRes = await axios.get(`${API_URL}/academic/programs`, config);
        const programs = programsRes.data.data.programs;

        const classesRes = await axios.get(`${API_URL}/academic/classes`, config);
        const classes = classesRes.data.data.classes;

        const programId = programs[0]?.id;
        const classId = classes[0]?.id;

        console.log(`   البرنامج: ${programs[0]?.nameAr || 'غير متوفر'}`);
        console.log(`   الصف: ${classes[0]?.name || 'غير متوفر'}\n`);

        // 3. إنشاء بيانات طالب كاملة (محاكاة الفورم)
        const studentData = {
            // === البيانات الشخصية ===
            studentNumber: `STU-${Date.now()}`,
            firstNameAr: 'محمد',
            secondNameAr: 'أحمد',
            thirdNameAr: 'علي',
            lastNameAr: 'الشمري',
            firstNameEn: 'Mohammed',
            secondNameEn: 'Ahmed',
            lastNameEn: 'Al-Shammari',

            // === بيانات الهوية ===
            nationalId: '1234567890',
            passportNumber: 'A12345678',
            dateOfBirth: '2000-01-15',
            gender: 'male',
            nationality: 'Saudi',

            // === بيانات الاتصال ===
            email: `student${Date.now()}@test.com`,
            phone: '+966501234567',
            phone2: '+966509876543',
            address: 'شارع الملك فهد، حي النخيل',
            city: 'الرياض',
            country: 'Saudi Arabia',

            // === جهة الاتصال للطوارئ ===
            emergencyContactName: 'أحمد الشمري',
            emergencyContactPhone: '+966501111111',

            // === البيانات الأكاديمية ===
            programId: programId,
            classId: classId,
            specialization: 'Business Management',
            certificateName: 'Mohammed Ahmed Al-Shammari',
            qualificationLevel: 'Level 5',
            awardType: 'Academic',

            // === بيانات التسجيل ===
            registrationNumberPearson: `PEAR-${Date.now()}`,
            enrolmentNumberAlsalam: `ALS-${Date.now()}`,
            registrationDateAlsalam: '2026-02-01',

            // === المنصة الإلكترونية ===
            platformUsername: `student_${Date.now()}`,
            platformPassword: 'TempPass123!',

            // === البيانات المالية ===
            tuitionFee: 15000,           // 15,000 ريال
            registrationFee: 1000,       // 1,000 ريال
            initialPayment: 2000,        // 2,000 ريال دفعة أولى
            installmentCount: 6,         // 6 أقساط
            firstInstallmentDate: '2026-03-01',
            discountType: 'percentage',  // خصم نسبة مئوية
            discountValue: 10,           // 10% خصم
            includeRegistrationInInstallments: false,
            deductInitialPaymentFromInstallments: true
        };

        // 4. الحسابات المتوقعة
        console.log('📊 الحسابات المالية المتوقعة:');
        const tuitionAfterDiscount = studentData.tuitionFee * (1 - studentData.discountValue / 100);
        const taxableAmount = tuitionAfterDiscount + studentData.registrationFee;
        const vat = taxableAmount * 0.15;
        const totalExpected = tuitionAfterDiscount + studentData.registrationFee + vat;
        const balanceExpected = totalExpected - studentData.initialPayment;

        console.log(`   الرسوم الدراسية: ${studentData.tuitionFee} ريال`);
        console.log(`   الخصم (${studentData.discountValue}%): ${studentData.tuitionFee - tuitionAfterDiscount} ريال`);
        console.log(`   الرسوم بعد الخصم: ${tuitionAfterDiscount} ريال`);
        console.log(`   رسوم التسجيل: ${studentData.registrationFee} ريال`);
        console.log(`   المبلغ الخاضع للضريبة: ${taxableAmount} ريال`);
        console.log(`   ضريبة القيمة المضافة (15%): ${vat} ريال`);
        console.log(`   الإجمالي الكلي: ${totalExpected} ريال`);
        console.log(`   الدفعة الأولى: ${studentData.initialPayment} ريال`);
        console.log(`   الرصيد المتبقي: ${balanceExpected} ريال\n`);

        // 5. إرسال البيانات
        console.log('📤 إرسال بيانات الطالب...');
        const createRes = await axios.post(`${API_URL}/students`, studentData, config);

        if (createRes.status === 201) {
            const student = createRes.data.data.student;
            console.log('✅ تم إنشاء الطالب بنجاح!');
            console.log(`   ID: ${student.id}`);
            console.log(`   الاسم: ${student.firstNameAr} ${student.lastNameAr}`);
            console.log(`   رقم الطالب: ${student.studentNumber}\n`);

            // 6. التحقق من البيانات المالية
            console.log('🔍 التحقق من البيانات المالية...');
            const studentDetailRes = await axios.get(`${API_URL}/students/${student.id}`, config);
            const feeCalculations = studentDetailRes.data.data.student.feeCalculations;

            if (feeCalculations && feeCalculations.length > 0) {
                const calc = feeCalculations[0];
                console.log('💰 الحساب المالي:');
                console.log(`   المجموع الفرعي: ${calc.subtotal}`);
                console.log(`   الخصم: ${calc.discountAmount}`);
                console.log(`   الضريبة: ${calc.taxAmount || 'غير محسوبة'}`);
                console.log(`   الإجمالي: ${calc.totalAmount}`);
                console.log(`   المدفوع: ${calc.paidAmount}`);
                console.log(`   الرصيد: ${calc.balance}`);
                console.log(`   الحالة: ${calc.status}\n`);

                // 7. التحقق من الدقة
                const tolerance = 1; // هامش خطأ 1 ريال
                const totalMatch = Math.abs(Number(calc.totalAmount) - totalExpected) < tolerance;
                const balanceMatch = Math.abs(Number(calc.balance) - balanceExpected) < tolerance;
                const vatMatch = calc.taxAmount ? Math.abs(Number(calc.taxAmount) - vat) < tolerance : false;

                console.log('✅ نتائج التحقق:');
                console.log(`   ${totalMatch ? '✅' : '❌'} الإجمالي: ${totalMatch ? 'صحيح' : 'خطأ'}`);
                console.log(`   ${balanceMatch ? '✅' : '❌'} الرصيد: ${balanceMatch ? 'صحيح' : 'خطأ'}`);
                console.log(`   ${vatMatch ? '✅' : '❌'} الضريبة: ${vatMatch ? 'صحيحة' : calc.taxAmount ? 'خطأ' : 'غير موجودة'}\n`);

                if (totalMatch && balanceMatch && vatMatch) {
                    console.log('🎉 جميع الحسابات صحيحة! النظام يعمل بشكل ممتاز.');
                } else {
                    console.log('⚠️ هناك اختلافات في الحسابات. يرجى مراجعة المنطق المالي.');
                }
            } else {
                console.log('⚠️ لم يتم إنشاء حساب مالي للطالب.');
            }

        } else {
            console.log('❌ فشل إنشاء الطالب');
        }

    } catch (error: any) {
        console.error('\n❌ حدث خطأ:');
        if (error.response) {
            console.error(`   الحالة: ${error.response.status}`);
            console.error(`   الرسالة: ${error.response.data?.message || 'غير معروف'}`);
            if (error.response.data?.errors) {
                console.error('   التفاصيل:', JSON.stringify(error.response.data.errors, null, 2));
            }
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

testCompleteStudentForm();
