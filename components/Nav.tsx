import Link from 'next/link';

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-5 mix-blend-difference text-white">
      <Link
        href="/"
        className="font-black tracking-tightest text-xl uppercase"
        style={{ letterSpacing: '-0.04em' }}
      >
        Nicodetta
      </Link>
      <div className="flex gap-6 text-xs uppercase tracking-widest">
        <Link href="/#bilder">Bilder</Link>
        <Link href="/#kleidung">Kleidung</Link>
        <Link href="/about">Über</Link>
      </div>
    </nav>
  );
}
