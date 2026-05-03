import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkEntries() {
    console.log('--- Checking Journal Entries ---');
    const entries = await prisma.journalEntry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { journal: true, lines: true }
    });

    console.log(`Found ${entries.length} entries`);
    entries.forEach(e => {
        console.log(`[${e.entryNumber}] Date: ${e.date.toISOString()}, Desc: ${e.description}, Posted: ${e.isPosted}`);
    });
}

checkEntries()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
