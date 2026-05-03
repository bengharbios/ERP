const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const suspense = await prisma.account.findUnique({ where: { code: '1160' } });
    const bank = await prisma.account.findUnique({ where: { code: '1110' } });
    const cash = await prisma.account.findUnique({ where: { code: '1120' } });
    const receivable = await prisma.account.findUnique({ where: { code: '1130' } });
    const income = await prisma.account.findUnique({ where: { code: '4100' } });
    const vat = await prisma.account.findUnique({ where: { code: '2120' } });

    console.log(JSON.stringify({ suspense, bank, cash, receivable, income, vat }, null, 2));

    // Update financial settings
    const settings = await prisma.financialSettings.findFirst();
    if (settings) {
        await prisma.financialSettings.update({
            where: { id: settings.id },
            data: {
                defaultBankAccountId: bank?.id,
                defaultCashAccountId: cash?.id,
                defaultBankSuspenseAccountId: suspense?.id,
                defaultStudentReceivableAccountId: receivable?.id,
                defaultIncomeAccountId: income?.id,
                defaultVatAccountId: vat?.id
            }
        });
        console.log('✅ Updated Financial Settings with account IDs');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
