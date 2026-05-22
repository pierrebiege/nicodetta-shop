'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@/db/schema';
import type { WallId } from '@/lib/slots';

type WallDef = { id: WallId; label: string; slots: number };

// Slot-based editor — used for wardrobe rails where clothes have fixed
// hang points and free positioning isn't useful.
export function SlotLayoutEditor({
  walls,
  items,
}: {
  walls: WallDef[];
  items: Product[];
}) {
  const router = useRouter();
  const [picker, setPicker] = useState<{ slotKey: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const bySlot = useMemo(() => {
    const m = new Map<string, Product>();
    for (const it of items) if (it.wallSlot) m.set(it.wallSlot, it);
    return m;
  }, [items]);

  const unplaced = useMemo(() => items.filter((p) => !p.wallSlot), [items]);

  async function assignSlot(slotKey: string, productId: number | null) {
    setLoading(true);
    const occupant = bySlot.get(slotKey);
    if (productId === null && occupant) {
      await fetch(`/api/admin/products/${occupant.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallSlot: null }),
      });
    } else if (productId !== null) {
      if (occupant && occupant.id !== productId) {
        await fetch(`/api/admin/products/${occupant.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ wallSlot: null }),
        });
      }
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wallSlot: slotKey }),
      });
    }
    setPicker(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        {walls.map((w) => (
          <div key={w.id}>
            <div className="text-[10px] uppercase tracking-widest opacity-60 mb-2">
              {w.label} · {w.slots} slot{w.slots !== 1 ? 's' : ''}
            </div>
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: w.slots }).map((_, i) => {
                const slotKey = `${w.id}:${i}`;
                const occ = bySlot.get(slotKey);
                return (
                  <button
                    key={slotKey}
                    onClick={() => setPicker({ slotKey })}
                    className={`relative w-28 h-36 border-2 border-ink flex items-end justify-center text-[10px] uppercase tracking-widest p-2 hover:bg-muted text-left ${occ ? 'bg-paper' : 'bg-muted'}`}
                  >
                    {occ ? (
                      <>
                        <div className="absolute inset-0 p-1">
                          <div className="relative w-full h-full">
                            <Image src={occ.imagePath} alt={occ.title} fill sizes="120px" className="object-cover" />
                          </div>
                        </div>
                        <div className="relative bg-ink text-paper px-1.5 py-0.5 font-bold truncate w-[calc(100%-8px)]">
                          {occ.title}
                        </div>
                      </>
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center opacity-50">+ Empty</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {unplaced.length > 0 && (
        <div className="mt-6 border-t border-ink pt-4">
          <div className="text-[10px] uppercase tracking-widest opacity-60 mb-3">
            Unplaced ({unplaced.length})
          </div>
          <div className="flex flex-wrap gap-3">
            {unplaced.map((p) => (
              <div key={p.id} className="w-20 text-[10px]">
                <div className="relative w-20 h-24 bg-muted">
                  <Image src={p.imagePath} alt={p.title} fill sizes="80px" className="object-cover" />
                </div>
                <div className="mt-1 truncate font-bold uppercase">{p.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {picker && (
        <Picker
          slotKey={picker.slotKey}
          items={items}
          bySlot={bySlot}
          onClose={() => setPicker(null)}
          onPick={(productId) => assignSlot(picker.slotKey, productId)}
          loading={loading}
        />
      )}
    </>
  );
}

function Picker({
  slotKey, items, bySlot, onClose, onPick, loading,
}: {
  slotKey: string;
  items: Product[];
  bySlot: Map<string, Product>;
  onClose: () => void;
  onPick: (productId: number | null) => void;
  loading: boolean;
}) {
  const current = bySlot.get(slotKey);
  return (
    <div onClick={onClose} className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div onClick={(e) => e.stopPropagation()} className="bg-paper border border-ink p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-2xl">Slot {slotKey}</h3>
            {current && <div className="text-xs opacity-60 mt-1">Currently: {current.title}</div>}
          </div>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>
        {current && (
          <button
            disabled={loading}
            onClick={() => onPick(null)}
            className="block w-full text-left border border-ink p-3 mb-4 hover:bg-muted text-xs uppercase tracking-widest disabled:opacity-50"
          >
            Clear slot
          </button>
        )}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((p) => {
            const isCurrent = p.id === current?.id;
            return (
              <button
                key={p.id}
                disabled={loading}
                onClick={() => onPick(p.id)}
                className={`text-left ${isCurrent ? 'opacity-50' : 'hover:opacity-100 opacity-90'}`}
              >
                <div className="relative w-full aspect-[4/5] bg-muted border border-ink">
                  <Image src={p.imagePath} alt={p.title} fill sizes="150px" className="object-cover" />
                  {p.wallSlot && p.wallSlot !== slotKey && (
                    <div className="absolute top-1 right-1 bg-ink text-paper text-[8px] uppercase tracking-widest px-1 py-0.5">In use</div>
                  )}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-widest truncate font-bold">{p.title}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
