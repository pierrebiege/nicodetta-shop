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

// Wall dimensions for the museum (free-placement editor)
// width = horizontal extent of the wall when looking AT it from inside the room
// height = ceiling height (always ROOM_H for museum walls)
export const MUSEUM_WALL_DIMS: Record<string, { width: number; height: number; label: string }> = {
  'museum:back':         { width: MUSEUM_W, height: ROOM_H, label: 'Back wall' },
  'museum:left':         { width: MUSEUM_D, height: ROOM_H, label: 'Left wall' },
  'museum:right':        { width: MUSEUM_D, height: ROOM_H, label: 'Right wall' },
  'museum:front-left':   { width: MUSEUM_W / 2 - DOORWAY_W / 2, height: ROOM_H, label: 'Front (left of door)' },
  'museum:front-right':  { width: MUSEUM_W / 2 - DOORWAY_W / 2, height: ROOM_H, label: 'Front (right of door)' },
};

// Convert a (wallX, wallY) placement on a museum wall — both in metres, origin
// = bottom-left when looking AT the wall — to a world-space position + rotation
// for the painting in the Three.js scene.
export function placementToWorld(
  wall: string,
  wallX: number,
  wallY: number,
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  const offWall = 0.02;
  switch (wall) {
    case 'museum:back': {
      // Wall lies at z = -8, faces +z. Looking at it from inside: -x is your left.
      // So wallX=0 means leftmost = world x = -MUSEUM_W/2
      return {
        position: [MUSEUM_X_MIN + wallX, wallY, MUSEUM_Z_MIN + offWall],
        rotation: [0, 0, 0],
      };
    }
    case 'museum:left': {
      // Wall at x = -12, faces +x. Looking at it from inside, -z is your left.
      // wallX increases as z increases (you walk along z from -8 to +8)
      return {
        position: [MUSEUM_X_MIN + offWall, wallY, MUSEUM_Z_MIN + wallX],
        rotation: [0, Math.PI / 2, 0],
      };
    }
    case 'museum:right': {
      // Wall at x = +12, faces -x. Looking at it from inside, +z is your left.
      // wallX increases as z decreases (so the layout reads left-to-right matching the editor)
      return {
        position: [MUSEUM_X_MAX - offWall, wallY, MUSEUM_Z_MAX - wallX],
        rotation: [0, -Math.PI / 2, 0],
      };
    }
    case 'museum:front-left': {
      // Front wall segment left of door: x in [-12, -1.5]. Faces -z.
      // Looking at it from inside (you face +z), +x is your right.
      // So wallX=0 → leftmost segment edge = -12
      return {
        position: [MUSEUM_X_MIN + wallX, wallY, MUSEUM_Z_MAX - offWall],
        rotation: [0, Math.PI, 0],
      };
    }
    case 'museum:front-right': {
      // x in [+1.5, +12]. Faces -z. wallX=0 → x = +1.5
      return {
        position: [DOORWAY_X_MAX + wallX, wallY, MUSEUM_Z_MAX - offWall],
        rotation: [0, Math.PI, 0],
      };
    }
  }
  return null;
}

// Given an existing wallSlot, compute an equivalent free-placement so we can
// migrate seamlessly.
export function slotToPlacement(slotKey: string): {
  wall: string;
  wallX: number;
  wallY: number;
  wallW: number;
  wallH: number;
} | null {
  const s = getSlotByKey(slotKey);
  if (!s) return null;
  const wall = s.wall;
  // Default piece footprint
  const wallW = 1.4;
  const wallH = 1.8;
  // Position the slot generated → derive wallX (distance from left edge of wall)
  // by inverting the formulas in placementToWorld.
  const wallY = s.position[1]; // y stays the same
  let wallX = 0;
  switch (wall) {
    case 'museum:back':
      wallX = s.position[0] - MUSEUM_X_MIN;
      break;
    case 'museum:left':
      wallX = s.position[2] - MUSEUM_Z_MIN;
      break;
    case 'museum:right':
      wallX = MUSEUM_Z_MAX - s.position[2];
      break;
    case 'museum:front-left':
      wallX = s.position[0] - MUSEUM_X_MIN;
      break;
    case 'museum:front-right':
      wallX = s.position[0] - DOORWAY_X_MAX;
      break;
    default:
      return null;
  }
  return { wall, wallX, wallY, wallW, wallH };
}

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
