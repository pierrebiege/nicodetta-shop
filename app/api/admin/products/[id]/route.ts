import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  if (body.type !== undefined) update.type = body.type;
  if (body.title !== undefined) update.title = body.title;
  if (body.description !== undefined) update.description = body.description;
  if (body.priceRappen !== undefined) update.priceRappen = body.priceRappen;
  if (body.imagePath !== undefined) update.imagePath = body.imagePath;
  if (body.status !== undefined) update.status = body.status;
  if (body.wallSlot !== undefined) update.wallSlot = body.wallSlot;

  const [updated] = await db
    .update(products)
    .set(update)
    .where(eq(products.id, Number(id)))
    .returning();
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { id } = await params;
  await db.delete(products).where(eq(products.id, Number(id)));
  return NextResponse.json({ ok: true });
}
