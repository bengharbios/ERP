
import { createClient } from '@libsql/client';
import fs from 'fs';

const url = "libsql://database-coquelicot-prism-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3Nzg0Mjg3OTksImlhdCI6MTc3NzgyMzk5OSwiaWQiOiIwMTlkZWU2My00YzAxLTc0OTAtOGZmYS02ZTY2MDZiNjViYzkiLCJyaWQiOiJlYTc3OWRjNC01YTM4LTQ0Y2MtYjk5MC1jMTE3MjVjOThmNDEifQ.xHkzat84W6IBdxiJk9nmR1Iv64NcOP1ay0Zpc7_l8laKgrwJRGY_Rf89096WIEacmOrDstLLkiG68Ay7sLa1CA";

const client = createClient({
  url: url,
  authToken: authToken,
});

async function run() {
  try {
    console.log("Reading schema_utf8.sql...");
    let schemaSql = fs.readFileSync('schema_utf8.sql', 'utf8');
    
    // Split by ; but ignore it inside comments or strings (basic split)
    // Prisma output is very clean so a basic split should work
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements. Executing...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      // Skip comments at the beginning of statements
      if (stmt.startsWith('--')) {
          const lines = stmt.split('\n').filter(l => !l.trim().startsWith('--'));
          const cleanStmt = lines.join('\n').trim();
          if (!cleanStmt) continue;
          try {
            await client.execute(cleanStmt);
          } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error(`Error in statement ${i}:`, err.message);
                console.error("Statement was:", cleanStmt);
            }
          }
      } else {
          try {
            await client.execute(stmt);
          } catch (err) {
            if (!err.message.includes('already exists')) {
                console.error(`Error in statement ${i}:`, err.message);
                console.error("Statement was:", stmt);
            }
          }
      }
      
      if (i % 20 === 0) console.log(`Processed ${i}/${statements.length} statements...`);
    }

    console.log("Database schema successfully pushed to Turso!");
  } catch (error) {
    console.error("Failed to push schema:", error);
  } finally {
    client.close();
  }
}

run();
