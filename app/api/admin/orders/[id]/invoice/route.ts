import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateQRBillPdf } from '@/lib/qr-bill';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const { id } = await params;
  const [row] = await db
    .select({ order: orders, product: products })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, Number(id)));
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const pdf = await generateQRBillPdf({
    amountRappen: row.order.totalRappen,
    reference: row.order.reference,
    buyerName: row.order.buyerName,
    buyerStreet: row.order.buyerStreet,
    buyerZip: row.order.buyerZip,
    buyerCity: row.order.buyerCity,
    buyerCountry: row.order.buyerCountry,
    productTitle: row.product.title,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="rechnung-${row.order.reference}.pdf"`,
    },
  });
}
