
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

const url = "libsql://database-coquelicot-prism-vercel-icfg-16naipzg5tbpfaiz1ny2dv98.aws-us-east-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3Nzg0Mjg3OTksImlhdCI6MTc3NzgyMzk5OSwiaWQiOiIwMTlkZWU2My00YzAxLTc0OTAtOGZmYS02ZTY2MDZiNjViYzkiLCJyaWQiOiJlYTc3OWRjNC01YTM4LTQ0Y2MtYjk5MC1jMTE3MjVjOThmNDEifQ.xHkzat84W6IBdxiJk9nmR1Iv64NcOP1ay0Zpc7_l8laKgrwJRGY_Rf89096WIEacmOrDstLLkiG68Ay7sLa1CA";

const client = createClient({ url, authToken });

async function seed() {
  try {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = 'admin-user-001';
    const roleId = 'admin-role-001';
    const userRoleId = 'admin-userrole-001';
    const now = new Date().toISOString();

    // 1. Create role
    await client.execute({
      sql: `INSERT OR IGNORE INTO roles (id, name, description, is_system_role, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [roleId, 'admin', 'System Administrator', 1, now]
    });
    console.log("✅ Role created");

    // 2. Create user
    await client.execute({
      sql: `INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, is_active, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, 'admin', 'admin@institute.erp', hashedPassword, 'System', 'Admin', 1, 1, now, now]
    });
    console.log("✅ User created");

    // 3. Link role to user
    await client.execute({
      sql: `INSERT OR IGNORE INTO user_roles (id, user_id, role_id, created_at) VALUES (?, ?, ?, ?)`,
      args: [userRoleId, userId, roleId, now]
    });
    console.log("✅ Role linked to user");

    console.log("\n🎉 Admin user seeded successfully!");
    console.log("Username: admin");
    console.log("Password: password123");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    client.close();
  }
}

seed();
