import Link from 'next/link';

type Props = { searchParams: Promise<{ ref?: string }> };

export default async function ThankYou({ searchParams }: Props) {
  const { ref } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-4">
          Bestellung eingegangen
        </p>
        <h1 className="font-display font-black uppercase text-5xl md:text-6xl leading-none mb-8">
          Danke.
        </h1>
        <div className="border-t border-ink pt-6 text-sm space-y-4">
          <p>
            Du erhältst gleich eine E-Mail mit der QR-Rechnung. Scan sie mit
            deiner Banking-App und überweise den Betrag.
          </p>
          {ref && (
            <p>
              <span className="opacity-60 uppercase text-[10px] tracking-widest block">
                Referenz
              </span>
              <span className="font-mono">{ref}</span>
            </p>
          )}
          <p>
            Sobald die Zahlung eingegangen ist, packe ich das Werk und schicke
            dir die Versandbestätigung.
          </p>
          <Link
            href="/"
            className="inline-block mt-6 text-xs uppercase tracking-widest underline"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
      </div>
    </main>
  );
}
