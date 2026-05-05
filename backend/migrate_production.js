
import { createClient } from '@libsql/client';

const url = "libsql://database-coquelicot-prism-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3Nzg0Mjg3OTksImlhdCI6MTc3NzgyMzk5OSwiaWQiOiIwMTlkZWU2My00YzAxLTc0OTAtOGZmYS02ZTY2MDZiNjViYzkiLCJyaWQiOiJlYTc3OWRjNC01YTM4LTQ0Y2MtYjk5MC1jMTE3MjVjOThmNDEifQ.xHkzat84W6IBdxiJk9nmR1Iv64NcOP1ay0Zpc7_l8laKgrwJRGY_Rf89096WIEacmOrDstLLkiG68Ay7sLa1CA";

const client = createClient({
  url: url,
  authToken: authToken,
});

async function run() {
  const queries = [
    // Settings Table
    "ALTER TABLE settings ADD COLUMN report_institution_name_ar TEXT;",
    "ALTER TABLE settings ADD COLUMN report_institution_name_en TEXT;",
    "ALTER TABLE settings ADD COLUMN report_logo TEXT;",
    "ALTER TABLE settings ADD COLUMN report_watermark_type TEXT DEFAULT 'none';",
    "ALTER TABLE settings ADD COLUMN report_watermark_text TEXT;",
    "ALTER TABLE settings ADD COLUMN report_watermark_image TEXT;",
    "ALTER TABLE settings ADD COLUMN report_font TEXT DEFAULT 'Tajawal';",
    
    // System Settings Table
    "ALTER TABLE system_settings ADD COLUMN report_institution_name_ar TEXT;",
    "ALTER TABLE system_settings ADD COLUMN report_institution_name_en TEXT;",
    "ALTER TABLE system_settings ADD COLUMN report_logo TEXT;",
    "ALTER TABLE system_settings ADD COLUMN report_watermark_type TEXT DEFAULT 'none';",
    "ALTER TABLE system_settings ADD COLUMN report_watermark_text TEXT;",
    "ALTER TABLE system_settings ADD COLUMN report_watermark_image TEXT;",
    "ALTER TABLE system_settings ADD COLUMN report_font TEXT DEFAULT 'Tajawal';"
  ];

  for (const q of queries) {
    try {
      console.log(`Executing: ${q}`);
      await client.execute(q);
      console.log("Success");
    } catch (err) {
      if (err.message.includes("already exists")) {
        console.log("Column already exists, skipping...");
      } else {
        console.error("Error:", err.message);
      }
    }
  }
  
  client.close();
  console.log("Migration finished.");
}

run();
