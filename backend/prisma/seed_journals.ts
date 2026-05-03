import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Initial Journals ---');

    const journals = [
        { code: 'CSH', name: 'Cash Journal', nameAr: 'يومية الصندوق الرئيسي', type: 'CASH' },
        { code: 'BNK', name: 'Bank Journal', nameAr: 'يومية البنك', type: 'BANK' },
        { code: 'INV', name: 'Sales/Invoice Journal', nameAr: 'يومية المبيعات/الفواتير', type: 'SALE' },
        { code: 'GEN', name: 'General Journal', nameAr: 'يومية العمليات العامة', type: 'GENERAL' },
    ];

    for (const j of journals) {
        const existing = await prisma.financialJournal.findUnique({
            where: { code: j.code }
        });

        if (!existing) {
            // Find default account if possible
            let defaultAccountId = null;
            const settings = await prisma.financialSettings.findFirst();

            if (j.type === 'CASH') defaultAccountId = settings?.defaultCashAccountId;
            if (j.type === 'BANK') defaultAccountId = settings?.defaultBankAccountId;
            if (j.type === 'SALE') defaultAccountId = settings?.defaultIncomeAccountId;

            await prisma.financialJournal.create({
                data: {
                    code: j.code,
                    name: j.name,
                    nameAr: j.nameAr,
                    type: j.type as any,
                    defaultAccountId
                }
            });
            console.log(`Created journal: ${j.nameAr}`);
        } else {
            console.log(`Journal already exists: ${j.nameAr}`);
        }
    }

    console.log('--- Seeding Completed ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
