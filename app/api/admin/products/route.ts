import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function uniqueSlug(base: string) {
  const baseSlug = base || 'work';
  let slug = baseSlug;
  let n = 1;
  while (true) {
    const [exists] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (!exists) return slug;
    slug = `${baseSlug}-${++n}`;
  }
}

export async function POST(req: Request) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const body = await req.json();
  try {
    const slug = await uniqueSlug(slugify(body.title || 'work'));
    const [created] = await db
      .insert(products)
      .values({
        slug,
        type: body.type,
        title: body.title,
        description: body.description,
        priceRappen: body.priceRappen,
        imagePath: body.imagePath,
        status: body.status ?? 'available',
      })
      .returning();
    return NextResponse.json(created);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Save failed' }, { status: 400 });
  }
}
