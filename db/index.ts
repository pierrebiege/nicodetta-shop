import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

// On Vercel the deployment dir is read-only — copy the seeded DB to /tmp on boot.
// Locally we just use ./nicodetta.db.
function resolveDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  if (process.env.VERCEL) {
    const target = '/tmp/nicodetta.db';
    if (!fs.existsSync(target)) {
      const seed = path.join(process.cwd(), 'nicodetta.db');
      if (fs.existsSync(seed)) {
        fs.copyFileSync(seed, target);
      }
    }
    return target;
  }
  return path.join(process.cwd(), 'nicodetta.db');
}

const sqlite = new Database(resolveDbPath());
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { schema };
