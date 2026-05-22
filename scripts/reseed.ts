import { db } from '../db';
import { products } from '../db/schema';
import { DEMO_PAINTINGS, DEMO_CLOTHES } from '../lib/demo-data';

async function main() {
  console.log('Wiping products...');
  await db.delete(products);

  for (const p of [...DEMO_PAINTINGS, ...DEMO_CLOTHES]) {
    await db.insert(products).values({
      slug: p.slug,
      type: p.type,
      title: p.title,
      description: p.description,
      priceRappen: p.priceRappen,
      imagePath: p.imagePath,
      status: 'available',
      wallSlot: p.wallSlot,
    });
  }
  console.log(`✓ Reseeded ${DEMO_PAINTINGS.length + DEMO_CLOTHES.length} products`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
