const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:password123@localhost:5432/visa_saas'
});

client.connect().then(async () => {
    try {
        const res = await client.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`);
        console.log('Tables in visa_saas:', res.rows.map(r => r.tablename));
    } catch (e) {
        console.error('Query failed:', e.message);
    }
    client.end();
}).catch(e => console.error('Connection failed:', e.message));
