import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

// On Vercel the public/ folder is read-only.
// For the demo we accept the upload and write to /tmp/uploads/, served via /api/uploads/[file].
// For local dev we write to public/works/.
const ON_VERCEL = !!process.env.VERCEL;

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'kein Bild' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const ext = path.extname(file.name) || '.png';
  const filename = `${hash}${ext}`;

  if (ON_VERCEL) {
    const dir = '/tmp/uploads';
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buf);
    return NextResponse.json({ path: `/api/uploads/${filename}` });
  }

  const uploadDir = path.join(process.cwd(), 'public', 'works');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buf);
  return NextResponse.json({ path: `/works/${filename}` });
}
