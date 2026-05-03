
import axios from 'axios';
import { z } from 'zod';

const API_URL = 'http://localhost:3000/api/v1';

async function verifyDetailedPayload() {
    console.log('🚀 Starting Strict Form Payload Verification...');

    try {
        // 0. Login
        console.log('🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Fetch Program ID for valid relation
        const programsRes = await axios.get(`${API_URL}/academic/programs`, config);
        const programId = programsRes.data.data.programs[0]?.id;

        // 2. Simulate Frontend Payload EXACTLY as it might be sent
        // Problem area: Empty strings for optional fields instead of undefined
        const problematicPayload = {
            // Required Fields
            firstNameEn: "Strict",
            lastNameEn: "Test",
            firstNameAr: "تجربة",
            lastNameAr: "صارمة",
            gender: "male",
            username: `strict_${Date.now()}`,

            // Optional Fields often sent as "" by React state
            email: "",
            phone: "",
            phone2: "",
            address: "",
            city: "",
            country: "",
            nationalId: "",
            passportNumber: "",
            dateOfBirth: "", // Empty string date

            // Academic
            specialization: "",
            certificateName: "",
            programId: programId || undefined, // This is usually handled, but empty string might slip

            // Financial (Numbers handled by my previous fix, but let's check nulls)
            tuitionFee: undefined,
        };

        console.log('📤 Sending Problematic Payload (Simulating empty strings)...');
        console.log(JSON.stringify(problematicPayload, null, 2));

        const createRes = await axios.post(`${API_URL}/students`, problematicPayload, config);

        console.log('✅ Success! Backend accepted the payload.');
        console.log('Student ID:', createRes.data.data.student.id);

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status);
            console.error('❌ Validation Details:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Script Error:', error.message);
        }
    }
}

verifyDetailedPayload();
