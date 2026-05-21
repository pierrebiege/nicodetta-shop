import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrders({ searchParams }: Props) {
  if (!(await getCurrentAdmin())) redirect('/admin/login');
  const { status } = await searchParams;

  let query = db
    .select({ order: orders, product: products })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .orderBy(desc(orders.createdAt))
    .$dynamic();
  if (status) query = query.where(eq(orders.status, status as any));
  const rows = await query;

  const filters = ['pending', 'paid', 'shipped', 'cancelled'] as const;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display font-black uppercase text-4xl mb-6">
        Bestellungen
      </h1>
      <div className="flex gap-2 mb-8 text-xs uppercase tracking-widest">
        <Link
          href="/admin/orders"
          className={`px-3 py-2 border border-ink ${!status ? 'bg-ink text-paper' : ''}`}
        >
          Alle
        </Link>
        {filters.map((f) => (
          <Link
            key={f}
            href={`/admin/orders?status=${f}`}
            className={`px-3 py-2 border border-ink ${status === f ? 'bg-ink text-paper' : ''}`}
          >
            {label(f)}
          </Link>
        ))}
      </div>

      <div className="bg-paper border border-ink divide-y divide-ink">
        {rows.length === 0 && (
          <div className="p-6 text-sm opacity-60">Keine Bestellungen.</div>
        )}
        {rows.map(({ order, product }) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.id}`}
            className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted"
          >
            <div className="col-span-1 text-xs font-mono opacity-60">
              #{order.id}
            </div>
            <div className="col-span-4">
              <div className="font-bold">{order.buyerName}</div>
              <div className="text-xs opacity-60">{order.buyerEmail}</div>
            </div>
            <div className="col-span-3 text-sm">{product.title}</div>
            <div className="col-span-2 text-xs opacity-60">
              {new Date(order.createdAt).toLocaleDateString('de-CH')}
            </div>
            <div className="col-span-1 text-xs uppercase tracking-widest font-bold">
              {label(order.status)}
            </div>
            <div className="col-span-1 text-right font-bold">
              {formatCHF(order.totalRappen)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function label(s: string) {
  return (
    { pending: 'Wartet', paid: 'Bezahlt', shipped: 'Versendet', cancelled: 'Storno' }[s] ??
    s
  );
}
