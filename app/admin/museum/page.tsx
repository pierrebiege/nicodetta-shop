import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { MUSEUM_WALLS, WARDROBE_WALLS } from '@/lib/slots';
import { WallLayoutEditor } from '@/components/WallLayoutEditor';
import { SlotLayoutEditor } from '@/components/SlotLayoutEditor';

export const dynamic = 'force-dynamic';

export default async function MuseumLayoutPage() {
  if (!(await getCurrentAdmin())) redirect('/admin/login');

  const all = await db.select().from(products).orderBy(asc(products.id));
  const paintings = all.filter((p) => p.type === 'painting');
  const clothes = all.filter((p) => p.type === 'clothing');

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-serif text-5xl mb-3">Layout</h1>
      <p className="text-sm opacity-70 mb-12 max-w-2xl">
        Arrange the paintings freely on each gallery wall — drag to move, drag the corners to resize. Eye level is highlighted as a red guide line.
      </p>

      <section className="mb-16">
        <h2 className="font-display uppercase tracking-widest text-xs opacity-60 mb-6">
          Gallery — paintings
        </h2>
        <WallLayoutEditor walls={MUSEUM_WALLS} items={paintings} />
      </section>

      <section>
        <h2 className="font-display uppercase tracking-widest text-xs opacity-60 mb-4">
          Wardrobe — clothes
        </h2>
        <p className="text-xs opacity-60 mb-4 max-w-xl">
          Clothes hang on two rails. Pick which item goes in which spot — left rail or right rail, 6 each.
        </p>
        <SlotLayoutEditor walls={WARDROBE_WALLS} items={clothes} />
      </section>
    </div>
  );
}
