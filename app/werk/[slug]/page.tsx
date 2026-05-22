import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';
import { BuyForm } from '@/components/BuyForm';
import { findDemoProductBySlug } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function WorkDetail({ params }: Props) {
  const { slug } = await params;

  let product = null;
  try {
    const [row] = await db.select().from(products).where(eq(products.slug, slug));
    product = row ?? null;
  } catch {
    product = null;
  }
  if (!product) product = findDemoProductBySlug(slug);
  if (!product) notFound();

  const back = product.type === 'clothing' ? '/wardrobe' : '/museum';
  const backLabel = product.type === 'clothing' ? 'Wardrobe' : 'Gallery';

  return (
    <main className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
        <Link href="/" className="font-serif text-xl">Nicodetta</Link>
        <Link href={back} className="text-xs uppercase tracking-widest font-medium">
          ← {backLabel}
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
          <h1 className="font-serif text-4xl md:text-5xl leading-[0.95]">
            {product.title}
          </h1>

          <div className="text-sm leading-relaxed whitespace-pre-line opacity-90">
            {product.description}
          </div>

          <div className="flex items-baseline justify-between border-t border-ink pt-4">
            <span className="text-xs uppercase tracking-widest opacity-60">Price</span>
            <span className="font-serif text-3xl">{formatCHF(product.priceRappen)}</span>
          </div>

          {product.status === 'available' ? (
            <BuyForm productId={product.id} />
          ) : (
            <div className="border border-ink p-4 text-sm">
              {product.status === 'sold'
                ? 'This piece is sold.'
                : 'This piece is currently reserved.'}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
