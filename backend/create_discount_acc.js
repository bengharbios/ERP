const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Creating Sales Discount Account ---');

    // 1. التأكد من وجود الحساب الأب (الإيرادات 4000)
    const parent = await prisma.account.findUnique({
        where: { code: '4000' }
    });

    if (!parent) {
        console.error('❌ الخطأ: الحساب الرئيسي [4000] غير موجود في دليل الحسابات.');
        return;
    }

    // 2. التحقق مما إذا كان الحساب موجوداً مسبقاً
    const existing = await prisma.account.findUnique({
        where: { code: '4150' }
    });

    if (existing) {
        console.log('✅ الحساب [4150] موجود بالفعل.');
        return;
    }

    // 3. إنشاء الحساب
    const newAcc = await prisma.account.create({
        data: {
            code: '4150',
            nameAr: 'خصومات ومنح مسموح بها',
            name: 'Sales Discounts and Scholarships',
            type: 'REVENUE',
            isActive: true,
            parentId: parent.id
        }
    });

    console.log('🚀 تم إنشاء الحساب بنجاح:', newAcc.nameAr);
}

main()
    .catch(e => console.error('❌ فشل إنشاء الحساب:', e))
    .finally(async () => await prisma.$disconnect());
