import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { cancelOrder } from '@/lib/orders';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { id } = await params;
  await cancelOrder(Number(id));
  return NextResponse.json({ ok: true });
}
