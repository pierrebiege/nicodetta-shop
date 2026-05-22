import Link from 'next/link';
import { Hall3D } from '@/components/Hall3D';
import { DEMO_PAINTINGS, DEMO_CLOTHES } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function MuseumPage() {
  return (
    <main className="fixed inset-0 bg-black">
      <Link
        href="/"
        className="absolute top-5 left-6 z-40 text-white text-xs uppercase tracking-widest font-bold mix-blend-difference"
      >
        ← Nicodetta
      </Link>
      <Hall3D
        paintings={DEMO_PAINTINGS}
        clothes={DEMO_CLOTHES}
        spawn={{
          position: [0, 1.65, 6],
          lookAt: [0, 1.65, -8],
        }}
      />
    </main>
  );
}
