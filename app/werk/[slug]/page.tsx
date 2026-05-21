import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';
import { BuyForm } from '@/components/BuyForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function WorkDetail({ params }: Props) {
  const { slug } = await params;
  const [product] = await db.select().from(products).where(eq(products.slug, slug));
  if (!product) notFound();

  return (
    <main className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
        <Link href="/" className="font-display font-black text-xl uppercase">
          Nicodetta
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-widest font-medium"
        >
          ← Zurück
        </Link>
      </header>

      <div className="grid grid-cols-12 min-h-screen">
        <div className="col-span-12 md:col-span-8 bg-muted flex items-center justify-center p-6 md:p-16 pt-24">
          <div className="relative w-full max-w-2xl aspect-[4/5]">
            <Image
              src={product.imagePath}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-contain"
            />
          </div>
        </div>

        <aside className="col-span-12 md:col-span-4 p-6 md:p-10 md:pt-24 flex flex-col gap-8 border-l border-ink">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60">
              {product.type === 'painting' ? 'Bild' : 'Kleidung'} ·{' '}
              {product.year ?? '—'}
            </p>
            <h1 className="font-display font-black text-4xl md:text-5xl uppercase leading-none mt-2">
              {product.title}
            </h1>
          </div>

          <div className="text-sm leading-relaxed whitespace-pre-line">
            {product.description}
          </div>

          <dl className="grid grid-cols-2 gap-y-2 text-xs uppercase tracking-widest border-t border-ink pt-4">
            {product.technique && (
              <>
                <dt className="opacity-60">Technik</dt>
                <dd>{product.technique}</dd>
              </>
            )}
            {product.width && product.height && (
              <>
                <dt className="opacity-60">Masse</dt>
                <dd>
                  {product.width} × {product.height} cm
                </dd>
              </>
            )}
            <dt className="opacity-60">Auflage</dt>
            <dd>Unikat</dd>
            <dt className="opacity-60">Status</dt>
            <dd className="font-bold">
              {product.status === 'available' && 'Verfügbar'}
              {product.status === 'reserved' && 'Reserviert'}
              {product.status === 'sold' && 'Verkauft'}
            </dd>
          </dl>

          <div className="flex items-baseline justify-between border-t border-ink pt-4">
            <span className="text-xs uppercase tracking-widest opacity-60">
              Preis
            </span>
            <span className="font-display font-black text-3xl">
              {formatCHF(product.priceRappen)}
            </span>
          </div>

          {product.status === 'available' ? (
            <BuyForm productId={product.id} />
          ) : (
            <div className="border border-ink p-4 text-sm">
              {product.status === 'sold'
                ? 'Dieses Werk ist verkauft. Schreib mir, wenn du Interesse an etwas Ähnlichem hast.'
                : 'Dieses Werk ist gerade reserviert. Schau später wieder rein.'}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
