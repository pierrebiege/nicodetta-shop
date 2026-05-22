import Link from 'next/link';

export default function About() {
  return (
    <main className="min-h-screen px-6 md:px-10 py-24">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
        <Link href="/" className="font-serif text-xl">
          Nicodetta
        </Link>
        <Link href="/" className="text-xs uppercase tracking-widest font-medium">
          ← Back
        </Link>
      </header>

      <div className="grid grid-cols-12 max-w-6xl mx-auto pt-16">
        <div className="col-span-12 md:col-span-8">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-4">About</p>
          <h1 className="font-serif text-6xl md:text-8xl leading-[0.85] mb-12">
            Nicodetta.
          </h1>
          <div className="text-base leading-relaxed max-w-2xl space-y-4">
            <p>
              Paintings. Clothes. Every piece one of one, every piece by hand.
              No editions, no repeats.
            </p>
            <p>
              Each work comes from what's around — paint, fabric, moment.
              When it's gone, it's gone.
            </p>
            <p>For questions or commissions, write directly.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
