import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error('TURSO_DATABASE_URL is not defined');
}

const libsql = createClient({
  url: url,
  authToken: authToken,
});

const adapter = new PrismaLibSql(libsql);

const prisma = new PrismaClient({ 
  adapter,
  log: ['error', 'warn'],
});

export default prisma;
