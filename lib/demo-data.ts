// Hardcoded demo catalog. Used by the public 3D rooms + frontpage so the
// images always render, even if the SQLite DB doesn't ship to Vercel's
// serverless bundle. The /admin pages still use the live DB.

import type { Product } from '@/db/schema';

const PAINTING_TEMPLATES = [
  '/works/tpl-painting-1.png',
  '/works/tpl-painting-2.png',
  '/works/tpl-painting-3.png',
];
const CLOTHING_TEMPLATE = '/works/tpl-clothing-1.png';

const PAINTING_DESC = `Original. One of one. Edition of 1.

Carefully packed and insured for shipping. Framed or unframed by arrangement.

Reach out if you have questions.`;

const CLOTHING_DESC = `Artworked one-off. One size, one cut, one piece.

Hand-painted, hand-fixed, signed. Cool wash inside out. No tumble dry.

Each piece wears its history visibly.`;

const PAINTINGS_RAW = [
  { title: 'Shadowfield I', technique: 'Acrylic on canvas', width: 80, height: 100, year: 2024, price: 1200 },
  { title: 'Mask Carrier', technique: 'Oil on wood', width: 50, height: 70, year: 2024, price: 950 },
  { title: 'Cat, Seat, Woman', technique: 'Mixed media', width: 60, height: 90, year: 2024, price: 1450 },
  { title: 'Clouds in the Skull', technique: 'Acrylic on paper', width: 42, height: 60, year: 2025, price: 680 },
  { title: 'Quiet Inventory', technique: 'Ink on canvas', width: 100, height: 140, year: 2025, price: 2200 },
  { title: 'Homage to No One', technique: 'Oil on canvas', width: 70, height: 100, year: 2025, price: 1800 },
  { title: 'Three Tracks', technique: 'Acrylic on canvas', width: 90, height: 70, year: 2025, price: 1100 },
  { title: 'Eye in the Chest', technique: 'Mixed media on paper', width: 50, height: 70, year: 2025, price: 780 },
  { title: 'Night Talk', technique: 'Oil on canvas', width: 80, height: 110, year: 2025, price: 1650 },
  { title: 'Fragments, Found', technique: 'Collage on canvas', width: 60, height: 80, year: 2025, price: 920 },
  { title: 'Untitled (for M.)', technique: 'Acrylic, spray', width: 100, height: 100, year: 2025, price: 1400 },
  { title: 'Self, Half', technique: 'Oil on wood', width: 40, height: 60, year: 2026, price: 580 },
];

const CLOTHING_RAW = [
  { title: 'Jeans 01 — Flower', technique: 'Hand-painted acrylic', year: 2025, price: 240 },
  { title: 'Jeans 02 — Patch', technique: 'Spray + embroidery', year: 2025, price: 280 },
  { title: 'Jeans 03 — Double', technique: 'Twice worked acrylic', year: 2025, price: 320 },
  { title: 'Jeans 04 — Shadow', technique: 'Ink + acrylic', year: 2025, price: 260 },
  { title: 'Workwear 01 — Knee', technique: 'Acrylic, tape resist', year: 2025, price: 290 },
  { title: 'Workwear 02 — Cell', technique: 'Spray, stencil', year: 2025, price: 250 },
  { title: 'Pant 01 — Lines', technique: 'Permanent marker', year: 2026, price: 220 },
  { title: 'Pant 02 — Stamp', technique: 'Lino-cut print', year: 2026, price: 240 },
  { title: 'Cargo 01 — Layers', technique: 'Multi-layer acrylic', year: 2026, price: 310 },
  { title: 'Cargo 02 — Call', technique: 'Acrylic, hand sewn', year: 2026, price: 295 },
  { title: 'Denim 01 — Mask', technique: 'Acrylic + patch', year: 2026, price: 270 },
  { title: 'Denim 02 — Ghost', technique: 'Bleach + acrylic', year: 2026, price: 285 },
];

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

export const DEMO_PAINTINGS: Product[] = PAINTINGS_RAW.map((p, i) => ({
  id: 1000 + i,
  slug: slugify(p.title),
  type: 'painting',
  title: p.title,
  description: PAINTING_DESC,
  priceRappen: p.price * 100,
  imagePath: PAINTING_TEMPLATES[i % PAINTING_TEMPLATES.length],
  width: p.width,
  height: p.height,
  year: p.year,
  technique: p.technique,
  status: 'available',
  createdAt: new Date(),
}));

export const DEMO_CLOTHES: Product[] = CLOTHING_RAW.map((c, i) => ({
  id: 2000 + i,
  slug: slugify(c.title),
  type: 'clothing',
  title: c.title,
  description: CLOTHING_DESC,
  priceRappen: c.price * 100,
  imagePath: CLOTHING_TEMPLATE,
  width: null,
  height: null,
  year: c.year,
  technique: c.technique,
  status: 'available',
  createdAt: new Date(),
}));

export function findDemoProductBySlug(slug: string): Product | null {
  return [...DEMO_PAINTINGS, ...DEMO_CLOTHES].find((p) => p.slug === slug) ?? null;
}
