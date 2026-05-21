import { redirect, notFound } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatCHF } from '@/lib/format';
import { OrderActions } from '@/components/OrderActions';

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrder({ params }: Props) {
  if (!(await getCurrentAdmin())) redirect('/admin/login');
  const { id } = await params;
  const [row] = await db
    .select({ order: orders, product: products })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, Number(id)));
  if (!row) notFound();
  const { order, product } = row;

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-xs uppercase tracking-widest opacity-60">
        Bestellung #{order.id}
      </p>
      <h1 className="font-display font-black uppercase text-5xl mt-2 mb-8">
        {product.title}
      </h1>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-7 bg-paper border border-ink p-6 space-y-6">
          <Section title="Status">
            <div className="font-bold uppercase tracking-widest">
              {label(order.status)}
            </div>
            <div className="text-xs opacity-60 mt-1">
              Erstellt: {new Date(order.createdAt).toLocaleString('de-CH')}
            </div>
            {order.paidAt && (
              <div className="text-xs opacity-60">
                Bezahlt: {new Date(order.paidAt).toLocaleString('de-CH')}
              </div>
            )}
            {order.shippedAt && (
              <div className="text-xs opacity-60">
                Versendet: {new Date(order.shippedAt).toLocaleString('de-CH')}
              </div>
            )}
          </Section>

          <Section title="Käufer">
            <div className="text-sm leading-relaxed">
              {order.buyerName}<br />
              {order.buyerStreet}<br />
              {order.buyerZip} {order.buyerCity}<br />
              {order.buyerCountry}<br />
              <a href={`mailto:${order.buyerEmail}`} className="underline">
                {order.buyerEmail}
              </a>
            </div>
          </Section>

          <Section title="Zahlung">
            <div className="text-sm">
              <div>
                <span className="opacity-60 uppercase text-[10px] tracking-widest">
                  Referenz
                </span>
                <div className="font-mono">{order.reference}</div>
              </div>
              <div className="mt-2 text-xl font-bold">
                {formatCHF(order.totalRappen)}
              </div>
              <div className="text-xs opacity-60 mt-1">
                Reservation gültig bis{' '}
                {new Date(order.reservedUntil).toLocaleString('de-CH')}
              </div>
            </div>
          </Section>
        </div>

        <div className="col-span-12 md:col-span-5">
          <OrderActions orderId={order.id} status={order.status} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function label(s: string) {
  return (
    { pending: 'Wartet auf Zahlung', paid: 'Bezahlt', shipped: 'Versendet', cancelled: 'Storniert' }[
      s
    ] ?? s
  );
}
