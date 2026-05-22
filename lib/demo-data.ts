// Hardcoded demo catalog. Used by the public 3D rooms + frontpage so the
// images always render, even if the SQLite DB doesn't ship to Vercel.
// The /admin pages still use the live DB.

import type { Product } from '@/db/schema';

const PAINTING_TEMPLATES = [
  '/works/tpl-painting-1.png',
  '/works/tpl-painting-2.png',
  '/works/tpl-painting-3.png',
];
const CLOTHING_TEMPLATE = '/works/tpl-clothing-1.png';

const PAINTING_DESC = `Original. One of one.`;
const CLOTHING_DESC = `Artworked one-off. One size, one cut, one piece.`;

// 12 paintings with explicit wall slot assignments
const PAINTINGS_RAW = [
  { title: 'Shadowfield I',     price: 1200, wallSlot: 'museum:back:0' },
  { title: 'Mask Carrier',      price: 950,  wallSlot: 'museum:back:1' },
  { title: 'Cat, Seat, Woman',  price: 1450, wallSlot: 'museum:back:2' },
  { title: 'Clouds in the Skull', price: 680, wallSlot: 'museum:back:3' },
  { title: 'Quiet Inventory',   price: 2200, wallSlot: 'museum:left:0' },
  { title: 'Homage to No One',  price: 1800, wallSlot: 'museum:left:1' },
  { title: 'Three Tracks',      price: 1100, wallSlot: 'museum:left:2' },
  { title: 'Eye in the Chest',  price: 780,  wallSlot: 'museum:right:0' },
  { title: 'Night Talk',        price: 1650, wallSlot: 'museum:right:1' },
  { title: 'Fragments, Found',  price: 920,  wallSlot: 'museum:right:2' },
  { title: 'Untitled (for M.)', price: 1400, wallSlot: 'museum:front-left:0' },
  { title: 'Self, Half',        price: 580,  wallSlot: 'museum:front-right:0' },
];

const CLOTHING_RAW = [
  { title: 'Jeans 01 — Flower',    price: 240, wallSlot: 'wardrobe:left:0' },
  { title: 'Jeans 02 — Patch',     price: 280, wallSlot: 'wardrobe:left:1' },
  { title: 'Jeans 03 — Double',    price: 320, wallSlot: 'wardrobe:left:2' },
  { title: 'Jeans 04 — Shadow',    price: 260, wallSlot: 'wardrobe:left:3' },
  { title: 'Workwear 01 — Knee',   price: 290, wallSlot: 'wardrobe:left:4' },
  { title: 'Workwear 02 — Cell',   price: 250, wallSlot: 'wardrobe:left:5' },
  { title: 'Pant 01 — Lines',      price: 220, wallSlot: 'wardrobe:right:0' },
  { title: 'Pant 02 — Stamp',      price: 240, wallSlot: 'wardrobe:right:1' },
  { title: 'Cargo 01 — Layers',    price: 310, wallSlot: 'wardrobe:right:2' },
  { title: 'Cargo 02 — Call',      price: 295, wallSlot: 'wardrobe:right:3' },
  { title: 'Denim 01 — Mask',      price: 270, wallSlot: 'wardrobe:right:4' },
  { title: 'Denim 02 — Ghost',     price: 285, wallSlot: 'wardrobe:right:5' },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
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
  width: null,
  height: null,
  year: null,
  technique: null,
  status: 'available',
  wallSlot: p.wallSlot,
  wall: null,
  wallX: null,
  wallY: null,
  wallW: null,
  wallH: null,
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
  year: null,
  technique: null,
  status: 'available',
  wallSlot: c.wallSlot,
  wall: null,
  wallX: null,
  wallY: null,
  wallW: null,
  wallH: null,
  createdAt: new Date(),
}));

export function findDemoProductBySlug(slug: string): Product | null {
  return [...DEMO_PAINTINGS, ...DEMO_CLOTHES].find((p) => p.slug === slug) ?? null;
}
