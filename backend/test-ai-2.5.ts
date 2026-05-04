import dotenv from 'dotenv';
import { aiService } from './src/modules/academic/ai.service';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function testAI() {
    const apiKey = 'AIzaSyAsH7JrROEkmj5PVubpf_wGWNaP2FcL7zI';
    const assignment = 'This is a test assignment about software engineering.';
    const rubric = 'Criteria 1: Clarity. Criteria 2: Technical depth.';
    const options = {
        evalMode: 'normal',
        moodle: false,
        integrity: false,
        critical: false
    };

    console.log('Testing AI with gemini-2.5-flash and key:', apiKey.substring(0, 10) + '...');
    
    // Create direct client to test
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, respond with JSON {"status": "ok"}'
        });
        console.log('Success! Text:', response.text);
    } catch (error: any) {
        console.error('Test Failed!');
        console.error('Error Status:', error.status);
        console.error('Error Message:', error.message);
        if (error.response) {
             console.error('Error Response:', JSON.stringify(error.response, null, 2));
        }
    }
}

testAI();
