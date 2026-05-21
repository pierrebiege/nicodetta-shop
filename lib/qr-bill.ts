import { SwissQRBill, Table } from 'swissqrbill/pdf';
import { Writable } from 'node:stream';

export type QRBillData = {
  amountRappen: number;
  reference: string;
  buyerName: string;
  buyerStreet: string;
  buyerZip: string;
  buyerCity: string;
  buyerCountry?: string;
  productTitle: string;
  message?: string;
};

const CREDITOR = {
  name: process.env.CREDITOR_NAME ?? 'Nicodetta',
  address: process.env.CREDITOR_ADDRESS ?? 'Musterstrasse 1',
  zip: process.env.CREDITOR_ZIP ?? '8001',
  city: process.env.CREDITOR_CITY ?? 'Zürich',
  account: process.env.CREDITOR_IBAN ?? 'CH4431999123000889012',
  country: 'CH' as const,
};

export async function generateQRBillPdf(data: QRBillData): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      chunks.push(Buffer.from(chunk));
      cb();
    },
  });

  const PDFDocumentMod = await import('pdfkit');
  const PDFDocument = PDFDocumentMod.default;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  doc.font('Helvetica-Bold').fontSize(20).text('Rechnung', 50, 50);
  doc.font('Helvetica').fontSize(10).text(`Referenz: ${data.reference}`, 50, 80);
  doc.text(`Datum: ${new Date().toLocaleDateString('de-CH')}`, 50, 95);

  doc.moveDown();
  doc.fontSize(11).font('Helvetica-Bold').text('Rechnungsempfänger', 50, 130);
  doc.font('Helvetica').text(data.buyerName);
  doc.text(data.buyerStreet);
  doc.text(`${data.buyerZip} ${data.buyerCity}`);
  doc.text(data.buyerCountry ?? 'CH');

  doc.moveDown();
  doc.font('Helvetica-Bold').fontSize(12).text('Positionen', 50, 230);

  const table = new Table({
    rows: [
      {
        height: 24,
        backgroundColor: '#0A0A0A',
        fontName: 'Helvetica-Bold',
        columns: [
          { text: 'Werk', width: 320 },
          { text: 'Betrag', width: 175 },
        ],
      },
      {
        height: 28,
        fontName: 'Helvetica',
        columns: [
          { text: data.productTitle, width: 320 },
          { text: `CHF ${(data.amountRappen / 100).toFixed(2)}`, width: 175 },
        ],
      },
      {
        height: 28,
        fontName: 'Helvetica-Bold',
        columns: [
          { text: 'Total', width: 320 },
          {
            text: `CHF ${(data.amountRappen / 100).toFixed(2)}`,
            width: 175,
          },
        ],
      },
    ],
  });
  table.attachTo(doc);

  const qrBill = new SwissQRBill({
    currency: 'CHF',
    amount: data.amountRappen / 100,
    reference: data.reference,
    creditor: CREDITOR,
    debtor: {
      name: data.buyerName,
      address: data.buyerStreet,
      zip: data.buyerZip,
      city: data.buyerCity,
      country: (data.buyerCountry ?? 'CH') as 'CH',
    },
    message: data.message ?? `Bestellung ${data.reference}`,
  });
  qrBill.attachTo(doc);

  doc.end();

  await new Promise<void>((resolve) => stream.on('finish', () => resolve()));
  return Buffer.concat(chunks);
}

export function generateReference(orderId: number): string {
  // Swiss QR-IBAN reference: 27 digits, last is mod10 check digit.
  const base = String(orderId).padStart(26, '0');
  return base + mod10CheckDigit(base);
}

function mod10CheckDigit(input: string): string {
  const table = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5];
  let carry = 0;
  for (const ch of input) {
    const digit = Number(ch);
    if (Number.isNaN(digit)) continue;
    carry = table[(carry + digit) % 10];
  }
  return String((10 - carry) % 10);
}
