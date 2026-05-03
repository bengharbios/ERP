
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    try {
        let report = '';
        const log = (msg) => { console.log(msg); report += msg + '\n'; };

        log('--- DB Connection Check ---');
        const device = await prisma.biometricDevice.findFirst();
        if (!device) {
            log('No biometric device found in DB.');
            return;
        }
        log(`Device: ${device.name} (${device.ipAddress})`);

        // ISAPI Fetch
        const DigestFetch = require('digest-fetch').default || require('digest-fetch');
        const { XMLParser } = require('fast-xml-parser');

        const client = new DigestFetch(device.username, device.password);
        const url = `http://${device.ipAddress}:${device.port}/ISAPI/AccessControl/UserInfo/Search?format=json`;
        const payload = {
            UserInfoSearchCond: {
                searchID: "1",
                searchResultPosition: 0,
                maxResults: 100
            }
        };

        log('Fetching users from device via ISAPI...');
        const res = await client.fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await res.json();
        const users = data.UserInfoSearch?.UserInfo || [];

        log(`Found ${users.length} users on device.`);

        log('--- Fetching Employees from DB ---');
        const employees = await prisma.employee.findMany({
            include: { user: true }
        });
        log(`Found ${employees.length} employees in DB.`);

        const dbBioIds = new Set(employees.map(e => String(e.biometricId)));

        log('\n--- COMPARISON ---');
        // Users on device but NOT in DB
        const missingInDb = users.filter(u => !dbBioIds.has(String(u.employeeNo)));

        if (missingInDb.length > 0) {
            log(`\n[WARNING] The following ${missingInDb.length} users exist on DEVICE but NOT in DB (by ID):`);
            missingInDb.forEach(u => log(`- ID: ${u.employeeNo} | Name: ${u.name}`));
        } else {
            log('\n[OK] All device users are linked to an Employee record.');
        }

        // Try to identify Rabia specifically by name or ID if known
        // Checking common variations
        const rabia = users.find(u =>
            (u.name && u.name.toLowerCase().includes('rabia')) ||
            (u.name && u.name.includes('ربيعة')) ||
            (u.name && u.name.toLowerCase().includes('abdelqader')) // From previously seen logs
        );

        if (rabia) {
            log(`\n[INFO] Possible Match found on device: ID=${rabia.employeeNo}, Name=${rabia.name}`);
            const linked = employees.find(e => String(e.biometricId) === String(rabia.employeeNo));
            if (linked) {
                log(`[OK] Linked to DB Employee: ${linked.user?.firstName} ${linked.user?.lastName} (BioID: ${linked.biometricId})`);
            } else {
                log(`[ERROR] User (ID: ${rabia.employeeNo}) is NOT linked to any DB Employee! You need to import this user.`);
            }
        } else {
            log(`\n[ERROR] 'Rabia' (or similar) was NOT found on the device user list.`);
            log('Listing all device users below for manual verification:');
            users.forEach(u => log(`- ${u.name} (ID: ${u.employeeNo})`));
        }

        fs.writeFileSync('missing_users_report.txt', report, 'utf8');
        console.log('\nReport saved to missing_users_report.txt. Please check this file.');

    } catch (error) {
        console.log('CAUGHT ERROR:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
