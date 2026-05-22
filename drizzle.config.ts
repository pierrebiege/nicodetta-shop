import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';

config({ path: '.env.local' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

export default (url
  ? {
      schema: './db/schema.ts',
      out: './db/migrations',
      dialect: 'turso',
      dbCredentials: { url, authToken },
    }
  : {
      schema: './db/schema.ts',
      out: './db/migrations',
      dialect: 'sqlite',
      dbCredentials: { url: 'file:./nicodetta.db' },
    }) satisfies Config;
