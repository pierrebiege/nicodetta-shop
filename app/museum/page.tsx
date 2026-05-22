import Link from 'next/link';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
import { Museum3D } from '@/components/Museum3D';

export const dynamic = 'force-dynamic';

export default async function MuseumPage() {
  const paintings = await db
    .select()
    .from(products)
    .where(eq(products.type, 'painting'))
    .orderBy(asc(products.id));

  return (
    <main className="fixed inset-0 bg-ink">
      <Link
        href="/"
        className="absolute top-5 left-6 z-40 text-paper text-xs uppercase tracking-widest font-bold mix-blend-difference"
      >
        ← Nicodetta
      </Link>
      <div className="absolute top-5 right-6 z-40 text-paper text-xs uppercase tracking-widest opacity-60">
        Saal 3D · {paintings.length} Werke
      </div>
      <Museum3D paintings={paintings} />
    </main>
  );
}
