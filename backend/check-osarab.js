const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:password123@localhost:5432/postgres'
});

client.connect().then(async () => {
    try {
        const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false;');
        console.log('Databases in osarab_db container:', res.rows.map(r => r.datname));
        
        // Also try connecting to institute_erp if it exists
        if (res.rows.find(r => r.datname === 'institute_erp')) {
            const c2 = new Client({ connectionString: 'postgresql://postgres:password123@localhost:5432/institute_erp' });
            await c2.connect();
            const tRes = await c2.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`);
            console.log('Tables in institute_erp:', tRes.rows.map(r => r.tablename));
            if (tRes.rows.length > 0) {
                const countRes = await c2.query(`SELECT count(*) FROM "${tRes.rows[0].tablename}"`);
                console.log(`Count in ${tRes.rows[0].tablename}:`, countRes.rows[0].count);
            }
            await c2.end();
        } else if (res.rows.find(r => r.datname === 'osarab')) {
            const c2 = new Client({ connectionString: 'postgresql://postgres:password123@localhost:5432/osarab' });
            await c2.connect();
            const tRes = await c2.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`);
            console.log('Tables in osarab:', tRes.rows.map(r => r.tablename));
            await c2.end();
        }
    } catch (e) {
        console.error('Query failed:', e.message);
    }
    client.end();
}).catch(e => console.error('Connection failed:', e.message));
