const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const user = await prisma.user.create({
            data: {
                email: 'admin@institute.com',
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                phone: '1234567890',
                passwordHash: hashedPassword
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@institute.com');
        console.log('🔑 Password: admin123');

    } catch (error) {
        console.error('❌ Error creating admin:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
