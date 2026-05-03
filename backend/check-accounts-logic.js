const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccounts() {
    try {
        console.log('--- Checking Chart of Accounts for Financial Routing ---\n');

        const accounts = await prisma.account.findMany({
            select: { code: true, nameAr: true, type: true, id: true }
        });

        const findAccount = (keywords, type) => {
            return accounts.filter(acc =>
                (type ? acc.type === type : true) &&
                keywords.some(k => acc.nameAr.includes(k) || acc.code.startsWith(k))
            );
        };

        const targetAccounts = [
            { label: 'الصندوق (Cash)', keywords: ['صندوق', 'نقدية'], type: 'ASSET' },
            { label: 'البنك (Bank)', keywords: ['بنك', '111'], type: 'ASSET' },
            { label: 'ذمم الطلاب (Receivables)', keywords: ['طلاب', 'مدينون'], type: 'ASSET' },
            { label: 'خصومات المبيعات (Discounts)', keywords: ['خصم', 'منح'], type: 'EXPENSE' },
            { label: 'مصاريف الرواتب (Salary Expense)', keywords: ['رواتب', 'أجور'], type: 'EXPENSE' },
            { label: 'الرواتب المستحقة (Salary Payable)', keywords: ['رواتب مستحقة', 'التزامات رواتب'], type: 'LIABILITY' },
            { label: 'الموردون (Payables)', keywords: ['مورد', 'دائنو'], type: 'LIABILITY' },
            { label: 'حساب وسيط بنكي (Suspense)', keywords: ['وسيط', 'معلق'], type: 'ASSET' }
        ];

        console.log('Results:');
        targetAccounts.forEach(target => {
            const matches = findAccount(target.keywords, target.type);
            if (matches.length > 0) {
                console.log(`✅ ${target.label}: Found ${matches.length} matches`);
                matches.forEach(m => console.log(`   - [${m.code}] ${m.nameAr} (${m.type})`));
            } else {
                console.log(`❌ ${target.label}: Not clearly found!`);
            }
        });

        console.log('\n--- Full Account List (for manual check) ---');
        accounts.forEach(a => console.log(`[${a.code}] ${a.nameAr} (${a.type})`));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAccounts();
