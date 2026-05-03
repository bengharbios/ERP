const axios = require('axios');
const DigestAuth = require('@mhoc/axios-digest-auth').default;
const https = require('https');

const CONFIG = {
    ip: '10.255.254.30',
    port: 80,
    username: 'admin',
    password: 'Hik@112233'
};

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

async function testHik() {
    console.log('--- Testing Hikvision Connection (JS Mode) ---');
    console.log(`Target: ${CONFIG.ip}:${CONFIG.port}`);
    console.log(`User: ${CONFIG.username}`);

    // 1. Try HTTP Digest
    try {
        console.log('\n[1] Attempting HTTP Digest...');
        const url = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const digestAuth = new DigestAuth({
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
        console.log('Response Status:', response.status);
    } catch (e) {
        console.log('❌ HTTP Digest Failed:', e.message);
        if (e.response) console.log('Status code:', e.response.status);
    }

    // 2. Try HTTP Basic
    try {
        console.log('\n[2] Attempting HTTP Basic...');
        const url = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const auth = Buffer.from(`${CONFIG.username}:${CONFIG.password}`).toString('base64');

        const response = await axios.get(url, {
            headers: { 'Authorization': `Basic ${auth}` },
            timeout: 5000,
            httpsAgent
        });

        console.log('✅ HTTP Basic SUCCESS!');
        console.log('Response Status:', response.status);
    } catch (e) {
        console.log('❌ HTTP Basic Failed:', e.message);
        if (e.response) console.log('Status code:', e.response.status);
    }

    // 3. Try HTTPS Digest
    try {
        console.log('\n[3] Attempting HTTPS Digest...');
        const url = `https://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        const digestAuth = new DigestAuth({
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
        console.log('Response Status:', response.status);
    } catch (e) {
        console.log('❌ HTTPS Digest Failed:', e.message);
        if (e.response) console.log('Status code:', e.response.status);
    }
    // 4. Debug Headers (First Request)
    try {
        console.log('\n[4] Analyzing Auth Headers...');
        const url = `http://${CONFIG.ip}:${CONFIG.port}/ISAPI/System/deviceInfo`;
        await axios.get(url, {
            timeout: 5000,
            validateStatus: () => true // Allow any status code
        }).then(res => {
            console.log('Status:', res.status);
            console.log('WWW-Authenticate Header:', res.headers['www-authenticate']);
        });
    } catch (e) {
        console.log('❌ Header Analysis Failed:', e.message);
    }
}

testHik();
