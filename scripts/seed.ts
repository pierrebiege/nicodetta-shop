import { db } from '../db';
import { products, admins } from '../db/schema';
import bcrypt from 'bcryptjs';

const PAINTING_TEMPLATES = [
  '/works/tpl-painting-1.png',
  '/works/tpl-painting-2.png',
  '/works/tpl-painting-3.png',
];
const CLOTHING_TEMPLATE = '/works/tpl-clothing-1.png';

const PAINTINGS = [
  { title: 'Schattenfeld I', technique: 'Acryl auf Leinwand', w: 80, h: 100, y: 2024, price: 1200 },
  { title: 'Maskenträger', technique: 'Öl auf Holz', w: 50, h: 70, y: 2024, price: 950 },
  { title: 'Katze, Sitz, Frau', technique: 'Mischtechnik', w: 60, h: 90, y: 2024, price: 1450 },
  { title: 'Wolken im Schädel', technique: 'Acryl auf Papier', w: 42, h: 60, y: 2025, price: 680 },
  { title: 'Stilles Inventar', technique: 'Tusche auf Leinwand', w: 100, h: 140, y: 2025, price: 2200 },
  { title: 'Hommage an niemand', technique: 'Öl auf Leinwand', w: 70, h: 100, y: 2025, price: 1800 },
  { title: 'Drei Spuren', technique: 'Acryl auf Leinwand', w: 90, h: 70, y: 2025, price: 1100 },
  { title: 'Auge in der Brust', technique: 'Mischtechnik auf Papier', w: 50, h: 70, y: 2025, price: 780 },
  { title: 'Nachtgespräch', technique: 'Öl auf Leinwand', w: 80, h: 110, y: 2025, price: 1650 },
  { title: 'Fragmente, gefunden', technique: 'Collage auf Leinwand', w: 60, h: 80, y: 2025, price: 920 },
  { title: 'Untitled (für M.)', technique: 'Acryl, Sprühlack', w: 100, h: 100, y: 2025, price: 1400 },
  { title: 'Selbst, halb', technique: 'Öl auf Holz', w: 40, h: 60, y: 2026, price: 580 },
];

const CLOTHING = [
  { title: 'Jeans 01 — Blume', technique: 'Acryl handbemalt', y: 2025, price: 240 },
  { title: 'Jeans 02 — Patch', technique: 'Sprühfarbe + Stickerei', y: 2025, price: 280 },
  { title: 'Jeans 03 — Doppelt', technique: 'Acryl, doppelt verkünstlert', y: 2025, price: 320 },
  { title: 'Jeans 04 — Schatten', technique: 'Tusche + Acryl', y: 2025, price: 260 },
  { title: 'Workwear 01 — Knie', technique: 'Acryl, Tape-Resist', y: 2025, price: 290 },
  { title: 'Workwear 02 — Zelle', technique: 'Sprühlack, Schablone', y: 2025, price: 250 },
  { title: 'Pant 01 — Linien', technique: 'Permanent Marker', y: 2026, price: 220 },
  { title: 'Pant 02 — Stempel', technique: 'Linolschnitt-Druck', y: 2026, price: 240 },
  { title: 'Cargo 01 — Schichten', technique: 'Acryl, mehrlagig', y: 2026, price: 310 },
  { title: 'Cargo 02 — Ruf', technique: 'Acryl, handgenäht', y: 2026, price: 295 },
  { title: 'Denim 01 — Maske', technique: 'Acryl + Patch', y: 2026, price: 270 },
  { title: 'Denim 02 — Geist', technique: 'Bleach + Acryl', y: 2026, price: 285 },
];

const PAINTING_DESC = `Original. Unikat. Auflage 1.

Das Werk wird sorgfältig verpackt und versichert versandt. Gerahmt oder ungerahmt — nach Absprache.

Bei Fragen schreib mir direkt.`;

const CLOTHING_DESC = `Verkünstlertes Einzelstück. Eine Grösse, ein Schnitt, ein Stück.

Handbemalt, von Hand fixiert, signiert. Wäsche kühl, auf links, nicht in den Trockner.

Jedes Stück trägt seine Geschichte sichtbar.`;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  // Admin
  const adminCount = (await db.select().from(admins)).length;
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD ?? 'nicodetta';
    const hash = await bcrypt.hash(password, 10);
    await db.insert(admins).values({ username: 'nicodetta', passwordHash: hash });
    console.log(`✓ Admin angelegt — username: nicodetta · passwort: ${password}`);
  } else {
    console.log('· Admin existiert bereits');
  }

  // Wipe existing seed data (only on empty / dev)
  const productCount = (await db.select().from(products)).length;
  if (productCount > 0) {
    console.log(`· ${productCount} Produkte existieren bereits — überspringe Seed`);
    return;
  }

  for (let i = 0; i < PAINTINGS.length; i++) {
    const p = PAINTINGS[i];
    const tpl = PAINTING_TEMPLATES[i % PAINTING_TEMPLATES.length];
    await db.insert(products).values({
      slug: slugify(p.title),
      type: 'painting',
      title: p.title,
      description: PAINTING_DESC,
      priceRappen: p.price * 100,
      imagePath: tpl,
      width: p.w,
      height: p.h,
      year: p.y,
      technique: p.technique,
      status: 'available',
    });
  }
  console.log(`✓ ${PAINTINGS.length} Bilder angelegt`);

  for (const c of CLOTHING) {
    await db.insert(products).values({
      slug: slugify(c.title),
      type: 'clothing',
      title: c.title,
      description: CLOTHING_DESC,
      priceRappen: c.price * 100,
      imagePath: CLOTHING_TEMPLATE,
      year: c.y,
      technique: c.technique,
      status: 'available',
    });
  }
  console.log(`✓ ${CLOTHING.length} Kleidungsstücke angelegt`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
