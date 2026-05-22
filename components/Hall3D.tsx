'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';
import {
  allMuseumSlots,
  allWardrobeSlots,
  getSlotByKey,
  type Slot,
} from '@/lib/slots';

// ─── Layout (one big shared scene) ─────────────────────────────────────────
//
// Museum room (paintings)        Wardrobe room (clothes)
//
//    +----- 24m ------+
//    |                |
//   16m   MUSEUM      | doorway   +-- 8m --+
//    |                |   3m wide |        |
//    |                |   ────►   |WARDROBE|  22m
//    |        +-----DOORWAY-------|        |
//    +----------------+           |        |
//                                 +--------+
//
//  Shared coordinate system:
//    Museum interior: x[-12..12], z[-8..8]
//    Wardrobe interior: x[-4..4], z[8..30]
//    Doorway opening: x[-1.5..1.5], z=8 (the shared wall)

const MUSEUM_W = 24;
const MUSEUM_D = 16;
const WARDROBE_W = 8;
const WARDROBE_D = 22;
const ROOM_H = 6.0;
const DOORWAY_W = 3.0;
const DOORWAY_H = 3.0;

const MUSEUM_X_MIN = -MUSEUM_W / 2;
const MUSEUM_X_MAX = MUSEUM_W / 2;
const MUSEUM_Z_MIN = -MUSEUM_D / 2;
const MUSEUM_Z_MAX = MUSEUM_D / 2; // = 8

const WARDROBE_X_MIN = -WARDROBE_W / 2;
const WARDROBE_X_MAX = WARDROBE_W / 2;
const WARDROBE_Z_MIN = MUSEUM_Z_MAX; // = 8
const WARDROBE_Z_MAX = MUSEUM_Z_MAX + WARDROBE_D; // = 30

const DOORWAY_X_MIN = -DOORWAY_W / 2;
const DOORWAY_X_MAX = DOORWAY_W / 2;

const EYE = 1.65;
const INSET = 0.45;
const SPEED = 5.0;

const PAINTING_CENTER_Y = 1.55;
const PAINTING_DEFAULT_W = 0.8;
const PAINTING_DEFAULT_H = 1.0;
const WARDROBE_RAIL_HEIGHT = 2.4;
const WARDROBE_RAIL_X = 2.2;
const WARDROBE_ITEM_Y = 1.3;
const WARDROBE_HANGER_Y = 2.1;

const WALL_PANEL_M = 2.6;
const FLOOR_TILE_M = 1.5;

function isWalkable(x: number, z: number): boolean {
  const inMuseum =
    x >= MUSEUM_X_MIN + INSET && x <= MUSEUM_X_MAX - INSET &&
    z >= MUSEUM_Z_MIN + INSET && z <= MUSEUM_Z_MAX - 0.02;
  const inDoorway =
    x >= DOORWAY_X_MIN && x <= DOORWAY_X_MAX &&
    z >= MUSEUM_Z_MAX - 0.3 && z <= MUSEUM_Z_MAX + 0.3;
  const inWardrobe =
    x >= WARDROBE_X_MIN + INSET && x <= WARDROBE_X_MAX - INSET &&
    z >= WARDROBE_Z_MIN + 0.02 && z <= WARDROBE_Z_MAX - INSET;
  return inMuseum || inDoorway || inWardrobe;
}

type TouchRefs = {
  moveX: { current: number };
  moveY: { current: number };
  lookX: { current: number };
  lookY: { current: number };
};

type SpawnSpec = { position: [number, number, number]; lookAt: [number, number, number] };

export function Hall3D({
  paintings,
  clothes,
  spawn,
}: {
  paintings: Product[];
  clothes: Product[];
  spawn: SpawnSpec;
}) {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState<Product | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [room, setRoom] = useState<'museum' | 'wardrobe'>('museum');
  const [muted, setMuted] = useState(false);
  const controlsRef = useRef<any>(null);
  const movingRef = useRef(false);

  const touchRefs: TouchRefs = useMemo(
    () => ({ moveX: { current: 0 }, moveY: { current: 0 }, lookX: { current: 0 }, lookY: { current: 0 } }),
    [],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  useEffect(() => {
    if (!entered) return;
    function onMove(e: KeyboardEvent) {
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
        setShowTutorial(false);
      }
    }
    window.addEventListener('keydown', onMove);
    const t = setTimeout(() => setShowTutorial(false), 6000);
    return () => {
      window.removeEventListener('keydown', onMove);
      clearTimeout(t);
    };
  }, [entered]);

  function enter() {
    setShowTutorial(true);
    if (isTouch) setEntered(true);
    else controlsRef.current?.lock();
  }
  function exit() {
    if (isTouch) setEntered(false);
    else controlsRef.current?.unlock();
  }

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.05, far: 100, position: spawn.position }}
        gl={{ antialias: true, toneMappingExposure: 1.3 }}
        dpr={[1, 2]}
        onCreated={({ camera }) => {
          camera.lookAt(...spawn.lookAt);
        }}
      >
        <color attach="background" args={['#e8ebee']} />
        <fog attach="fog" args={['#e8ebee', 18, 46]} />

        <ambientLight intensity={1.0} color="#ffffff" />
        <hemisphereLight args={['#ffffff', '#cfd3d8', 0.9]} />
        <directionalLight position={[6, 12, 4]} intensity={0.6} color="#ffffff" castShadow />

        <Suspense fallback={null}>
          <MuseumRoom />
          <WardrobeRoom />
          <Doorway />

          <Paintings paintings={paintings} hovered={hovered} onHover={setHovered} />
          <ClothingRack items={clothes} hovered={hovered} onHover={setHovered} />

          <Movement
            entered={entered}
            isTouch={isTouch}
            touchRefs={touchRefs}
            onRoomChange={setRoom}
            movingRef={movingRef}
          />
        </Suspense>

        {!isTouch && (
          <PointerLockControls
            ref={controlsRef}
            onLock={() => setEntered(true)}
            onUnlock={() => setEntered(false)}
          />
        )}
      </Canvas>

      {/* Crosshair / hover indicator */}
      {entered && !isTouch && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          {hovered ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-2 border-white rounded-full mix-blend-difference animate-pulse" />
              <div className="bg-black/80 text-white text-[11px] uppercase tracking-widest px-3 py-1.5 font-bold">
                Click to open
              </div>
            </div>
          ) : (
            <div className="w-2 h-2 bg-white mix-blend-difference" />
          )}
        </div>
      )}

      {entered && isTouch && hovered && (
        <div className="pointer-events-none fixed bottom-44 left-1/2 -translate-x-1/2 z-30 text-center px-6">
          <div className="bg-black/80 text-white px-4 py-3">
            <div className="font-display uppercase text-lg tracking-tight">{hovered.title}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1">Tap to open</div>
          </div>
        </div>
      )}

      {entered && !isTouch && hovered && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-center px-6">
          <div className="bg-black/80 text-white px-5 py-3">
            <div className="font-display uppercase text-xl tracking-tight">{hovered.title}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1">
              {hovered.year}{hovered.technique ? ` · ${hovered.technique}` : ''}
              {hovered.width && hovered.height ? ` · ${hovered.width}×${hovered.height} cm` : ''}
              {' · '}{formatCHF(hovered.priceRappen)}
            </div>
          </div>
        </div>
      )}

      {!entered && (
        <button
          onClick={enter}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm cursor-pointer px-6"
        >
          <div className="font-serif font-medium uppercase text-[clamp(3rem,8vw,7rem)] leading-[0.85] tracking-tight">
            Enter
          </div>
          <div className="mt-12 max-w-2xl">
            {isTouch ? (
              <div className="space-y-6 text-center">
                <Row label="Move" detail="Joystick bottom-left">
                  <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                </Row>
                <Row label="Look" detail="Drag the right side">
                  <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-xl">↔</div>
                </Row>
                <Row label="Open" detail="Tap any piece">
                  <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-xl">◉</div>
                </Row>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-8">
                  <KbdGroup />
                  <div className="text-left">
                    <div className="font-display uppercase text-2xl">Move</div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mt-1">WASD or arrow keys</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <MouseG />
                  <div className="text-left">
                    <div className="font-display uppercase text-2xl">Look + click</div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mt-1">
                      Move mouse · Click any piece · ESC to leave
                    </div>
                  </div>
                </div>
                <div className="text-center text-[11px] uppercase tracking-widest opacity-70">
                  Tip: walk through the doorway to switch rooms
                </div>
              </div>
            )}
          </div>
          <div className="mt-12 font-display uppercase text-base tracking-widest border border-white px-6 py-3">
            {isTouch ? 'Tap to start' : 'Click to start'}
          </div>
        </button>
      )}

      {entered && showTutorial && !isTouch && (
        <div className="pointer-events-none fixed bottom-32 left-1/2 -translate-x-1/2 z-30 text-white text-center animate-pulse">
          <div className="bg-black/70 px-6 py-4 flex items-center gap-6">
            <KbdGroup small />
            <div className="text-left">
              <div className="font-display uppercase text-base">Move</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">WASD · Arrows</div>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <MouseG small />
            <div className="text-left">
              <div className="font-display uppercase text-base">Look</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">Move mouse</div>
            </div>
          </div>
        </div>
      )}

      {entered && isTouch && (
        <button
          onClick={exit}
          className="fixed top-4 right-4 z-40 w-12 h-12 bg-black/80 text-white text-xl font-bold backdrop-blur-sm flex items-center justify-center"
          aria-label="Leave"
        >
          ✕
        </button>
      )}

      {entered && isTouch && <TouchUI touchRefs={touchRefs} />}

      {/* Audio: footsteps + ambient drone */}
      <GameAudio entered={entered} movingRef={movingRef} muted={muted} />

      {/* Mute toggle */}
      {entered && (
        <button
          onClick={() => setMuted((m) => !m)}
          className={`fixed bottom-5 ${isTouch ? 'right-5' : 'right-6'} z-30 w-10 h-10 bg-white/70 text-ink backdrop-blur-sm flex items-center justify-center text-xs uppercase tracking-widest font-bold`}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      )}

      {/* Persistent room indicator */}
      {entered && (
        <div className="pointer-events-none fixed top-5 left-1/2 -translate-x-1/2 z-30 bg-white/80 text-ink px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-serif">
          {room === 'museum' ? 'Paintings' : 'Wardrobe'}
        </div>
      )}

      {entered && !isTouch && (
        <div className="pointer-events-none fixed top-5 left-6 z-30 text-ink text-[10px] uppercase tracking-widest opacity-70 bg-white/70 px-3 py-2 backdrop-blur-sm">
          WASD = Move · Mouse = Look · ESC = Leave
        </div>
      )}
    </>
  );
}

// ─── Visual hints ──────────────────────────────────────────────────────────

function KbdGroup({ small = false }: { small?: boolean }) {
  const size = small ? 'w-7 h-7 text-[11px]' : 'w-11 h-11 text-base';
  return (
    <div className={`grid gap-1 ${small ? 'scale-90' : ''}`} style={{ gridTemplateColumns: 'repeat(3, auto)' }}>
      <div /><Kbd size={size}>W</Kbd><div />
      <Kbd size={size}>A</Kbd><Kbd size={size}>S</Kbd><Kbd size={size}>D</Kbd>
    </div>
  );
}
function Kbd({ children, size }: { children: React.ReactNode; size: string }) {
  return <div className={`${size} flex items-center justify-center border-2 border-white text-white font-display uppercase`}>{children}</div>;
}
function MouseG({ small = false }: { small?: boolean }) {
  const dim = small ? 'w-7 h-10' : 'w-10 h-14';
  return (
    <div className="relative">
      <div className={`${dim} border-2 border-white relative`} style={{ borderRadius: '50% / 30%' }}>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-white" />
      </div>
    </div>
  );
}
function Row({ children, label, detail }: { children: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="flex items-center justify-center gap-6">
      {children}
      <div className="text-left">
        <div className="font-display uppercase text-xl">{label}</div>
        <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">{detail}</div>
      </div>
    </div>
  );
}

// ─── Museum room geometry ──────────────────────────────────────────────────

function MuseumRoom() {
  const wallTex = useMemo(() => makePanelTexture(), []);
  const floorTex = useMemo(() => makeFloorTexture(), []);

  // Front wall (z=+8) is the doorway side — render as 4 segments around the opening
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[MUSEUM_W, MUSEUM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(floorTex, MUSEUM_W / FLOOR_TILE_M, MUSEUM_D / FLOOR_TILE_M)}
          color="#ffffff"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[MUSEUM_W, MUSEUM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(wallTex, MUSEUM_W / WALL_PANEL_M, MUSEUM_D / WALL_PANEL_M)}
          color="#ffffff"
          roughness={0.95}
        />
      </mesh>
      {/* Back wall (z=-8) */}
      <WallPlane w={MUSEUM_W} h={ROOM_H} position={[0, ROOM_H / 2, MUSEUM_Z_MIN]} rotation={[0, 0, 0]} tex={wallTex} />
      {/* Left wall (x=-12) */}
      <WallPlane w={MUSEUM_D} h={ROOM_H} position={[MUSEUM_X_MIN, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} tex={wallTex} />
      {/* Right wall (x=+12) */}
      <WallPlane w={MUSEUM_D} h={ROOM_H} position={[MUSEUM_X_MAX, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} tex={wallTex} />

      {/* Front wall (z=+8) with doorway hole — 3 segments */}
      {/* Left of doorway */}
      <WallPlane
        w={(MUSEUM_W / 2) - DOORWAY_W / 2}
        h={ROOM_H}
        position={[(MUSEUM_X_MIN + DOORWAY_X_MIN) / 2, ROOM_H / 2, MUSEUM_Z_MAX]}
        rotation={[0, Math.PI, 0]}
        tex={wallTex}
      />
      {/* Right of doorway */}
      <WallPlane
        w={(MUSEUM_W / 2) - DOORWAY_W / 2}
        h={ROOM_H}
        position={[(MUSEUM_X_MAX + DOORWAY_X_MAX) / 2, ROOM_H / 2, MUSEUM_Z_MAX]}
        rotation={[0, Math.PI, 0]}
        tex={wallTex}
      />
      {/* Above the doorway */}
      <WallPlane
        w={DOORWAY_W}
        h={ROOM_H - DOORWAY_H}
        position={[0, (ROOM_H + DOORWAY_H) / 2, MUSEUM_Z_MAX]}
        rotation={[0, Math.PI, 0]}
        tex={wallTex}
      />

      {/* LED strips along ceiling */}
      <LedStrip from={[MUSEUM_X_MIN, ROOM_H - 0.03, MUSEUM_Z_MIN + 0.02]} to={[MUSEUM_X_MAX, ROOM_H - 0.03, MUSEUM_Z_MIN + 0.02]} />
      <LedStrip from={[MUSEUM_X_MIN + 0.02, ROOM_H - 0.03, MUSEUM_Z_MIN]} to={[MUSEUM_X_MIN + 0.02, ROOM_H - 0.03, MUSEUM_Z_MAX]} />
      <LedStrip from={[MUSEUM_X_MAX - 0.02, ROOM_H - 0.03, MUSEUM_Z_MIN]} to={[MUSEUM_X_MAX - 0.02, ROOM_H - 0.03, MUSEUM_Z_MAX]} />
      {/* Front ceiling line (split around doorway is fine to leave full, it's high up) */}
      <LedStrip from={[MUSEUM_X_MIN, ROOM_H - 0.03, MUSEUM_Z_MAX - 0.02]} to={[MUSEUM_X_MAX, ROOM_H - 0.03, MUSEUM_Z_MAX - 0.02]} />

      {/* Ceiling fill lights */}
      {[[-6,-4],[6,-4],[-6,4],[6,4]].map(([x, z]) => (
        <pointLight key={`${x},${z}`} position={[x, ROOM_H - 0.3, z]} intensity={0.55} distance={10} color="#ffffff" />
      ))}
    </group>
  );
}

// ─── Wardrobe room geometry ────────────────────────────────────────────────

function WardrobeRoom() {
  const wallTex = useMemo(() => makePanelTexture(), []);
  const floorTex = useMemo(() => makeFloorTexture(), []);

  const cz = (WARDROBE_Z_MIN + WARDROBE_Z_MAX) / 2;

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WARDROBE_W, WARDROBE_D]} />
        <meshStandardMaterial
          map={cloneRepeat(floorTex, WARDROBE_W / FLOOR_TILE_M, WARDROBE_D / FLOOR_TILE_M)}
          color="#ffffff"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, ROOM_H, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[WARDROBE_W, WARDROBE_D]} />
        <meshStandardMaterial
          map={cloneRepeat(wallTex, WARDROBE_W / WALL_PANEL_M, WARDROBE_D / WALL_PANEL_M)}
          color="#ffffff"
          roughness={0.95}
        />
      </mesh>
      {/* Back wall (z=WARDROBE_Z_MAX) */}
      <WallPlane w={WARDROBE_W} h={ROOM_H} position={[0, ROOM_H / 2, WARDROBE_Z_MAX]} rotation={[0, Math.PI, 0]} tex={wallTex} />
      {/* Left wall */}
      <WallPlane w={WARDROBE_D} h={ROOM_H} position={[WARDROBE_X_MIN, ROOM_H / 2, cz]} rotation={[0, Math.PI / 2, 0]} tex={wallTex} />
      {/* Right wall */}
      <WallPlane w={WARDROBE_D} h={ROOM_H} position={[WARDROBE_X_MAX, ROOM_H / 2, cz]} rotation={[0, -Math.PI / 2, 0]} tex={wallTex} />

      {/* Front wall (z=WARDROBE_Z_MIN = 8) with doorway hole — same pattern */}
      {/* Left of doorway */}
      <WallPlane
        w={(WARDROBE_W / 2) - DOORWAY_W / 2}
        h={ROOM_H}
        position={[(WARDROBE_X_MIN + DOORWAY_X_MIN) / 2, ROOM_H / 2, WARDROBE_Z_MIN]}
        rotation={[0, 0, 0]}
        tex={wallTex}
      />
      {/* Right of doorway */}
      <WallPlane
        w={(WARDROBE_W / 2) - DOORWAY_W / 2}
        h={ROOM_H}
        position={[(WARDROBE_X_MAX + DOORWAY_X_MAX) / 2, ROOM_H / 2, WARDROBE_Z_MIN]}
        rotation={[0, 0, 0]}
        tex={wallTex}
      />
      {/* Above the doorway */}
      <WallPlane
        w={DOORWAY_W}
        h={ROOM_H - DOORWAY_H}
        position={[0, (ROOM_H + DOORWAY_H) / 2, WARDROBE_Z_MIN]}
        rotation={[0, 0, 0]}
        tex={wallTex}
      />

      {/* Rails (chrome cylinders the length of the wardrobe) */}
      <mesh position={[-WARDROBE_RAIL_X, WARDROBE_RAIL_HEIGHT, cz]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, WARDROBE_D - 2, 16]} />
        <meshStandardMaterial color="#b0b6bc" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[WARDROBE_RAIL_X, WARDROBE_RAIL_HEIGHT, cz]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.025, 0.025, WARDROBE_D - 2, 16]} />
        <meshStandardMaterial color="#b0b6bc" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* LED strips along ceiling */}
      <LedStrip from={[WARDROBE_X_MIN, ROOM_H - 0.03, WARDROBE_Z_MIN + 0.02]} to={[WARDROBE_X_MAX, ROOM_H - 0.03, WARDROBE_Z_MIN + 0.02]} />
      <LedStrip from={[WARDROBE_X_MIN, ROOM_H - 0.03, WARDROBE_Z_MAX - 0.02]} to={[WARDROBE_X_MAX, ROOM_H - 0.03, WARDROBE_Z_MAX - 0.02]} />
      <LedStrip from={[WARDROBE_X_MIN + 0.02, ROOM_H - 0.03, WARDROBE_Z_MIN]} to={[WARDROBE_X_MIN + 0.02, ROOM_H - 0.03, WARDROBE_Z_MAX]} />
      <LedStrip from={[WARDROBE_X_MAX - 0.02, ROOM_H - 0.03, WARDROBE_Z_MIN]} to={[WARDROBE_X_MAX - 0.02, ROOM_H - 0.03, WARDROBE_Z_MAX]} />

      {/* Ceiling fill lights along the corridor */}
      {[12, 17, 22, 27].map((z) => (
        <pointLight key={z} position={[0, ROOM_H - 0.3, z]} intensity={0.55} distance={9} color="#ffffff" />
      ))}
    </group>
  );
}

// ─── Doorway frame + signage ───────────────────────────────────────────────

function Doorway() {
  // Pure opening — no frame, no floor stripe. Just two soft accent lights
  // so the threshold is naturally lit from both sides.
  return (
    <group position={[0, 0, MUSEUM_Z_MAX]}>
      <pointLight position={[0, DOORWAY_H - 0.2, -0.5]} intensity={0.5} distance={3} color="#ffe8c0" />
      <pointLight position={[0, DOORWAY_H - 0.2, 0.5]} intensity={0.5} distance={3} color="#ffe8c0" />
    </group>
  );
}

function WallPlane({
  w, h, position, rotation, tex,
}: {
  w: number; h: number;
  position: [number, number, number];
  rotation: [number, number, number];
  tex: THREE.Texture;
}) {
  const mapped = useMemo(() => cloneRepeat(tex, Math.max(1, w / WALL_PANEL_M), Math.max(1, h / WALL_PANEL_M)), [tex, w, h]);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={mapped} color="#ffffff" roughness={0.9} side={THREE.FrontSide} />
    </mesh>
  );
}

function LedStrip({
  from, to, accent = false,
}: { from: [number, number, number]; to: [number, number, number]; accent?: boolean }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const length = start.distanceTo(end);
  const mid = start.clone().lerp(end, 0.5);
  const axis = new THREE.Vector3().subVectors(end, start).normalize();
  const yRot = Math.abs(axis.z) > 0.5 ? Math.PI / 2 : 0;
  return (
    <mesh position={[mid.x, mid.y, mid.z]} rotation={[0, yRot, 0]}>
      <boxGeometry args={[length, 0.035, 0.025]} />
      <meshBasicMaterial color={accent ? '#8fc1ff' : '#ffffff'} toneMapped={false} />
    </mesh>
  );
}

// ─── Paintings (museum walls) ──────────────────────────────────────────────

function Paintings({
  paintings, hovered, onHover,
}: { paintings: Product[]; hovered: Product | null; onHover: (p: Product | null) => void }) {
  const placements = useMemo(() => assignSlots(paintings, allMuseumSlots()), [paintings]);
  return (
    <>
      {placements.map(({ product, slot }) => (
        <Painting
          key={product.id}
          product={product}
          slot={slot}
          isHovered={hovered?.id === product.id}
          onHover={onHover}
        />
      ))}
    </>
  );
}

function assignSlots(items: Product[], slots: Slot[]): { product: Product; slot: Slot }[] {
  // Honour each product's wallSlot first; spill unplaced items into remaining slots.
  const used = new Set<string>();
  const placed: { product: Product; slot: Slot }[] = [];
  const overflow: Product[] = [];
  for (const p of items) {
    if (p.wallSlot) {
      const s = getSlotByKey(p.wallSlot);
      if (s && !used.has(s.key)) {
        used.add(s.key);
        placed.push({ product: p, slot: s });
        continue;
      }
    }
    overflow.push(p);
  }
  const free = slots.filter((s) => !used.has(s.key));
  let i = 0;
  for (const p of overflow) {
    const s = free[i++];
    if (!s) break;
    placed.push({ product: p, slot: s });
  }
  return placed;
}

function Painting({
  product, slot, isHovered, onHover,
}: {
  product: Product;
  slot: Slot;
  isHovered: boolean;
  onHover: (p: Product | null) => void;
}) {
  const router = useRouter();
  const texture = useLoader(THREE.TextureLoader, product.imagePath);
  const groupRef = useRef<THREE.Group>(null);

  const w = product.width && product.height ? product.width / 100 : PAINTING_DEFAULT_W;
  const h = product.width && product.height ? product.height / 100 : PAINTING_DEFAULT_H;

  useFrame(() => {
    if (!groupRef.current) return;
    const target = isHovered ? 1.04 : 1.0;
    groupRef.current.scale.x += (target - groupRef.current.scale.x) * 0.15;
    groupRef.current.scale.y += (target - groupRef.current.scale.y) * 0.15;
  });

  return (
    <group ref={groupRef} position={slot.position} rotation={slot.rotation}>
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[w + 0.12, h + 0.12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={isHovered ? 1 : 0} toneMapped={false} />
      </mesh>
      <mesh
        onClick={(e) => { e.stopPropagation(); router.push(`/werk/${product.slug}`); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(product); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <pointLight position={[0, h / 2 + 0.25, 0.4]} intensity={0.4} distance={2.2} color="#fff5e8" />
    </group>
  );
}

// ─── Clothing rack ────────────────────────────────────────────────────────

function ClothingRack({
  items, hovered, onHover,
}: { items: Product[]; hovered: Product | null; onHover: (p: Product | null) => void }) {
  const placements = useMemo(() => assignSlots(items, allWardrobeSlots()), [items]);
  return (
    <>
      {placements.map(({ product, slot }) => (
        <HangingItem
          key={product.id}
          product={product}
          slot={slot}
          isHovered={hovered?.id === product.id}
          onHover={onHover}
        />
      ))}
    </>
  );
}

function HangingItem({
  product, slot, isHovered, onHover,
}: {
  product: Product;
  slot: Slot;
  isHovered: boolean;
  onHover: (p: Product | null) => void;
}) {
  const router = useRouter();
  const texture = useLoader(THREE.TextureLoader, product.imagePath);
  const groupRef = useRef<THREE.Group>(null);

  const w = 0.8;
  const h = 1.1;

  useFrame(() => {
    if (!groupRef.current) return;
    const target = isHovered ? 1.06 : 1.0;
    groupRef.current.scale.x += (target - groupRef.current.scale.x) * 0.15;
    groupRef.current.scale.y += (target - groupRef.current.scale.y) * 0.15;
    const t = performance.now() * 0.0007 + slot.position[2];
    groupRef.current.rotation.z = Math.sin(t) * 0.02;
  });

  return (
    <group ref={groupRef} position={slot.position} rotation={slot.rotation}>
      <mesh position={[0, WARDROBE_HANGER_Y - WARDROBE_ITEM_Y, 0]}>
        <torusGeometry args={[0.04, 0.006, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#b0b6bc" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, WARDROBE_HANGER_Y - WARDROBE_ITEM_Y - 0.12, 0]}>
        <boxGeometry args={[w * 0.55, 0.015, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[w + 0.16, h + 0.16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={isHovered ? 1 : 0} toneMapped={false} />
      </mesh>
      <mesh
        onClick={(e) => { e.stopPropagation(); router.push(`/werk/${product.slug}`); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(product); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} transparent />
      </mesh>
      <pointLight position={[0, h / 2 + 0.3, 0.4]} intensity={0.35} distance={1.8} color="#fff5e8" />
    </group>
  );
}

// ─── Movement + touch ──────────────────────────────────────────────────────

function Movement({
  entered, isTouch, touchRefs, onRoomChange, movingRef,
}: {
  entered: boolean;
  isTouch: boolean;
  touchRefs: TouchRefs;
  onRoomChange: (r: 'museum' | 'wardrobe') => void;
  movingRef: { current: boolean };
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const tmpPos = useRef(new THREE.Vector3());
  const lastRoom = useRef<'museum' | 'wardrobe'>('museum');

  useEffect(() => {
    if (isTouch) return;
    const kd = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const ku = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [isTouch]);

  useFrame((_, delta) => {
    if (!entered) return;

    if (isTouch && (touchRefs.lookX.current !== 0 || touchRefs.lookY.current !== 0)) {
      euler.current.setFromQuaternion(camera.quaternion);
      const s = 0.0028;
      euler.current.y -= touchRefs.lookX.current * s;
      euler.current.x -= touchRefs.lookY.current * s;
      euler.current.x = THREE.MathUtils.clamp(euler.current.x, -Math.PI / 2 + 0.05, Math.PI / 2 - 0.05);
      camera.quaternion.setFromEuler(euler.current);
      touchRefs.lookX.current = 0;
      touchRefs.lookY.current = 0;
    }

    let fwd = 0, strafe = 0;
    if (isTouch) {
      fwd = -touchRefs.moveY.current;
      strafe = touchRefs.moveX.current;
    } else {
      const k = keys.current;
      fwd = (k['KeyW'] || k['ArrowUp'] ? 1 : 0) - (k['KeyS'] || k['ArrowDown'] ? 1 : 0);
      strafe = (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
    }

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    tmpPos.current.set(0, 0, 0);
    tmpPos.current.addScaledVector(forward.current, fwd);
    tmpPos.current.addScaledVector(right.current, strafe);
    const isMoving = tmpPos.current.lengthSq() > 0;
    movingRef.current = isMoving;
    if (isMoving) {
      const mag = Math.min(1, tmpPos.current.length());
      tmpPos.current.normalize().multiplyScalar(SPEED * delta * mag);

      // Try X then Z separately for wall sliding
      const cur = camera.position;
      const tryX = cur.x + tmpPos.current.x;
      if (isWalkable(tryX, cur.z)) cur.x = tryX;
      const tryZ = cur.z + tmpPos.current.z;
      if (isWalkable(cur.x, tryZ)) cur.z = tryZ;
    }

    camera.position.y = EYE;

    // Update room
    const z = camera.position.z;
    const newRoom: 'museum' | 'wardrobe' = z > MUSEUM_Z_MAX ? 'wardrobe' : 'museum';
    if (newRoom !== lastRoom.current) {
      lastRoom.current = newRoom;
      onRoomChange(newRoom);
    }
  });

  return null;
}

// ─── Procedural audio (footsteps + ambient) ────────────────────────────────

function GameAudio({
  entered,
  movingRef,
  muted,
}: {
  entered: boolean;
  movingRef: { current: boolean };
  muted: boolean;
}) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const lastStepRef = useRef(0);

  // Lazily create AudioContext when the player enters (user gesture)
  useEffect(() => {
    if (!entered) return;
    if (typeof window === 'undefined') return;
    if (ctxRef.current) return;

    const AC = (window.AudioContext || (window as any).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AC) return;
    const ctx = new AC();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    masterRef.current = master;
  }, [entered]);

  // Mute control
  useEffect(() => {
    const m = masterRef.current;
    if (!m) return;
    m.gain.setTargetAtTime(muted ? 0 : 1, m.context.currentTime, 0.1);
  }, [muted]);

  // Footstep ticker
  useEffect(() => {
    if (!entered) return;
    let raf: number;
    const STEP_INTERVAL = 430; // ms between footsteps

    function loop() {
      const ctx = ctxRef.current;
      if (ctx && movingRef.current && !muted) {
        const now = performance.now();
        if (now - lastStepRef.current > STEP_INTERVAL) {
          lastStepRef.current = now;
          playFootstep(ctx, masterRef.current);
        }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [entered, movingRef, muted]);

  return null;
}

function playFootstep(ctx: AudioContext, master: GainNode | null) {
  const dur = 0.18;
  const sampleRate = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sampleRate * dur), sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    // Sharp attack, exponential decay, slight low-frequency thump
    const noise = Math.random() * 2 - 1;
    const env = Math.pow(1 - t, 3);
    data[i] = noise * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.value = 0.13 + Math.random() * 0.05;
  src.connect(filter).connect(gain).connect(master ?? ctx.destination);
  src.start();
  src.stop(ctx.currentTime + dur + 0.02);
}

function TouchUI({ touchRefs }: { touchRefs: TouchRefs }) {
  const joyRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const lookRef = useRef<HTMLDivElement>(null);
  const moveTouchId = useRef<number | null>(null);
  const lookTouchId = useRef<number | null>(null);
  const lookLast = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const joy = joyRef.current!;
    const look = lookRef.current!;
    function joyCenter() {
      const r = joy.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, r: r.width / 2 };
    }
    function setKnob(dx: number, dy: number) {
      if (knobRef.current) knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    function onTouchStart(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        const el = document.elementFromPoint(t.clientX, t.clientY);
        if (joy.contains(el) && moveTouchId.current === null) {
          moveTouchId.current = t.identifier; e.preventDefault();
        } else if (look.contains(el) && lookTouchId.current === null) {
          lookTouchId.current = t.identifier;
          lookLast.current = { x: t.clientX, y: t.clientY };
          e.preventDefault();
        }
      }
    }
    function onTouchMove(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveTouchId.current) {
          const { cx, cy, r } = joyCenter();
          let dx = t.clientX - cx; let dy = t.clientY - cy;
          const len = Math.hypot(dx, dy);
          if (len > r) { dx = (dx / len) * r; dy = (dy / len) * r; }
          setKnob(dx, dy);
          touchRefs.moveX.current = dx / r;
          touchRefs.moveY.current = dy / r;
          e.preventDefault();
        } else if (t.identifier === lookTouchId.current && lookLast.current) {
          touchRefs.lookX.current += t.clientX - lookLast.current.x;
          touchRefs.lookY.current += t.clientY - lookLast.current.y;
          lookLast.current = { x: t.clientX, y: t.clientY };
          e.preventDefault();
        }
      }
    }
    function onTouchEnd(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveTouchId.current) {
          moveTouchId.current = null;
          setKnob(0, 0);
          touchRefs.moveX.current = 0;
          touchRefs.moveY.current = 0;
        }
        if (t.identifier === lookTouchId.current) {
          lookTouchId.current = null;
          lookLast.current = null;
        }
      }
    }
    window.addEventListener('touchstart', onTouchStart, { passive: false });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [touchRefs]);

  return (
    <>
      <div ref={lookRef} className="fixed top-0 right-0 bottom-0 w-1/2 z-30" style={{ touchAction: 'none' }} />
      <div
        ref={joyRef}
        className="fixed bottom-8 left-8 z-40 w-32 h-32 bg-white/15 border-2 border-white/60 backdrop-blur-sm flex items-center justify-center"
        style={{ touchAction: 'none', borderRadius: '50%' }}
      >
        <div ref={knobRef} className="w-14 h-14 bg-white/80 pointer-events-none" style={{ borderRadius: '50%' }} />
      </div>
    </>
  );
}

// ─── Textures ──────────────────────────────────────────────────────────────

function makePanelTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#f0f2f4');
  grad.addColorStop(1, '#e2e6ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#b5bbc1';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 3, size - 6, size - 6);
  for (let i = 0; i < 600; i++) {
    const a = (Math.random() * 0.04).toFixed(3);
    ctx.fillStyle = `rgba(140,150,160,${a})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeFloorTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 30, size / 2, size / 2, size * 0.7);
  grad.addColorStop(0, '#c8cdd2');
  grad.addColorStop(1, '#a8aeb5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#7a8088';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  for (let i = 0; i < 400; i++) {
    const a = (Math.random() * 0.06).toFixed(3);
    ctx.fillStyle = `rgba(60,65,70,${a})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function cloneRepeat(base: THREE.Texture, rx: number, ry: number) {
  const clone = base.clone();
  clone.needsUpdate = true;
  clone.wrapS = clone.wrapT = THREE.RepeatWrapping;
  clone.repeat.set(rx, ry);
  return clone;
}
