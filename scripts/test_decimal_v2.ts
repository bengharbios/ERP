import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        // @ts-ignore
        const { Decimal } = await import('@prisma/client/runtime/library');
        console.log('Testing Decimal methods...');

        const d1 = new Decimal(10);
        console.log('d1 is Decimal:', d1 instanceof Decimal);

        try {
            // @ts-ignore
            const d2 = Decimal.add(d1, 5);
            console.log('Decimal.add(d1, 5) worked:', d2.toString());
        } catch (e: any) {
            console.log('Decimal.add failed:', e.message);
        }

        try {
            const d3 = d1.add(5);
            console.log('d1.add(5) worked:', d3.toString());
        } catch (e: any) {
            console.log('d1.add failed:', e.message);
        }

    } catch (error: any) {
        console.error('Fatal Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
