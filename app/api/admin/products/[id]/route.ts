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
  const [updated] = await db
    .update(products)
    .set({
      slug: body.slug,
      type: body.type,
      title: body.title,
      description: body.description,
      priceRappen: body.priceRappen,
      imagePath: body.imagePath,
      width: body.width ?? null,
      height: body.height ?? null,
      year: body.year ?? null,
      technique: body.technique ?? null,
      status: body.status,
    })
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
