import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';

export default async function AdminProducts() {
  if (!(await getCurrentAdmin())) redirect('/admin/login');

  const all = await db.select().from(products).orderBy(desc(products.id));
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display font-black uppercase text-4xl">Werke</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink text-paper px-5 py-3 text-xs uppercase tracking-widest font-bold"
        >
          + Neues Werk
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {all.map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}`}
            className="bg-paper border border-ink group"
          >
            <div className="relative aspect-[4/5] bg-muted">
              <Image
                src={p.imagePath}
                alt={p.title}
                fill
                sizes="200px"
                className="object-cover"
              />
              {p.status !== 'available' && (
                <div className="absolute top-2 left-2 bg-ink text-paper px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
                  {p.status === 'sold' ? 'Verkauft' : 'Reserviert'}
                </div>
              )}
            </div>
            <div className="p-3 text-xs">
              <div className="font-bold uppercase tracking-tight truncate">
                {p.title}
              </div>
              <div className="flex justify-between mt-1">
                <span className="opacity-60 uppercase">{p.type}</span>
                <span className="font-mono">{formatCHF(p.priceRappen)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
