const { Client } = require('pg');

const passwords = ['123456', '1234', 'root', 'admin', 'password', '', 'Nabila141729', 'postgres'];

async function run() {
    for (const pwd of passwords) {
        try {
            const client = new Client({
                connectionString: `postgresql://postgres:${pwd}@localhost:5432/institute_erp`
            });
            await client.connect();
            console.log('SUCCESS WITH PASSWORD:', pwd);
            await client.end();
            return;
        } catch (e) {
            try {
                const c2 = new Client({
                    connectionString: `postgresql://postgres:${pwd}@localhost:5432/postgres`
                });
                await c2.connect();
                console.log('SUCCESS TO DEFAULT DB WITH PASSWORD:', pwd);
                await c2.end();
                return;
            } catch (e2) {}
        }
    }
    console.log('All tests failed.');
}

run();
