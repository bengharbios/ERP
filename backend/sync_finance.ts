import { PrismaClient } from '@prisma/client';
import journalService from './src/services/journal.service';

const prisma = new PrismaClient();

async function syncPaymentsToJournals() {
    console.log('--- 🔍 Starting Financial Synchronization ---');

    // 1. Check Financial Settings
    const finSettings = await prisma.financialSettings.findFirst();
    if (!finSettings) {
        console.error('❌ ERROR: No Financial Settings found. Please configure them in the UI.');
        return;
    }

    console.log('✅ Found Financial Settings:');
    console.log(`   - Default Cash Account: ${finSettings.defaultCashAccountId}`);
    console.log(`   - Default Bank Account: ${finSettings.defaultBankAccountId || 'NOT SET'}`);
    console.log(`   - Student Receivable Account: ${finSettings.defaultStudentReceivableAccountId || 'NOT SET'}`);

    if (!finSettings.defaultStudentReceivableAccountId) {
        console.error('❌ CRITICAL ERROR: "Student Receivable Account" is not set. Automatic journal entries will fail.');
    }

    // 2. Find missing Accrual Entries for Calculations
    const calculations = await prisma.studentFeeCalculation.findMany();

    console.log(`\n--- 📑 Checking ${calculations.length} Fee Calculations (Accruals) ---`);

    for (const calc of calculations) {
        const existingJE = await prisma.journalEntry.findFirst({
            where: { reference: calc.calculationNumber }
        });

        if (existingJE) {
            console.log(`✅ Calculation ${calc.calculationNumber} already has an Accrual Entry`);
            continue;
        }

        console.log(`⚠️ Calculation ${calc.calculationNumber} missing Accrual Entry. Creating...`);

        try {
            const saleJournal = await prisma.financialJournal.findFirst({ where: { type: 'SALE' } });
            const revenueAccountId = finSettings.defaultIncomeAccountId;

            if (!revenueAccountId) throw new Error('Default Income Account not set');

            const je = await journalService.createJournalEntry({
                date: calc.createdAt.toISOString(),
                description: `مزامنة استحقاق رسوم - ${calc.title} (${calc.calculationNumber})`,
                reference: calc.calculationNumber,
                journalId: saleJournal?.id,
                lines: [
                    {
                        accountId: finSettings.defaultStudentReceivableAccountId!,
                        debit: Number(calc.totalAmount),
                        credit: 0,
                        description: `إثبات مديونية - ${calc.calculationNumber}`
                    },
                    {
                        accountId: revenueAccountId,
                        debit: 0,
                        credit: Number(calc.totalAmount),
                        description: `إثبات إيراد - ${calc.title}`
                    }
                ]
            }, 'system');

            await journalService.postJournalEntry(je.id, 'system');
            console.log(`   ✨ Accrual synced for ${calc.calculationNumber}`);
        } catch (err: any) {
            console.error(`   ❌ Failed to sync calculation ${calc.calculationNumber}: ${err.message}`);
        }
    }

    // 3. Find payments without Journal Entries
    const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'asc' }
    });

    console.log(`\n--- 💳 Checking ${payments.length} Payments (Receipts) ---`);

    for (const p of payments) {
        const existingJE = await prisma.journalEntry.findFirst({
            where: { reference: p.receiptNumber || 'NEVER_MATCH' }
        });

        if (existingJE) {
            console.log(`✅ Payment ${p.receiptNumber} already has a Journal Entry`);
            continue;
        }

        console.log(`⚠️ Payment ${p.receiptNumber} missing. Creating...`);

        try {
            const isCash = p.method === 'CASH';
            const journalCode = isCash ? 'CSH' : 'BNK';
            const journal = await prisma.financialJournal.findUnique({ where: { code: journalCode } });

            const debitAccountId = journal?.defaultAccountId || (isCash
                ? finSettings.defaultCashAccountId
                : (finSettings.defaultBankAccountId || (finSettings as any).defaultBankSuspenseAccountId));

            if (!debitAccountId) throw new Error(`Could not find debit account for method ${p.method}`);

            const je = await journalService.createJournalEntry({
                date: p.paymentDate.toISOString(),
                description: `مزامنة سداد رسوم - إيصال ${p.receiptNumber}`,
                reference: p.receiptNumber || undefined,
                journalId: journal?.id,
                lines: [
                    {
                        accountId: debitAccountId,
                        debit: Number(p.amount),
                        credit: 0,
                        description: `إيداع مبلغ السداد (${p.method})`
                    },
                    {
                        accountId: finSettings.defaultStudentReceivableAccountId!,
                        debit: 0,
                        credit: Number(p.amount),
                        description: `تخفيض مديونية الطالب - إيصال ${p.receiptNumber}`
                    }
                ]
            }, 'system');

            await journalService.postJournalEntry(je.id, 'system');
            console.log(`   ✨ Payment synced for ${p.receiptNumber}`);
        } catch (err: any) {
            console.error(`   ❌ Failed to sync payment ${p.receiptNumber}: ${err.message}`);
        }
    }

    console.log('\n--- 🎉 Synchronization Completed ---');
}

syncPaymentsToJournals()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
