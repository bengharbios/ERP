import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    try {
        const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables in Turso:', res.rows.map(r => r.name));
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
