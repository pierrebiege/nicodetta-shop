'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';

gsap.registerPlugin(ScrollTrigger);

type Layout = {
  col: number;
  row: number;
  span: number;
  rowSpan: number;
  offsetY: number; // additional translateY for parallax-ish feel
};

// Asymmetric Swiss-style pinboard layout — 12 col grid, varied sizes/positions.
const LAYOUTS: Layout[] = [
  { col: 1, row: 1, span: 4, rowSpan: 5, offsetY: 0 },
  { col: 7, row: 1, span: 5, rowSpan: 4, offsetY: 80 },
  { col: 1, row: 6, span: 3, rowSpan: 4, offsetY: 60 },
  { col: 5, row: 5, span: 4, rowSpan: 4, offsetY: -40 },
  { col: 9, row: 5, span: 4, rowSpan: 5, offsetY: 100 },
  { col: 1, row: 10, span: 5, rowSpan: 5, offsetY: 20 },
  { col: 6, row: 9, span: 3, rowSpan: 4, offsetY: 140 },
  { col: 9, row: 10, span: 4, rowSpan: 3, offsetY: 0 },
  { col: 2, row: 15, span: 4, rowSpan: 4, offsetY: 60 },
  { col: 7, row: 13, span: 5, rowSpan: 5, offsetY: -20 },
  { col: 1, row: 19, span: 4, rowSpan: 5, offsetY: 80 },
  { col: 6, row: 18, span: 6, rowSpan: 5, offsetY: 40 },
];

export function Pinboard({ items }: { items: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.pin-card').forEach((el, i) => {
        const layout = LAYOUTS[i % LAYOUTS.length];
        gsap.fromTo(
          el,
          { y: layout.offsetY + 60, opacity: 0 },
          {
            y: layout.offsetY,
            opacity: 1,
            duration: 1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              end: 'bottom 20%',
              scrub: 0.5,
            },
          },
        );
      });
    }, ref);
    return () => ctx.revert();
  }, [items.length]);

  return (
    <div ref={ref} className="relative">
      <div
        className="grid grid-cols-12 gap-4 md:gap-6"
        style={{ gridAutoRows: '4vw' }}
      >
        {items.map((p, i) => {
          const layout = LAYOUTS[i % LAYOUTS.length];
          return (
            <Link
              key={p.id}
              href={`/werk/${p.slug}`}
              className="pin-card group block"
              style={{
                gridColumn: `${layout.col} / span ${layout.span}`,
                gridRow: `${layout.row} / span ${layout.rowSpan}`,
                opacity: 0,
              }}
            >
              <div className="relative w-full h-full overflow-hidden bg-muted">
                <Image
                  src={p.imagePath}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {p.status === 'sold' && (
                  <div className="absolute top-3 left-3 bg-ink text-paper px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
                    Verkauft
                  </div>
                )}
                {p.status === 'reserved' && (
                  <div className="absolute top-3 left-3 bg-paper text-ink px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
                    Reserviert
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs">
                <div className="font-display font-bold uppercase tracking-tight truncate pr-2">
                  {p.title}
                </div>
                <div className="font-mono whitespace-nowrap">
                  {formatCHF(p.priceRappen)}
                </div>
              </div>
              <div className="text-[10px] uppercase tracking-widest opacity-50 mt-0.5">
                {p.year ?? ''} {p.technique ? `· ${p.technique}` : ''}
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
