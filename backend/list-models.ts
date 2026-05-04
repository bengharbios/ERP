import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function listModels() {
    const apiKey = 'AIzaSyAsH7JrROEkmj5PVubpf_wGWNaP2FcL7zI';
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    try {
        console.log('Listing available models...');
        const models = await ai.models.list();
        for await (const model of models) {
            console.log('-', model.name);
        }
    } catch (error: any) {
        console.error('List Models Failed!', error.message);
    }
}

listModels();
