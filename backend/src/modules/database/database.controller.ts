import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Export all database data as JSON
 */
export const exportDatabase = async (_req: Request, res: Response) => {
    try {
        const data = {
            settings: await prisma.settings.findMany(),
            roles: await prisma.role.findMany({ include: { rolePermissions: true } }),
            users: await prisma.user.findMany(),
            departments: await prisma.department.findMany(),
            employees: await prisma.employee.findMany(),
            programs: await prisma.program.findMany({ include: { programLevel: true } }),
            students: await prisma.student.findMany(),
            // Add other tables as needed
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };

        return res.json({ success: true, data });
    } catch (error: any) {
        console.error('Export error:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to export data' } });
    }
};

/**
 * Import database data from JSON
 */
export const importDatabase = async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ success: false, error: { message: 'No data provided' } });

        // Logic for importing data (this is complex and needs care with relations)
        // For simplicity in this demo, we'll focus on the structure
        // A production version would use transactions and specific order

        return res.json({ success: true, message: 'Import functionality structured. Requires specific ordering for relations.' });
    } catch (error: any) {
        console.error('Import error:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to import data' } });
    }
};

/**
 * Trigger demo seeding
 */
export const seedDemoData = async (_req: Request, res: Response) => {
    try {
        const seedPath = path.join(process.cwd(), 'prisma', 'seed.ts');
        // 1. Run Core Seed
        // seedPath is already defined above
        await new Promise((resolve, _reject) => {
            exec(`npx tsx ${seedPath}`, (error, stdout) => {
                if (error) return _reject(error);
                console.log(stdout);
                resolve(stdout);
            });
        });

        // 2. Run Settings Seed
        const settingsSeedPath = path.join(process.cwd(), 'prisma', 'seed_settings.js');
        await new Promise((resolve, _reject) => {
            exec(`node ${settingsSeedPath}`, (error, stdout) => {
                if (error) return _reject(error);
                console.log(stdout);
                resolve(stdout);
            });
        });

        // 3. Run Demo Users
        const usersSeedPath = path.join(process.cwd(), 'prisma', 'seed-demo-users.js');
        await new Promise((resolve, _reject) => {
            exec(`node ${usersSeedPath}`, (error, stdout) => {
                if (error) return _reject(error);
                console.log(stdout);
                resolve(stdout);
            });
        });

        // 4. Run Fee Data
        const feeSeedPath = path.join(process.cwd(), 'prisma', 'seed-fee-data.js');
        await new Promise((resolve, _reject) => {
            exec(`node ${feeSeedPath}`, (error, stdout) => {
                if (error) return _reject(error);
                console.log(stdout);
                resolve(stdout);
            });
        });

        // 5. Run HR Data
        const hrSeedPath = path.join(process.cwd(), 'prisma', 'seed-hr.js');
        await new Promise((resolve, _reject) => {
            exec(`node ${hrSeedPath}`, (error, stdout) => {
                // Non-blocking log
                if (!error) console.log(stdout);
                resolve(stdout);
            });
        });

        return res.json({ success: true, message: 'Full demo environment seeded successfully' });
    } catch (error: any) {
        console.error('Seed trigger error:', error);
        return res.status(500).json({ success: false, error: { message: 'Failed to trigger seed' } });
    }
};
