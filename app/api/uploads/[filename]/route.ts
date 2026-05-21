import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

type Ctx = { params: Promise<{ filename: string }> };

// Serves ephemeral uploads from /tmp/uploads. Only used on Vercel.
export async function GET(_req: Request, { params }: Ctx) {
  const { filename } = await params;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: 'bad name' }, { status: 400 });
  }
  const filePath = path.join('/tmp', 'uploads', filename);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    const type =
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.webp' ? 'image/webp' :
      'application/octet-stream';
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'content-type': type,
        'cache-control': 'public, max-age=86400',
      },
    });
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
