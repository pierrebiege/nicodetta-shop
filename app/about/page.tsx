import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen px-6 md:px-10 py-24">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
        <Link href="/" className="font-display font-black text-xl uppercase">
          Nicodetta
        </Link>
        <Link href="/" className="text-xs uppercase tracking-widest font-medium">
          ← Zurück
        </Link>
      </header>

      <div className="grid grid-cols-12 max-w-6xl mx-auto pt-16">
        <div className="col-span-12 md:col-span-8">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-4">Über</p>
          <h1 className="font-display font-black uppercase text-6xl md:text-8xl leading-[0.85] mb-12">
            Nicodetta.
          </h1>
          <div className="text-base leading-relaxed max-w-2xl space-y-4">
            <p>
              Bilder. Kleidung. Alles Unikate, alles von Hand. Keine Auflagen,
              keine Wiederholungen.
            </p>
            <p>
              Jedes Werk entsteht aus dem, was gerade da ist — Farbe, Stoff,
              Moment. Wenn es weg ist, ist es weg.
            </p>
            <p>
              Bei Fragen oder Wünschen: schreib mir direkt.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
