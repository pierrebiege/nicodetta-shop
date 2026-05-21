import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq, count, desc } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';

export default async function AdminDashboard() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const [pending] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, 'pending'));
  const [paid] = await db
    .select({ n: count() })
    .from(orders)
    .where(eq(orders.status, 'paid'));
  const [available] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.status, 'available'));

  const recent = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div>
        <p className="text-xs uppercase tracking-widest opacity-60">Hallo</p>
        <h1 className="font-display font-black text-5xl uppercase mt-2">
          Hi, {admin.username}.
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Offen (warten auf Zahlung)" value={pending.n} href="/admin/orders?status=pending" />
        <Card label="Bezahlt (zu versenden)" value={paid.n} href="/admin/orders?status=paid" />
        <Card label="Verfügbare Werke" value={available.n} href="/admin/products" />
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-widest opacity-60 mb-3">
          Letzte Bestellungen
        </h2>
        <div className="bg-paper border border-ink divide-y divide-ink">
          {recent.length === 0 && (
            <div className="p-4 text-sm opacity-60">Noch keine Bestellungen.</div>
          )}
          {recent.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted"
            >
              <div>
                <div className="font-bold">{o.buyerName}</div>
                <div className="text-xs opacity-60 font-mono">{o.reference}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{formatCHF(o.totalRappen)}</div>
                <div className="text-xs uppercase tracking-widest">{statusLabel(o.status)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="block bg-paper border border-ink p-6 hover:bg-ink hover:text-paper transition-colors"
    >
      <div className="text-xs uppercase tracking-widest opacity-60">{label}</div>
      <div className="font-display font-black text-6xl mt-2">{value}</div>
    </Link>
  );
}

function statusLabel(status: string) {
  return {
    pending: 'Wartet',
    paid: 'Bezahlt',
    shipped: 'Versendet',
    cancelled: 'Storniert',
  }[status] ?? status;
}
