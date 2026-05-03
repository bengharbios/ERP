import prisma from './src/common/db/prisma';

async function debugRabiaPayments() {
    console.log('--- Checking Recent Payments for Rabia ---');

    // 1. Find the student Rabia
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { firstNameAr: { contains: 'ربيعة' } },
                { firstNameEn: { contains: 'Rabia' } }
            ]
        }
    });

    if (!student) {
        console.log('Student Rabia not found');
        return;
    }

    console.log(`Found Student: ${student.id} - ${student.firstNameAr} ${student.lastNameAr || ''}`);

    // 2. Find calculations and payments
    const payments = await prisma.payment.findMany({
        where: {
            OR: [
                { studentId: student.id },
                { feeCalculation: { studentId: student.id } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            feeCalculation: true
        }
    });

    console.log(`Found ${payments.length} total payments for this student.`);

    for (const p of payments) {
        console.log(`- Payment: ${p.receiptNumber}, Amount: ${p.amount}, Date: ${p.paymentDate}`);

        const entries = await prisma.journalEntry.findMany({
            where: {
                OR: [
                    { reference: p.receiptNumber || undefined },
                    { description: { contains: p.receiptNumber || 'NEVER_MATCH' } }
                ]
            },
            include: { lines: true }
        });

        if (entries.length === 0) {
            console.log('  ❌ NO Journal Entry found for this payment!');
        } else {
            for (const je of entries) {
                console.log(`  ✅ Found Entry: ${je.entryNumber}, Posted: ${je.isPosted}, Desc: ${je.description}`);
                je.lines.forEach(l => {
                    console.log(`    Line: Acc ${l.accountId}, Debit: ${l.debit}, Credit: ${l.credit}`);
                });
            }
        }
    }

    // 3. Check for recent audit logs related to payments
    console.log('\n--- Checking Recent Audit Logs ---');
    const logs = await prisma.auditLog.findMany({
        where: {
            resourceType: 'Payment'
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    for (const log of logs) {
        console.log(`Log: ${log.action}, ResourceId: ${log.resourceId}, Date: ${log.createdAt}`);
        // afterData might be a JSON object
        console.log(`  Data: ${JSON.stringify(log.afterData)}`);
    }
}

debugRabiaPayments().catch(console.error);
