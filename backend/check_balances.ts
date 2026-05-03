import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkBalances() {
    let output = '--- Account Balances Check ---\n';
    const rootAccounts = await prisma.account.findMany({
        where: { parentId: null },
        include: {
            children: {
                include: {
                    children: true
                }
            }
        },
        orderBy: { code: 'asc' }
    });

    for (const root of rootAccounts) {
        output += `[${root.code}] ${root.nameAr}: Balance = ${root.balance}\n`;
        for (const child of root.children) {
            output += `   └─ [${child.code}] ${child.nameAr}: Balance = ${child.balance}\n`;
            for (const grandchild of child.children) {
                output += `      └─ [${grandchild.code}] ${grandchild.nameAr}: Balance = ${grandchild.balance}\n`;
            }
        }
    }
    fs.writeFileSync('balances_report.txt', output);
    console.log('Report saved to balances_report.txt');
}

checkBalances()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
