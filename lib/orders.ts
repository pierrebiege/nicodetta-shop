import { db } from '@/db';
import { orders, products } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateQRBillPdf, generateReference } from './qr-bill';
import { sendEmail } from './email';
import { formatCHF } from './format';

const RESERVATION_DAYS = 7;

export type CreateOrderInput = {
  productId: number;
  buyerName: string;
  buyerEmail: string;
  buyerStreet: string;
  buyerZip: string;
  buyerCity: string;
  buyerCountry?: string;
};

export async function createOrder(input: CreateOrderInput) {
  // Atomic claim: only flip status if currently available. If no row updated,
  // someone else got it first or it never was available.
  const [claimed] = await db
    .update(products)
    .set({ status: 'reserved' })
    .where(and(eq(products.id, input.productId), eq(products.status, 'available')))
    .returning();

  if (!claimed) {
    // Distinguish "not found" vs "not available"
    const [exists] = await db
      .select()
      .from(products)
      .where(eq(products.id, input.productId));
    if (!exists) throw new Error('PRODUCT_NOT_FOUND');
    throw new Error('PRODUCT_NOT_AVAILABLE');
  }

  const reservedUntil = new Date(Date.now() + RESERVATION_DAYS * 24 * 3600 * 1000);

  // Insert with placeholder reference, then update with mod10-correct one
  const [inserted] = await db
    .insert(orders)
    .values({
      reference: 'TMP',
      productId: claimed.id,
      status: 'pending',
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerStreet: input.buyerStreet,
      buyerZip: input.buyerZip,
      buyerCity: input.buyerCity,
      buyerCountry: input.buyerCountry ?? 'CH',
      totalRappen: claimed.priceRappen,
      reservedUntil,
    })
    .returning();

  const reference = generateReference(inserted.id);
  const [order] = await db
    .update(orders)
    .set({ reference })
    .where(eq(orders.id, inserted.id))
    .returning();

  return { order, product: claimed };
}

export async function sendOrderInvoice(orderId: number) {
  const [row] = await db
    .select({ order: orders, product: products })
    .from(orders)
    .innerJoin(products, eq(orders.productId, products.id))
    .where(eq(orders.id, orderId));
  if (!row) throw new Error('ORDER_NOT_FOUND');

  const { order, product } = row;
  const pdf = await generateQRBillPdf({
    amountRappen: order.totalRappen,
    reference: order.reference,
    buyerName: order.buyerName,
    buyerStreet: order.buyerStreet,
    buyerZip: order.buyerZip,
    buyerCity: order.buyerCity,
    buyerCountry: order.buyerCountry,
    productTitle: product.title,
  });

  await sendEmail({
    to: order.buyerEmail,
    subject: `Deine Bestellung bei Nicodetta — ${product.title}`,
    text: [
      `Hallo ${order.buyerName.split(' ')[0]},`,
      ``,
      `vielen Dank für deine Bestellung von «${product.title}».`,
      ``,
      `Betrag: ${formatCHF(order.totalRappen)}`,
      `Referenz: ${order.reference}`,
      `Zahlbar bis: ${order.reservedUntil.toLocaleDateString('de-CH')}`,
      ``,
      `Im Anhang findest du die QR-Rechnung. Du kannst sie mit deiner Banking-App scannen.`,
      `Sobald die Zahlung eingegangen ist, schicke ich dir eine Bestätigung und versende das Werk.`,
      ``,
      `Mit Gruss`,
      `Nicodetta`,
    ].join('\n'),
    attachments: [
      { filename: `rechnung-${order.reference}.pdf`, content: pdf },
    ],
  });

  return order;
}

export async function markPaid(orderId: number) {
  const [order] = await db
    .update(orders)
    .set({ status: 'paid', paidAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) throw new Error('ORDER_NOT_FOUND');

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, order.productId));

  await sendEmail({
    to: order.buyerEmail,
    subject: `Zahlung erhalten — ${product?.title ?? 'deine Bestellung'}`,
    text: [
      `Hallo ${order.buyerName.split(' ')[0]},`,
      ``,
      `deine Zahlung ist eingegangen. Ich packe das Werk und versende es in den nächsten Tagen.`,
      `Sobald es unterwegs ist, bekommst du eine weitere E-Mail.`,
      ``,
      `Mit Gruss`,
      `Nicodetta`,
    ].join('\n'),
  });
  return order;
}

export async function markShipped(orderId: number, trackingCode?: string) {
  const [order] = await db
    .update(orders)
    .set({ status: 'shipped', shippedAt: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) throw new Error('ORDER_NOT_FOUND');

  await db
    .update(products)
    .set({ status: 'sold' })
    .where(eq(products.id, order.productId));

  await sendEmail({
    to: order.buyerEmail,
    subject: `Dein Werk ist unterwegs`,
    text: [
      `Hallo ${order.buyerName.split(' ')[0]},`,
      ``,
      `dein Werk ist unterwegs zu dir.`,
      trackingCode ? `Sendungsnummer: ${trackingCode}` : '',
      ``,
      `Vielen Dank!`,
      `Nicodetta`,
    ]
      .filter(Boolean)
      .join('\n'),
  });
  return order;
}

export async function cancelOrder(orderId: number) {
  const [order] = await db
    .update(orders)
    .set({ status: 'cancelled' })
    .where(eq(orders.id, orderId))
    .returning();
  if (!order) throw new Error('ORDER_NOT_FOUND');

  await db
    .update(products)
    .set({ status: 'available' })
    .where(eq(products.id, order.productId));
  return order;
}

export function buildShippingLabel(order: {
  buyerName: string;
  buyerStreet: string;
  buyerZip: string;
  buyerCity: string;
  buyerCountry: string;
  reference: string;
}): string {
  return [
    `Versandetikette`,
    `Referenz: ${order.reference}`,
    ``,
    `Empfänger:`,
    order.buyerName,
    order.buyerStreet,
    `${order.buyerZip} ${order.buyerCity}`,
    order.buyerCountry,
    ``,
    `Absender: Nicodetta — biege.pierre@gmail.com`,
  ].join('\n');
}
