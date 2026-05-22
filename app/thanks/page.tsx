import Link from 'next/link';

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function Thanks({ searchParams }: Props) {
  const { ref } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-4">Order received</p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] mb-8">Thank you.</h1>
        <div className="border-t border-ink pt-6 text-sm space-y-4">
          <p>
            You'll receive an email shortly with the Swiss QR-invoice. Scan it
            with your banking app to pay.
          </p>
          {ref && (
            <p>
              <span className="opacity-60 uppercase text-[10px] tracking-widest block">
                Reference
              </span>
              <span className="font-mono">{ref}</span>
            </p>
          )}
          <p>Once payment arrives, the piece is packed and you'll get a shipping confirmation.</p>
          <Link href="/" className="inline-block mt-6 text-xs uppercase tracking-widest underline">
            ← Back to the entrance
          </Link>
        </div>
      </div>
    </main>
  );
}
