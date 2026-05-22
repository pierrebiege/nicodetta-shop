import Link from 'next/link';
import { Wardrobe3D } from '@/components/Wardrobe3D';
import { DEMO_CLOTHES } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function WardrobePage() {
  const items = DEMO_CLOTHES;

  return (
    <main className="fixed inset-0 bg-black">
      <Link
        href="/"
        className="absolute top-5 left-6 z-40 text-white text-xs uppercase tracking-widest font-bold mix-blend-difference"
      >
        ← Nicodetta
      </Link>
      <div className="absolute top-5 right-6 z-40 text-white text-xs uppercase tracking-widest opacity-60">
        Wardrobe · {items.length} pieces
      </div>
      <Wardrobe3D items={items} />
    </main>
  );
}
