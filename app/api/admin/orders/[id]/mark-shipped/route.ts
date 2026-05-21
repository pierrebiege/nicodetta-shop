import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { markShipped } from '@/lib/orders';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  await markShipped(Number(id), body.trackingCode);
  return NextResponse.json({ ok: true });
}
