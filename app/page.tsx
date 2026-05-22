import Link from 'next/link';
import { db } from '@/db';
import { products } from '@/db/schema';
import { asc } from 'drizzle-orm';
import { Gallery } from '@/components/Gallery';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allProducts = await db.select().from(products).orderBy(asc(products.id));
  const paintings = allProducts.filter((p) => p.type === 'painting');
  const clothing = allProducts.filter((p) => p.type === 'clothing');

  return (
    <main>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
        <Link href="/" className="font-display font-black text-xl uppercase">
          Nicodetta
        </Link>
        <nav className="flex gap-6 text-xs uppercase tracking-widest font-medium">
          <Link href="/museum">3D-Saal</Link>
          <a href="#bilder">Bilder</a>
          <a href="#kleidung">Kleidung</a>
          <Link href="/about">Über</Link>
        </nav>
      </header>

      {/* Hero — entrance to the museum */}
      <section className="min-h-screen flex flex-col justify-end px-6 md:px-10 pb-10 pt-32 border-b border-ink">
        <p className="text-xs uppercase tracking-widest opacity-60 mb-4">
          Ausstellung · Permanent · {new Date().getFullYear()}
        </p>
        <h1 className="font-display font-black uppercase leading-[0.85] text-[clamp(4rem,18vw,16rem)]">
          Nicodetta
        </h1>
        <div className="grid grid-cols-12 mt-10 text-sm">
          <p className="col-span-12 md:col-span-6 md:col-start-7 max-w-md text-base">
            Eine begehbare Sammlung. Bilder und verkünstlerte Kleidung — jedes
            Stück ein Unikat. Scroll durch die Räume, finde was bleibt.
          </p>
        </div>
        <div className="mt-16 flex items-center justify-between gap-4 text-xs uppercase tracking-widest">
          <div className="flex items-center gap-4 opacity-60">
            <span>↓</span>
            <span>Eintritt scrollen</span>
          </div>
          <Link
            href="/museum"
            className="border border-ink px-4 py-3 hover:bg-ink hover:text-paper transition-colors font-bold"
          >
            3D-Saal betreten →
          </Link>
        </div>
      </section>

      <Gallery
        items={paintings}
        sectionId="bilder"
        sectionLabel="Saal 01"
        sectionTitle="Bilder"
        sectionLead="Acryl, Öl, Mischtechnik auf Leinwand und Papier. Auflage: jeweils 1. Wenn weg, dann weg."
      />

      <Gallery
        items={clothing}
        sectionId="kleidung"
        sectionLabel="Saal 02"
        sectionTitle="Kleidung"
        sectionLead="Verkünstlerte Einzelstücke — handbemalt, getragen, signiert."
      />

      <footer className="px-6 md:px-10 py-10 text-xs uppercase tracking-widest flex flex-col md:flex-row justify-between gap-4 bg-paper">
        <div>© {new Date().getFullYear()} Nicodetta</div>
        <div className="flex gap-6">
          <a href="mailto:nicodetta@example.ch">Kontakt</a>
          <Link href="/about">Über</Link>
          <Link href="/admin">Admin</Link>
        </div>
      </footer>
    </main>
  );
}
