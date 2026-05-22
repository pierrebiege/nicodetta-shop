import 'dotenv/config';
import { createClient } from '@libsql/client';

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  console.log('URL:', url?.slice(0, 60));
  console.log('Token set:', !!authToken);
  const client = createClient({ url: url!, authToken });
  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log('Tables:', res.rows.map((r) => r.name));
}

main().catch((e) => { console.error(e); process.exit(1); });
