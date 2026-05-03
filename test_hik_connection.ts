// @ts-nocheck
import axios from 'axios';
// @ts-ignore
import axiosDigestAuth from '@mhoc/axios-digest-auth';
import * as https from 'https';

const CONFIG = {
    ip: '10.255.254.30',
    port: 80,
    username: 'admin',
    password: 'Hik@112233'
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testHik() {
    console.log('--- Testing Hikvision Connection ---');
    console.log(`Target: ${CONFIG.ip}:${CONFIG.port}`);

    // Test 1: HTTP Digest
    try {
        console.log('Attempting HTTP Digest...');
        const url = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const digestAuth = new axiosDigestAuth({
            username: CONFIG.username,
            password: CONFIG.password,
        });

        const response = await digestAuth.request({
            method: 'GET',
            url: url,
            timeout: 5000,
            httpsAgent
        });
        console.log('✅ HTTP Digest SUCCESS!');
        console.log('Model:', response.data.DeviceModel || response.data);
    } catch (e) {
        console.log('❌ HTTP Digest Failed:', e.message);
        if (e.response) console.log('Status:', e.response.status);
    }

    // Test 2: HTTP Basic
    try {
        console.log('\nAttempting HTTP Basic...');
        const url = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const auth = Buffer.from(`${CONFIG.username}:${CONFIG.password}`).toString('base64');

        await axios.get(url, {
            headers: { 'Authorization': `Basic ${auth}` },
            timeout: 5000,
            httpsAgent
        });
        console.log('✅ HTTP Basic SUCCESS!');
    } catch (e) {
        console.log('❌ HTTP Basic Failed:', e.message);
        if (e.response) console.log('Status:', e.response.status);
    }

    // Test 3: HTTPS Digest
    try {
        console.log('\nAttempting HTTPS Digest...');
        const url = `https://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const digestAuth = new axiosDigestAuth({
            username: CONFIG.username,
            password: CONFIG.password,
        });

        const response = await digestAuth.request({
            method: 'GET',
            url: url,
            timeout: 5000,
            httpsAgent
        });
        console.log('✅ HTTPS Digest SUCCESS!');
    } catch (e) {
        console.log('❌ HTTPS Digest Failed:', e.message);
    }
}

testHik();
