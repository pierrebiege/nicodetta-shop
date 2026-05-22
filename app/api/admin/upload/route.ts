import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { put } from '@vercel/blob';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const fd = await req.formData();
  const file = fd.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'no image' }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const ext = path.extname(file.name) || '.png';
  const filename = `${hash}${ext}`;

  // Production / Vercel: write to Vercel Blob if the token is set
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await put(`works/${filename}`, buf, {
      access: 'public',
      contentType: file.type || 'image/png',
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    return NextResponse.json({ path: result.url });
  }

  // Local dev fallback: write to public/works/
  const uploadDir = path.join(process.cwd(), 'public', 'works');
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buf);
  return NextResponse.json({ path: `/works/${filename}` });
}
