import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';

export default function Home() {
  return (
    <main className="bg-paper text-ink h-screen overflow-hidden">
      <div className="grid grid-rows-2 md:grid-rows-1 md:grid-cols-2 h-full">
        {/* PAINTINGS — left half */}
        <Link
          href="/museum"
          className="group relative block h-full overflow-hidden bg-paper border-b md:border-b-0 md:border-r border-ink"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image
              src="/works/tpl-painting-1.png"
              alt=""
              width={500}
              height={650}
              priority
              className="absolute left-[8%] top-[28%] h-[40vh] md:h-[55vh] w-auto -rotate-[3deg] object-contain drop-shadow-2xl"
            />
            <Image
              src="/works/tpl-painting-3.png"
              alt=""
              width={500}
              height={650}
              priority
              className="absolute top-[32%] h-[44vh] md:h-[60vh] w-auto rotate-[1deg] object-contain drop-shadow-2xl"
            />
            <Image
              src="/works/tpl-painting-2.png"
              alt=""
              width={500}
              height={650}
              priority
              className="absolute right-[8%] top-[26%] h-[40vh] md:h-[55vh] w-auto rotate-[4deg] object-contain drop-shadow-2xl"
            />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
            <h2
              className="font-serif font-medium text-ink leading-[0.85] tracking-[-0.04em] text-center"
              style={{ fontSize: 'clamp(2.5rem, 9vw, 9rem)' }}
            >
              Paintings
            </h2>
            <div className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity">
              Enter the gallery →
            </div>
          </div>
        </Link>

        {/* CLOTHES — right half */}
        <Link
          href="/wardrobe"
          className="group relative block h-full overflow-hidden bg-paper"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Image
              src="/works/tpl-clothing-1.png"
              alt=""
              width={500}
              height={650}
              priority
              className="absolute h-[55vh] md:h-[70vh] w-auto object-contain drop-shadow-2xl"
            />
            <Image
              src="/works/tpl-clothing-1.png"
              alt=""
              width={500}
              height={650}
              className="absolute left-[10%] top-[26%] h-[42vh] md:h-[55vh] w-auto -rotate-[5deg] opacity-80 object-contain drop-shadow-2xl"
            />
            <Image
              src="/works/tpl-clothing-1.png"
              alt=""
              width={500}
              height={650}
              className="absolute right-[10%] top-[28%] h-[40vh] md:h-[52vh] w-auto rotate-[6deg] opacity-80 object-contain drop-shadow-2xl"
            />
          </div>

          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
            <h2
              className="font-serif font-medium text-ink leading-[0.85] tracking-[-0.04em] text-center"
              style={{ fontSize: 'clamp(2.5rem, 9vw, 9rem)' }}
            >
              Clothes
            </h2>
            <div className="mt-6 text-[10px] md:text-xs uppercase tracking-[0.3em] opacity-50 group-hover:opacity-100 transition-opacity">
              Enter the wardrobe →
            </div>
          </div>
        </Link>
      </div>

      {/* Top branding */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 font-serif text-2xl text-ink mix-blend-difference pointer-events-none">
        Nicodetta
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-6 right-6 z-50 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-ink/60 pointer-events-none">
        <div className="pointer-events-auto">© {new Date().getFullYear()}</div>
        <div className="flex gap-5 pointer-events-auto">
          <Link href="/about">About</Link>
          <a href="mailto:nicodetta@example.ch">Contact</a>
          <Link href="/admin">Admin</Link>
        </div>
      </div>
    </main>
  );
}
