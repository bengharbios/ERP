import { Decimal } from '@prisma/client/runtime/library';

try {
    const d1 = new Decimal(10);
    const d2 = Decimal.add(d1, 5);
    console.log('Result:', d2.toString());
} catch (error: any) {
    console.error('Error:', error.message);
}
