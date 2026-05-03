// Load env vars
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
const axios = require('axios');
const API_URL = 'http://localhost:3000/api/v1';

async function assignAdmin() {
    console.log('👑 Assigning Admin Role...');

    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        let user = await prisma.user.findUnique({
            where: { username: 'verifier' }
        });

        if (!user) {
            console.log('   Creating "verifier" user...');
            user = await prisma.user.create({
                data: {
                    username: 'verifier',
                    email: 'verifier@test.com',
                    passwordHash: hashedPassword,
                    firstName: 'Verifier',
                    lastName: 'Bot',
                    isActive: true
                }
            });
        } else {
            console.log('   "verifier" user exists. Updating password...');
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hashedPassword }
            });
        }

        console.log(`   User: ${user.username} (${user.id})`);

        // 2. Find or Create "admin" Role
        let adminRole = await prisma.role.findUnique({
            where: { name: 'admin' }
        });

        if (!adminRole) {
            console.log('   Creating "admin" role...');
            adminRole = await prisma.role.create({
                data: {
                    name: 'admin',
                    description: 'Super Administrator',
                    isSystemRole: true
                }
            });
        }
        console.log(`   Admin Role ID: ${adminRole.id}`);

        // 3. Ensure Permission "students:create" exists and is linked
        const permissionsNeeded = [
            // Students
            { resource: 'students', action: 'create' },
            { resource: 'students', action: 'read' },
            { resource: 'students', action: 'update' },
            { resource: 'students', action: 'delete' },
            // Programs
            { resource: 'programs', action: 'create' },
            { resource: 'programs', action: 'read' },
            { resource: 'programs', action: 'update' },
            { resource: 'programs', action: 'delete' },
            // Units
            { resource: 'units', action: 'create' },
            { resource: 'units', action: 'read' },
            { resource: 'units', action: 'update' },
            { resource: 'units', action: 'delete' },
            // Classes
            { resource: 'classes', action: 'create' },
            { resource: 'classes', action: 'read' },
            { resource: 'classes', action: 'update' },
            { resource: 'classes', action: 'delete' },
            // Settings
            { resource: 'settings', action: 'create' },
            { resource: 'settings', action: 'read' },
            { resource: 'settings', action: 'update' },
            { resource: 'settings', action: 'delete' },
        ];

        for (const p of permissionsNeeded) {
            let perm = await prisma.permission.findUnique({
                where: {
                    resource_action: {
                        resource: p.resource,
                        action: p.action
                    }
                }
            });

            if (!perm) {
                console.log(`   Creating permission ${p.resource}:${p.action}...`);
                perm = await prisma.permission.create({
                    data: {
                        resource: p.resource,
                        action: p.action,
                        description: `Allow ${p.action} on ${p.resource}`
                    }
                });
            }

            // Link to Role if not linked
            const rolePerm = await prisma.rolePermission.findUnique({
                where: {
                    roleId_permissionId: {
                        roleId: adminRole.id,
                        permissionId: perm.id
                    }
                }
            });

            if (!rolePerm) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: adminRole.id,
                        permissionId: perm.id
                    }
                });
                console.log(`   Linked ${p.resource}:${p.action} to Admin Role`);
            }
        }

        // 4. Assign Role to User
        const userRole = await prisma.userRole.findFirst({
            where: {
                userId: user.id,
                roleId: adminRole.id
            }
        });

        if (!userRole) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: adminRole.id
                }
            });
            console.log('✅ Role Assigned Successfully!');
        } else {
            console.log('   User already has admin role.');
        }

        // 5. Debug - List all permissions relative to Admin Role
        const fullAdminRole = await prisma.role.findUnique({
            where: { id: adminRole.id },
            include: {
                rolePermissions: {
                    include: { permission: true }
                }
            }
        });

        console.log('🔍 Debug: Admin Role Permissions:');
        fullAdminRole.rolePermissions.forEach(rp => {
            console.log(`   - ${rp.permission.resource}:${rp.permission.action}`);
        });

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

assignAdmin();
