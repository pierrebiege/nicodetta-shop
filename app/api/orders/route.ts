import { NextResponse } from 'next/server';
import { createOrder, sendOrderInvoice } from '@/lib/orders';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const required = [
      'productId',
      'buyerName',
      'buyerEmail',
      'buyerStreet',
      'buyerZip',
      'buyerCity',
    ];
    for (const k of required) {
      if (!body[k]) {
        return NextResponse.json({ error: `Feld fehlt: ${k}` }, { status: 400 });
      }
    }

    const { order } = await createOrder({
      productId: Number(body.productId),
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerStreet: body.buyerStreet,
      buyerZip: body.buyerZip,
      buyerCity: body.buyerCity,
      buyerCountry: body.buyerCountry || 'CH',
    });

    await sendOrderInvoice(order.id);

    return NextResponse.json({ id: order.id, reference: order.reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN';
    const map: Record<string, { status: number; msg: string }> = {
      PRODUCT_NOT_FOUND: { status: 404, msg: 'Werk nicht gefunden' },
      PRODUCT_NOT_AVAILABLE: {
        status: 409,
        msg: 'Werk nicht mehr verfügbar',
      },
    };
    const entry = map[message];
    if (entry) return NextResponse.json({ error: entry.msg }, { status: entry.status });
    console.error('[POST /api/orders]', err);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
