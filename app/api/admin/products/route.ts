import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = await req.json();
  try {
    const [created] = await db
      .insert(products)
      .values({
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
        status: body.status ?? 'available',
      })
      .returning();
    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Speichern fehlgeschlagen' }, { status: 400 });
  }
}
