'use client';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Product } from '@/db/schema';
import type { WallId } from '@/lib/slots';
import { MUSEUM_WALL_DIMS } from '@/lib/slots';
import { WallCanvas } from './WallCanvas';

type WallDef = { id: WallId; label: string; slots: number };

// Interactive layout editor for museum walls (paintings).
// Free placement with drag + resize on a scaled canvas.
export function WallLayoutEditor({
  walls,
  items,
}: {
  walls: WallDef[];
  items: Product[];
}) {
  const router = useRouter();
  const [activeWall, setActiveWall] = useState<WallId>(walls[0].id);

  const itemsOnWall = useMemo(
    () => items.filter((p) => p.wall === activeWall),
    [items, activeWall],
  );

  async function patch(productId: number, body: Record<string, unknown>) {
    await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function handlePlacementChange(productId: number, p: Partial<{ wallX: number; wallY: number; wallW: number; wallH: number }>) {
    await patch(productId, p);
  }

  async function handleAdd(productId: number) {
    const dim = MUSEUM_WALL_DIMS[activeWall];
    if (!dim) return;
    // Default placement: centered, modest size
    const defaultW = Math.min(1.2, dim.width * 0.4);
    const defaultH = Math.min(1.6, dim.height * 0.5);
    await patch(productId, {
      wall: activeWall,
      wallX: dim.width / 2,
      wallY: 1.55,
      wallW: defaultW,
      wallH: defaultH,
      wallSlot: null,
    });
  }

  async function handleRemove(productId: number) {
    await patch(productId, {
      wall: null,
      wallX: null,
      wallY: null,
      wallW: null,
      wallH: null,
    });
  }

  const dim = MUSEUM_WALL_DIMS[activeWall];

  return (
    <div className="space-y-6">
      {/* Wall tabs */}
      <div className="flex flex-wrap gap-2 border-b border-ink/20 pb-3">
        {walls.map((w) => {
          const count = items.filter((p) => p.wall === w.id).length;
          return (
            <button
              key={w.id}
              onClick={() => setActiveWall(w.id)}
              className={`px-3 py-2 text-xs uppercase tracking-widest border ${activeWall === w.id ? 'border-ink bg-ink text-paper' : 'border-ink/20 hover:border-ink'}`}
            >
              {w.label}
              {count > 0 && <span className="ml-2 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {dim && (
        <WallCanvas
          wall={activeWall}
          width={dim.width}
          height={dim.height}
          label={dim.label}
          items={itemsOnWall}
          allItems={items}
          onPlacementChange={handlePlacementChange}
          onAddItem={handleAdd}
          onRemoveItem={handleRemove}
        />
      )}
    </div>
  );
}
