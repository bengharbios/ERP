import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Odoo CRM default data...');

    // 1. Seed CRM Stages
    const stages = [
        { name: 'جديد (New)', sequence: 10, probability: 10, isWon: false },
        { name: 'مؤهل (Qualified)', sequence: 20, probability: 30, isWon: false },
        { name: 'عرض سعر (Proposition)', sequence: 30, probability: 70, isWon: false },
        { name: 'فاز (Won)', sequence: 40, probability: 100, isWon: true },
    ];

    for (const stage of stages) {
        await prisma.crmStage.upsert({
            where: { id: `default-stage-${stage.sequence}` }, // Not stable, but good for first seed
            update: stage,
            create: {
                ...stage,
                id: `default-stage-${stage.sequence}`
            },
        });
    }
    console.log('CRM Stages seeded.');

    // 2. Seed CRM Activity Types
    const activityTypes = [
        { name: 'اتصال (Call)', icon: 'Phone', daysDelay: 0 },
        { name: 'اجتماع (Meeting)', icon: 'Users', daysDelay: 1 },
        { name: 'متابعة (Follow-up)', icon: 'ClipboardList', daysDelay: 3 },
        { name: 'بريد إلكتروني (Email)', icon: 'Mail', daysDelay: 0 },
        { name: 'واتساب (WhatsApp)', icon: 'MessageCircle', daysDelay: 0 },
    ];

    for (const type of activityTypes) {
        await prisma.crmActivityType.upsert({
            where: { id: `default-type-${type.icon.toLowerCase()}` },
            update: type,
            create: {
                ...type,
                id: `default-type-${type.icon.toLowerCase()}`
            },
        });
    }
    console.log('CRM Activity Types seeded.');

    // 3. Create Default Sales Team (if admin exists)
    const admin = await prisma.user.findFirst({
        where: { OR: [{ username: 'admin' }, { email: 'admin@example.com' }] }
    });

    if (admin) {
        await prisma.crmTeam.upsert({
            where: { name: 'فريق المبيعات الرئيسي' },
            update: {
                leaderId: admin.id,
                active: true,
            },
            create: {
                name: 'فريق المبيعات الرئيسي',
                leaderId: admin.id,
                active: true,
                sequence: 1,
                invoicedTarget: 100000
            }
        });
        console.log('Default Sales Team created.');
    }

    console.log('Odoo CRM seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
