import { db } from '../db';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';
import { slotToPlacement } from '../lib/slots';

async function main() {
  const all = await db.select().from(products);
  let n = 0;
  for (const p of all) {
    if (p.wall || !p.wallSlot) continue;
    // Only paintings get migrated to free placement
    if (!p.wallSlot.startsWith('museum:')) continue;
    const placement = slotToPlacement(p.wallSlot);
    if (!placement) continue;
    await db
      .update(products)
      .set(placement)
      .where(eq(products.id, p.id));
    n++;
  }
  console.log(`✓ Migrated ${n} paintings to free-placement`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
