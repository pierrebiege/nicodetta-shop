'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/db/schema';

type Placement = {
  productId: number;
  wall: string;
  wallX: number; // metres from wall left
  wallY: number; // metres from floor (center)
  wallW: number; // metres
  wallH: number; // metres
};

type DragMode =
  | { kind: 'move'; startX: number; startY: number; origX: number; origY: number }
  | { kind: 'resize'; corner: 'tl' | 'tr' | 'bl' | 'br'; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number };

const MIN_SIZE_M = 0.2;
const HANDLE_PX = 14;

export function WallCanvas({
  wall,
  width,
  height,
  label,
  items,
  allItems,
  onPlacementChange,
  onAddItem,
  onRemoveItem,
}: {
  wall: string;
  width: number;
  height: number;
  label: string;
  items: Product[];
  allItems: Product[];
  onPlacementChange: (productId: number, patch: Partial<Placement>) => void;
  onAddItem: (productId: number) => void;
  onRemoveItem: (productId: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pxPerM, setPxPerM] = useState(50);
  const [showPicker, setShowPicker] = useState(false);
  const dragRef = useRef<DragMode | null>(null);
  const pendingRef = useRef<Map<number, Partial<Placement>>>(new Map());
  const [tick, setTick] = useState(0); // forces re-render during drag

  // Compute scale based on container width
  useEffect(() => {
    function recalc() {
      const el = containerRef.current;
      if (!el) return;
      const parentWidth = el.parentElement?.clientWidth ?? 1000;
      // Reserve some padding
      const targetWidth = Math.min(parentWidth - 40, 1400);
      setPxPerM(Math.max(20, targetWidth / width));
    }
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [width]);

  const canvasW = width * pxPerM;
  const canvasH = height * pxPerM;

  function getEffective(p: Product): Placement | null {
    const pending = pendingRef.current.get(p.id);
    const wallX = pending?.wallX ?? p.wallX;
    const wallY = pending?.wallY ?? p.wallY;
    const wallW = pending?.wallW ?? p.wallW;
    const wallH = pending?.wallH ?? p.wallH;
    if (wallX == null || wallY == null || wallW == null || wallH == null) return null;
    return { productId: p.id, wall, wallX, wallY, wallW, wallH };
  }

  function pxFromM(m: number) { return m * pxPerM; }

  function startDrag(e: React.PointerEvent, mode: DragMode) {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = mode;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const mode = dragRef.current;
    if (!mode || selectedId == null) return;
    const dxPx = e.clientX - mode.startX;
    const dyPx = e.clientY - mode.startY;
    const dxM = dxPx / pxPerM;
    const dyM = dyPx / pxPerM;

    const p = items.find((it) => it.id === selectedId);
    if (!p) return;
    const cur = getEffective(p);
    if (!cur) return;

    let patch: Partial<Placement> = {};
    if (mode.kind === 'move') {
      const newX = clamp(mode.origX + dxM, cur.wallW / 2, width - cur.wallW / 2);
      const newY = clamp(mode.origY - dyM, cur.wallH / 2, height - cur.wallH / 2);
      patch = { wallX: newX, wallY: newY };
    } else if (mode.kind === 'resize') {
      // Resize anchored on opposite corner; corner is the dragged one
      const w0 = mode.origW, h0 = mode.origH, cx0 = mode.origX, cy0 = mode.origY;
      // Compute opposite corner (anchor) in metres
      let anchorX = 0, anchorY = 0;
      switch (mode.corner) {
        case 'tr': anchorX = cx0 - w0/2; anchorY = cy0 - h0/2; break; // bl
        case 'tl': anchorX = cx0 + w0/2; anchorY = cy0 - h0/2; break; // br
        case 'br': anchorX = cx0 - w0/2; anchorY = cy0 + h0/2; break; // tl
        case 'bl': anchorX = cx0 + w0/2; anchorY = cy0 + h0/2; break; // tr
      }
      // Current dragged corner position in metres
      const startCornerX = mode.corner.endsWith('l') ? cx0 - w0/2 : cx0 + w0/2;
      const startCornerY = mode.corner.startsWith('t') ? cy0 + h0/2 : cy0 - h0/2;
      const curCornerX = startCornerX + dxM;
      const curCornerY = startCornerY - dyM;
      const newW = Math.max(MIN_SIZE_M, Math.abs(curCornerX - anchorX));
      const newH = Math.max(MIN_SIZE_M, Math.abs(curCornerY - anchorY));
      const newCx = (anchorX + curCornerX) / 2;
      const newCy = (anchorY + curCornerY) / 2;
      // Clamp inside wall bounds
      const cx = clamp(newCx, newW/2, width - newW/2);
      const cy = clamp(newCy, newH/2, height - newH/2);
      patch = { wallX: cx, wallY: cy, wallW: newW, wallH: newH };
    }

    pendingRef.current.set(selectedId, { ...pendingRef.current.get(selectedId), ...patch });
    setTick((t) => t + 1);
  }

  function onPointerUp(_e: React.PointerEvent) {
    const mode = dragRef.current;
    dragRef.current = null;
    if (!mode || selectedId == null) return;
    const pending = pendingRef.current.get(selectedId);
    if (pending && Object.keys(pending).length > 0) {
      onPlacementChange(selectedId, pending);
    }
  }

  // Reset pending when items prop changes (after save round-trip)
  useEffect(() => {
    pendingRef.current = new Map();
    setTick((t) => t + 1);
  }, [items]);

  const unplaced = useMemo(
    () => allItems.filter((p) => !items.some((it) => it.id === p.id)),
    [items, allItems],
  );

  return (
    <div className="space-y-3">
      {/* Wall header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-display uppercase text-base tracking-tight mr-2">{label}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-50">
            {width} × {height} m
          </span>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          className="text-xs uppercase tracking-widest border border-ink px-3 py-2 hover:bg-ink hover:text-paper"
        >
          + Add piece
        </button>
      </div>

      {/* Wall canvas */}
      <div
        ref={containerRef}
        className="relative bg-muted border border-ink select-none overflow-hidden"
        style={{ width: canvasW, height: canvasH }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedId(null);
        }}
      >
        {/* Wall ruler markers every 2m */}
        {Array.from({ length: Math.floor(width / 2) + 1 }).map((_, i) => (
          <div
            key={`vx${i}`}
            className="absolute top-0 bottom-0 border-l border-ink/10 pointer-events-none"
            style={{ left: i * 2 * pxPerM }}
          />
        ))}
        {Array.from({ length: Math.floor(height / 2) + 1 }).map((_, i) => (
          <div
            key={`hy${i}`}
            className="absolute left-0 right-0 border-t border-ink/10 pointer-events-none"
            style={{ bottom: i * 2 * pxPerM }}
          />
        ))}
        {/* Eye-line at 1.55m */}
        <div
          className="absolute left-0 right-0 border-t border-accent/40 pointer-events-none"
          style={{ bottom: 1.55 * pxPerM }}
          title="Eye level"
        />

        {items.map((p) => {
          const eff = getEffective(p);
          if (!eff) return null;
          const left = pxFromM(eff.wallX - eff.wallW / 2);
          const bottom = pxFromM(eff.wallY - eff.wallH / 2);
          const w = pxFromM(eff.wallW);
          const h = pxFromM(eff.wallH);
          const isSel = selectedId === p.id;
          return (
            <div
              key={p.id}
              onPointerDown={(e) => {
                if ((e.target as HTMLElement).dataset.role === 'handle') return;
                setSelectedId(p.id);
                startDrag(e, {
                  kind: 'move',
                  startX: e.clientX,
                  startY: e.clientY,
                  origX: eff.wallX,
                  origY: eff.wallY,
                });
              }}
              onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }}
              className={`absolute cursor-move ${isSel ? 'ring-2 ring-accent' : 'hover:ring-1 hover:ring-ink/40'}`}
              style={{ left, bottom, width: w, height: h, touchAction: 'none' }}
            >
              <Image
                src={p.imagePath}
                alt={p.title}
                fill
                sizes="200px"
                className="object-contain pointer-events-none"
                draggable={false}
              />
              {isSel && (
                <>
                  {(['tl','tr','bl','br'] as const).map((corner) => {
                    const style: React.CSSProperties = {
                      width: HANDLE_PX, height: HANDLE_PX,
                      background: '#ff3b1f',
                      position: 'absolute',
                    };
                    if (corner.startsWith('t')) style.top = -HANDLE_PX/2;
                    else style.bottom = -HANDLE_PX/2;
                    if (corner.endsWith('l')) style.left = -HANDLE_PX/2;
                    else style.right = -HANDLE_PX/2;
                    return (
                      <div
                        key={corner}
                        data-role="handle"
                        style={{ ...style, cursor: cornerCursor(corner), touchAction: 'none' }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startDrag(e, {
                            kind: 'resize',
                            corner,
                            startX: e.clientX,
                            startY: e.clientY,
                            origX: eff.wallX,
                            origY: eff.wallY,
                            origW: eff.wallW,
                            origH: eff.wallH,
                          });
                        }}
                      />
                    );
                  })}
                </>
              )}
              {/* Size readout */}
              {isSel && (
                <div className="absolute -top-7 left-0 bg-ink text-paper px-2 py-1 text-[10px] font-mono uppercase whitespace-nowrap">
                  {Math.round(eff.wallW * 100)} × {Math.round(eff.wallH * 100)} cm
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-widest opacity-30">
            No pieces on this wall yet
          </div>
        )}
      </div>

      {/* Selected piece info / actions */}
      {selectedId != null && (
        <SelectedBar
          product={items.find((p) => p.id === selectedId)!}
          placement={getEffective(items.find((p) => p.id === selectedId)!)!}
          onRemove={() => {
            onRemoveItem(selectedId);
            setSelectedId(null);
          }}
          onResize={(patch) => onPlacementChange(selectedId, patch)}
        />
      )}

      {/* Picker for adding unplaced pieces */}
      {showPicker && (
        <Picker
          items={unplaced}
          onClose={() => setShowPicker(false)}
          onPick={(id) => {
            onAddItem(id);
            setShowPicker(false);
          }}
        />
      )}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  if (hi < lo) return lo;
  return Math.max(lo, Math.min(hi, v));
}
function cornerCursor(c: 'tl'|'tr'|'bl'|'br') {
  return c === 'tl' || c === 'br' ? 'nwse-resize' : 'nesw-resize';
}

function SelectedBar({
  product, placement, onRemove, onResize,
}: {
  product: Product;
  placement: Placement;
  onRemove: () => void;
  onResize: (patch: Partial<Placement>) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4 border border-ink p-3 bg-paper">
      <div className="text-xs">
        <div className="text-[10px] uppercase tracking-widest opacity-60">Selected</div>
        <div className="font-bold uppercase">{product.title}</div>
      </div>
      <SizeInput
        label="W"
        value={Math.round(placement.wallW * 100)}
        onChange={(cm) => onResize({ wallW: Math.max(0.2, cm / 100) })}
      />
      <SizeInput
        label="H"
        value={Math.round(placement.wallH * 100)}
        onChange={(cm) => onResize({ wallH: Math.max(0.2, cm / 100) })}
      />
      <div className="text-[10px] uppercase tracking-widest opacity-60 ml-auto">
        Center: {placement.wallX.toFixed(2)} × {placement.wallY.toFixed(2)} m
      </div>
      <button
        onClick={onRemove}
        className="text-xs uppercase tracking-widest border border-ink px-3 py-2 hover:bg-accent hover:text-paper hover:border-accent"
      >
        Remove from wall
      </button>
    </div>
  );
}

function SizeInput({
  label, value, onChange,
}: { label: string; value: number; onChange: (cm: number) => void }) {
  return (
    <label className="text-xs">
      <span className="text-[10px] uppercase tracking-widest opacity-60 block">{label} (cm)</span>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(n);
        }}
        className="border border-ink px-2 py-1 w-20 text-sm font-mono"
      />
    </label>
  );
}

function Picker({
  items, onClose, onPick,
}: { items: Product[]; onClose: () => void; onPick: (id: number) => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-paper border border-ink p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl">Add to this wall</h3>
          <button onClick={onClose} className="text-xl">✕</button>
        </div>
        {items.length === 0 && (
          <div className="text-sm opacity-60 py-6">
            No unplaced pieces. Move something off another wall first.
          </div>
        )}
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((p) => (
            <button key={p.id} onClick={() => onPick(p.id)} className="text-left hover:opacity-100 opacity-90">
              <div className="relative w-full aspect-[4/5] bg-muted border border-ink">
                <Image src={p.imagePath} alt={p.title} fill sizes="150px" className="object-cover" />
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest truncate font-bold">{p.title}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
