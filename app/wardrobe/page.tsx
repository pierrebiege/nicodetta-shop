import Link from 'next/link';
import { Hall3D } from '@/components/Hall3D';
import { DEMO_PAINTINGS, DEMO_CLOTHES } from '@/lib/demo-data';
import { db } from '@/db';
import { products } from '@/db/schema';
import { asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function loadCatalog() {
  try {
    const all = await db.select().from(products).orderBy(asc(products.id));
    const paintings = all.filter((p) => p.type === 'painting');
    const clothes = all.filter((p) => p.type === 'clothing');
    if (paintings.length === 0 && clothes.length === 0) {
      return { paintings: DEMO_PAINTINGS, clothes: DEMO_CLOTHES };
    }
    return { paintings, clothes };
  } catch {
    return { paintings: DEMO_PAINTINGS, clothes: DEMO_CLOTHES };
  }
}

export default async function WardrobePage() {
  const { paintings, clothes } = await loadCatalog();
  return (
    <main className="fixed inset-0 bg-black">
      <Link
        href="/"
        className="absolute top-5 left-6 z-40 text-white text-xs uppercase tracking-widest font-bold mix-blend-difference"
      >
        ← Nicodetta
      </Link>
      <Hall3D
        paintings={paintings}
        clothes={clothes}
        spawn={{ position: [0, 1.65, 11], lookAt: [0, 1.65, 30] }}
      />
    </main>
  );
}
