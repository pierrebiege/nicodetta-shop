import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';

export default function Home() {
  return (
    <main className="bg-paper text-ink">
      {/* PAINTINGS */}
      <Link
        href="/museum"
        className="group relative block h-screen overflow-hidden bg-paper border-b border-ink"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/works/tpl-painting-1.png"
            alt=""
            width={500}
            height={650}
            priority
            className="absolute left-[8%] md:left-[18%] top-[35%] h-[40vh] md:h-[55vh] w-auto -rotate-[3deg] object-contain drop-shadow-2xl"
          />
          <Image
            src="/works/tpl-painting-3.png"
            alt=""
            width={500}
            height={650}
            priority
            className="absolute top-[40%] h-[42vh] md:h-[60vh] w-auto rotate-[1deg] object-contain drop-shadow-2xl"
          />
          <Image
            src="/works/tpl-painting-2.png"
            alt=""
            width={500}
            height={650}
            priority
            className="absolute right-[8%] md:right-[18%] top-[34%] h-[38vh] md:h-[55vh] w-auto rotate-[4deg] object-contain drop-shadow-2xl"
          />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <h2
            className="font-serif font-medium text-ink leading-[0.85] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(5rem, 17vw, 17rem)' }}
          >
            Paintings
          </h2>
          <div className="mt-8 text-xs uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
            Enter the gallery →
          </div>
        </div>
      </Link>

      {/* CLOTHES */}
      <Link
        href="/wardrobe"
        className="group relative block h-screen overflow-hidden bg-paper border-b border-ink"
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
            className="absolute left-[15%] md:left-[24%] top-[30%] h-[42vh] md:h-[55vh] w-auto -rotate-[5deg] opacity-80 object-contain drop-shadow-2xl"
          />
          <Image
            src="/works/tpl-clothing-1.png"
            alt=""
            width={500}
            height={650}
            className="absolute right-[15%] md:right-[24%] top-[32%] h-[40vh] md:h-[52vh] w-auto rotate-[6deg] opacity-80 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <h2
            className="font-serif font-medium text-ink leading-[0.85] tracking-[-0.04em]"
            style={{ fontSize: 'clamp(5rem, 17vw, 17rem)' }}
          >
            Clothes
          </h2>
          <div className="mt-8 text-xs uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">
            Enter the wardrobe →
          </div>
        </div>
      </Link>

      <footer className="px-6 md:px-10 py-10 text-[10px] uppercase tracking-[0.3em] flex flex-col md:flex-row justify-between gap-4">
        <div className="font-serif text-sm normal-case tracking-tight">Nicodetta</div>
        <div className="flex gap-6">
          <Link href="/about">About</Link>
          <a href="mailto:nicodetta@example.ch">Contact</a>
          <Link href="/admin">Admin</Link>
        </div>
      </footer>
    </main>
  );
}
