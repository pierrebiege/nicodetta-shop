import { db } from '../db';
import { products, admins } from '../db/schema';
import { DEMO_PAINTINGS, DEMO_CLOTHES } from '../lib/demo-data';
import bcrypt from 'bcryptjs';

async function main() {
  // Admin
  const adminCount = (await db.select().from(admins)).length;
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD ?? 'nicodetta';
    const hash = await bcrypt.hash(password, 10);
    await db.insert(admins).values({ username: 'nicodetta', passwordHash: hash });
    console.log(`✓ Admin created — username: nicodetta · password: ${password}`);
  } else {
    console.log('· Admin already exists');
  }

  const productCount = (await db.select().from(products)).length;
  if (productCount > 0) {
    console.log(`· ${productCount} products already exist — skipping seed`);
    return;
  }

  // Use the same hardcoded catalog as the frontend, so admin sees identical data
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
  console.log(`✓ Seeded ${DEMO_PAINTINGS.length} paintings + ${DEMO_CLOTHES.length} clothes with wall slots`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
