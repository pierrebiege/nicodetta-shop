import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import path from 'node:path';

// If TURSO_DATABASE_URL is set, use the hosted libSQL database.
// Otherwise fall back to a local file (./nicodetta.db) for offline dev.
function makeClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (url) {
    return createClient({ url, authToken: token });
  }
  const localFile = process.env.DB_PATH ?? path.join(process.cwd(), 'nicodetta.db');
  return createClient({ url: `file:${localFile}` });
}

const client = makeClient();
export const db = drizzle(client, { schema });
export { schema };
