import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@institute.com' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@institute.com',
            passwordHash: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            phone: '1234567890',
            isActive: true
        }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@institute.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
