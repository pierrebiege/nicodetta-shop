import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import PDFDocument from 'pdfkit';
import { Writable } from 'node:stream';

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

  const chunks: Buffer[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.from(chunk));
      cb();
    },
  });
  const doc = new PDFDocument({ size: 'A6', margin: 20 });
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(8).text('NICODETTA', { align: 'left' });
  doc.font('Helvetica').fontSize(7).text('Musterstrasse 1 · 8001 Zürich');
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(10).text('AN:');
  doc.font('Helvetica').fontSize(13);
  doc.text(row.order.buyerName);
  doc.text(row.order.buyerStreet);
  doc.text(`${row.order.buyerZip} ${row.order.buyerCity}`);
  doc.text(row.order.buyerCountry);

  doc.moveDown(2);
  doc.font('Helvetica').fontSize(7).text(`Ref ${row.order.reference}`, { align: 'right' });
  doc.text(`${row.product.title}`, { align: 'right' });

  doc.end();
  await new Promise<void>((r) => stream.on('finish', () => r()));
  const pdf = Buffer.concat(chunks);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="versand-${row.order.reference}.pdf"`,
    },
  });
}
