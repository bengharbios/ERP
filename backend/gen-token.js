const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const JWT_SECRET = "your-super-secret-jwt-key-change-in-production"; // From .env

async function generateToken() {
    try {
        const user = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (!user) {
            console.error('Admin user not found');
            return;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        console.log('TOKEN:' + token);
    } catch (error) {
        console.error('Error generating token:', error);
    } finally {
        await prisma.$disconnect();
    }
}

generateToken();
