// Single source of truth for room slot positions + identifiers.

export const MUSEUM_W = 24;
export const MUSEUM_D = 16;
export const WARDROBE_W = 8;
export const WARDROBE_D = 22;
export const ROOM_H = 6.0;
export const DOORWAY_W = 3.0;
export const DOORWAY_H = 3.0;

export const MUSEUM_X_MIN = -MUSEUM_W / 2;
export const MUSEUM_X_MAX = MUSEUM_W / 2;
export const MUSEUM_Z_MIN = -MUSEUM_D / 2;
export const MUSEUM_Z_MAX = MUSEUM_D / 2;
export const WARDROBE_X_MIN = -WARDROBE_W / 2;
export const WARDROBE_X_MAX = WARDROBE_W / 2;
export const WARDROBE_Z_MIN = MUSEUM_Z_MAX;
export const WARDROBE_Z_MAX = MUSEUM_Z_MAX + WARDROBE_D;
export const DOORWAY_X_MIN = -DOORWAY_W / 2;
export const DOORWAY_X_MAX = DOORWAY_W / 2;

export const PAINTING_CENTER_Y = 1.55;
export const WARDROBE_RAIL_HEIGHT = 2.4;
export const WARDROBE_RAIL_X = 2.2;
export const WARDROBE_ITEM_Y = 1.3;
export const WARDROBE_HANGER_Y = 2.1;

export type WallId =
  | 'museum:back'
  | 'museum:left'
  | 'museum:right'
  | 'museum:front-left'
  | 'museum:front-right'
  | 'wardrobe:left'
  | 'wardrobe:right';

export type Slot = {
  key: string; // e.g. "museum:back:0"
  wall: WallId;
  index: number;
  position: [number, number, number];
  rotation: [number, number, number];
};

// 5 museum walls — total 12 slots
export const MUSEUM_WALL_SLOT_COUNTS: Record<WallId, number> = {
  'museum:back': 4,
  'museum:left': 3,
  'museum:right': 3,
  'museum:front-left': 1,
  'museum:front-right': 1,
  'wardrobe:left': 6,
  'wardrobe:right': 6,
};

export const MUSEUM_WALLS: { id: WallId; label: string; slots: number }[] = [
  { id: 'museum:back', label: 'Back wall', slots: 4 },
  { id: 'museum:left', label: 'Left wall', slots: 3 },
  { id: 'museum:right', label: 'Right wall', slots: 3 },
  { id: 'museum:front-left', label: 'Front (left of door)', slots: 1 },
  { id: 'museum:front-right', label: 'Front (right of door)', slots: 1 },
];

export const WARDROBE_WALLS: { id: WallId; label: string; slots: number }[] = [
  { id: 'wardrobe:left', label: 'Left rail', slots: 6 },
  { id: 'wardrobe:right', label: 'Right rail', slots: 6 },
];

const offWall = 0.02;

export function getSlotByKey(key: string): Slot | null {
  const [room, wall, idxStr] = key.split(':');
  if (!room || !wall || idxStr === undefined) return null;
  const wallId = `${room}:${wall}` as WallId;
  const i = Number(idxStr);
  if (Number.isNaN(i)) return null;
  return buildSlot(wallId, i);
}

export function allSlotsForWall(wall: WallId): Slot[] {
  const n = MUSEUM_WALL_SLOT_COUNTS[wall] ?? 0;
  return Array.from({ length: n }, (_, i) => buildSlot(wall, i));
}

export function buildSlot(wall: WallId, i: number): Slot {
  const key = `${wall}:${i}`;
  if (wall === 'museum:back') {
    const x = ((i + 0.5) / 4 - 0.5) * (MUSEUM_W - 1.5);
    return { key, wall, index: i, position: [x, PAINTING_CENTER_Y, MUSEUM_Z_MIN + offWall], rotation: [0, 0, 0] };
  }
  if (wall === 'museum:left') {
    const z = ((i + 0.5) / 3 - 0.5) * (MUSEUM_D - 2);
    return { key, wall, index: i, position: [MUSEUM_X_MIN + offWall, PAINTING_CENTER_Y, z], rotation: [0, Math.PI / 2, 0] };
  }
  if (wall === 'museum:right') {
    const z = ((i + 0.5) / 3 - 0.5) * (MUSEUM_D - 2);
    return { key, wall, index: i, position: [MUSEUM_X_MAX - offWall, PAINTING_CENTER_Y, z], rotation: [0, -Math.PI / 2, 0] };
  }
  if (wall === 'museum:front-left') {
    return {
      key,
      wall,
      index: i,
      position: [(MUSEUM_X_MIN + DOORWAY_X_MIN) / 2, PAINTING_CENTER_Y, MUSEUM_Z_MAX - offWall],
      rotation: [0, Math.PI, 0],
    };
  }
  if (wall === 'museum:front-right') {
    return {
      key,
      wall,
      index: i,
      position: [(MUSEUM_X_MAX + DOORWAY_X_MAX) / 2, PAINTING_CENTER_Y, MUSEUM_Z_MAX - offWall],
      rotation: [0, Math.PI, 0],
    };
  }
  if (wall === 'wardrobe:left' || wall === 'wardrobe:right') {
    const per = MUSEUM_WALL_SLOT_COUNTS[wall];
    const cz = (WARDROBE_Z_MIN + WARDROBE_Z_MAX) / 2;
    const railLen = WARDROBE_D - 4;
    const z = cz + ((i + 0.5) / per - 0.5) * railLen;
    if (wall === 'wardrobe:left') {
      return { key, wall, index: i, position: [-WARDROBE_RAIL_X + 0.1, WARDROBE_ITEM_Y, z], rotation: [0, Math.PI / 2, 0] };
    }
    return { key, wall, index: i, position: [WARDROBE_RAIL_X - 0.1, WARDROBE_ITEM_Y, z], rotation: [0, -Math.PI / 2, 0] };
  }
  // Fallback (shouldn't happen)
  return { key, wall, index: i, position: [0, PAINTING_CENTER_Y, 0], rotation: [0, 0, 0] };
}

export function allMuseumSlots(): Slot[] {
  return MUSEUM_WALLS.flatMap((w) => allSlotsForWall(w.id));
}
export function allWardrobeSlots(): Slot[] {
  return WARDROBE_WALLS.flatMap((w) => allSlotsForWall(w.id));
}
