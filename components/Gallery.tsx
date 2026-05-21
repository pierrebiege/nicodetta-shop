'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';

gsap.registerPlugin(ScrollTrigger);

export function Gallery({
  items,
  sectionId,
  sectionLabel,
  sectionTitle,
  sectionLead,
}: {
  items: Product[];
  sectionId: string;
  sectionLabel: string;
  sectionTitle: string;
  sectionLead: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const mm = gsap.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const ctx = gsap.context(() => {
        const distance = () => track.scrollWidth - window.innerWidth;

        const scrollTween = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: container,
            pin: true,
            scrub: 1,
            end: () => `+=${distance()}`,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // Subtle scale/opacity reveal per card as it enters viewport horizontally.
        gsap.utils.toArray<HTMLElement>('.gallery-card').forEach((card) => {
          gsap.fromTo(
            card.querySelector('.gallery-art'),
            { scale: 0.92, opacity: 0.4 },
            {
              scale: 1,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: scrollTween,
                start: 'left right',
                end: 'center center',
                scrub: 0.5,
              },
            },
          );
          gsap.fromTo(
            card.querySelector('.gallery-meta'),
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: card,
                containerAnimation: scrollTween,
                start: 'left 80%',
                end: 'center center',
                scrub: 0.5,
              },
            },
          );
        });
      }, container);

      return () => ctx.revert();
    });

    return () => mm.revert();
  }, [items.length]);

  return (
    <section
      id={sectionId}
      ref={containerRef}
      className="relative bg-paper md:h-screen md:overflow-hidden border-b border-ink"
    >
      {/* Desktop: horizontal scroll-tied gallery */}
      <div className="hidden md:flex h-screen items-stretch">
        <div
          ref={trackRef}
          className="flex h-full items-stretch will-change-transform"
          style={{ width: 'max-content' }}
        >
          {/* Intro panel = first room */}
          <div className="h-screen w-screen flex flex-col justify-end px-10 pb-16 pt-32 shrink-0">
            <p className="text-xs uppercase tracking-widest opacity-60 mb-3">
              {sectionLabel}
            </p>
            <h2 className="font-display font-black uppercase leading-[0.85] text-[clamp(5rem,12vw,11rem)]">
              {sectionTitle}
            </h2>
            <p className="mt-8 max-w-md text-sm leading-relaxed">{sectionLead}</p>
            <div className="mt-12 text-xs uppercase tracking-widest opacity-60">
              → {items.length} Werke
            </div>
          </div>

          {items.map((p, i) => (
            <GalleryCard key={p.id} product={p} index={i} />
          ))}

          {/* End / exit panel */}
          <div className="h-screen w-[40vw] flex flex-col justify-center px-10 shrink-0 border-l border-ink/10">
            <p className="text-xs uppercase tracking-widest opacity-60">
              Ende {sectionTitle}
            </p>
            <p className="mt-3 text-sm max-w-sm">
              Weiter scrollen für die nächste Ausstellung.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: clean vertical column */}
      <div className="md:hidden px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
            {sectionLabel}
          </p>
          <h2 className="font-display font-black uppercase text-6xl leading-[0.85]">
            {sectionTitle}
          </h2>
          <p className="mt-4 text-sm max-w-md">{sectionLead}</p>
        </div>
        <div className="flex flex-col gap-16">
          {items.map((p) => (
            <MobileCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function GalleryCard({ product, index }: { product: Product; index: number }) {
  // Varied widths per index — like a real exhibition: some works wide, some intimate.
  const widthClasses = [
    'w-[55vw]',
    'w-[42vw]',
    'w-[60vw]',
    'w-[38vw]',
    'w-[50vw]',
  ];
  const widthClass = widthClasses[index % widthClasses.length];

  return (
    <Link
      href={`/werk/${product.slug}`}
      className={`gallery-card group relative h-screen ${widthClass} shrink-0 flex flex-col justify-center px-10 border-l border-ink/10`}
    >
      {/* Room number */}
      <div className="absolute top-10 left-10 text-[10px] uppercase tracking-widest opacity-40 font-mono">
        {String(index + 1).padStart(2, '0')} / {/* total filled by section */}
      </div>

      <div className="gallery-art relative flex-1 max-h-[70vh] w-full">
        <Image
          src={product.imagePath}
          alt={product.title}
          fill
          sizes="60vw"
          className="object-contain"
          priority={index < 3}
        />
        {product.status === 'sold' && (
          <div className="absolute top-3 left-3 bg-ink text-paper px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
            Verkauft
          </div>
        )}
        {product.status === 'reserved' && (
          <div className="absolute top-3 left-3 bg-paper border border-ink px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
            Reserviert
          </div>
        )}
      </div>

      {/* Museum plaque */}
      <div className="gallery-meta mt-6 flex items-start justify-between gap-6 border-t border-ink pt-4">
        <div className="flex-1 min-w-0">
          <div className="font-display font-black uppercase text-2xl tracking-tight truncate">
            {product.title}
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
            {product.year} {product.technique ? `· ${product.technique}` : ''}
            {product.width && product.height
              ? ` · ${product.width}×${product.height} cm`
              : ''}
          </div>
        </div>
        <div className="font-display font-black text-xl whitespace-nowrap">
          {formatCHF(product.priceRappen)}
        </div>
      </div>
    </Link>
  );
}

function MobileCard({ product }: { product: Product }) {
  return (
    <Link href={`/werk/${product.slug}`} className="block">
      <div className="relative w-full aspect-[4/5] bg-muted">
        <Image
          src={product.imagePath}
          alt={product.title}
          fill
          sizes="100vw"
          className="object-cover"
        />
        {product.status === 'sold' && (
          <div className="absolute top-3 left-3 bg-ink text-paper px-2 py-1 text-[10px] uppercase tracking-widest font-bold">
            Verkauft
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <div className="font-display font-black uppercase text-lg tracking-tight truncate">
          {product.title}
        </div>
        <div className="font-mono whitespace-nowrap text-sm">
          {formatCHF(product.priceRappen)}
        </div>
      </div>
      <div className="text-[10px] uppercase tracking-widest opacity-60">
        {product.year} {product.technique ? `· ${product.technique}` : ''}
      </div>
    </Link>
  );
}
