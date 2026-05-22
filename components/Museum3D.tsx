'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';

// Room dimensions in metres
const ROOM_W = 22;
const ROOM_D = 14;
const ROOM_H = 3.0;
const EYE = 1.65;
const WALL_INSET = 0.6;
const SPEED = 5.0;
const PAINTING_CENTER_Y = 1.55;
const PAINTING_DEFAULT_W = 0.8;
const PAINTING_DEFAULT_H = 1.0;

// Panel sizes for the textured walls/floor — bigger panels = fewer lines
const WALL_PANEL_M = 2.2; // metres per concrete panel
const FLOOR_TILE_M = 1.5;

type TouchRefs = {
  moveX: { current: number };
  moveY: { current: number };
  lookX: { current: number };
  lookY: { current: number };
};

export function Museum3D({ paintings }: { paintings: Product[] }) {
  const [entered, setEntered] = useState(false);
  const [hovered, setHovered] = useState<Product | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const controlsRef = useRef<any>(null);

  const touchRefs: TouchRefs = useMemo(
    () => ({
      moveX: { current: 0 },
      moveY: { current: 0 },
      lookX: { current: 0 },
      lookY: { current: 0 },
    }),
    [],
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouch(window.matchMedia('(pointer: coarse)').matches);
    }
  }, []);

  // Hide tutorial overlay after movement starts
  useEffect(() => {
    if (!entered) return;
    function onMove(e: KeyboardEvent) {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        setShowTutorial(false);
      }
    }
    window.addEventListener('keydown', onMove);
    const fallback = setTimeout(() => setShowTutorial(false), 6000);
    return () => {
      window.removeEventListener('keydown', onMove);
      clearTimeout(fallback);
    };
  }, [entered]);

  function enter() {
    setShowTutorial(true);
    if (isTouch) {
      setEntered(true);
    } else {
      controlsRef.current?.lock();
    }
  }
  function exit() {
    if (isTouch) {
      setEntered(false);
    } else {
      controlsRef.current?.unlock();
    }
  }

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.05, far: 80, position: [0, EYE, ROOM_D / 2 - 2] }}
        gl={{ antialias: true, toneMappingExposure: 1.3 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#e8ebee']} />
        <fog attach="fog" args={['#e8ebee', 16, 40]} />

        {/* Very bright, neutral lighting for the clean Portal/Mirror's Edge feel */}
        <ambientLight intensity={1.0} color="#ffffff" />
        <hemisphereLight args={['#ffffff', '#cfd3d8', 0.9]} />
        <directionalLight
          position={[6, 8, 4]}
          intensity={0.6}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Suspense fallback={null}>
          <Room />
          <Paintings paintings={paintings} hovered={hovered} onHover={setHovered} />
          <Movement
            entered={entered}
            isTouch={isTouch}
            touchRefs={touchRefs}
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

      {/* Crosshair (desktop only) — grows + labels when on a painting */}
      {entered && !isTouch && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          {hovered ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-2 border-white rounded-full mix-blend-difference animate-pulse" />
              <div className="bg-black/80 text-white text-[11px] uppercase tracking-widest px-3 py-1.5 font-bold">
                Klick zum Öffnen
              </div>
            </div>
          ) : (
            <div className="w-2 h-2 bg-white mix-blend-difference" />
          )}
        </div>
      )}

      {/* Touch hover label */}
      {entered && isTouch && hovered && (
        <div className="pointer-events-none fixed bottom-44 left-1/2 -translate-x-1/2 z-30 text-center px-6">
          <div className="bg-black/80 text-white px-4 py-3">
            <div className="font-display font-black uppercase text-lg tracking-tight">
              {hovered.title}
            </div>
            <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1">
              Antippen zum Öffnen
            </div>
          </div>
        </div>
      )}

      {/* Desktop info bar at bottom when hovering */}
      {entered && !isTouch && hovered && (
        <div className="pointer-events-none fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-center px-6">
          <div className="bg-black/80 text-white px-5 py-3">
            <div className="font-display font-black uppercase text-xl tracking-tight">
              {hovered.title}
            </div>
            <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1">
              {hovered.year} {hovered.technique ? `· ${hovered.technique}` : ''}
              {hovered.width && hovered.height
                ? ` · ${hovered.width}×${hovered.height} cm`
                : ''}{' '}
              · {formatCHF(hovered.priceRappen)}
            </div>
          </div>
        </div>
      )}

      {/* Entry overlay */}
      {!entered && (
        <button
          onClick={enter}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm cursor-pointer px-6"
        >
          <div className="font-display font-black uppercase text-[clamp(3rem,8vw,7rem)] leading-[0.85] tracking-tight">
            Eintreten
          </div>

          <div className="mt-12 max-w-2xl">
            {isTouch ? (
              <div className="space-y-6 text-center">
                <ControlsRow
                  icon={<JoyIcon />}
                  label="Bewegen"
                  detail="Joystick unten links"
                />
                <ControlsRow
                  icon={<DragIcon />}
                  label="Umsehen"
                  detail="Rechte Seite ziehen"
                />
                <ControlsRow icon={<TapIcon />} label="Öffnen" detail="Auf Werk tippen" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-8">
                  <KeyboardGraphic />
                  <div className="text-left">
                    <div className="font-display font-black uppercase text-2xl">Bewegen</div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mt-1">
                      WASD oder Pfeiltasten
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-8">
                  <MouseGraphic />
                  <div className="text-left">
                    <div className="font-display font-black uppercase text-2xl">Umsehen + Klicken</div>
                    <div className="text-xs uppercase tracking-widest opacity-70 mt-1">
                      Maus bewegen · Klick auf Werk = Detail · ESC = Raus
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 font-display font-black uppercase text-base tracking-widest border border-white px-6 py-3">
            {isTouch ? 'Tippen zum Starten' : 'Klick zum Starten'}
          </div>
        </button>
      )}

      {/* In-room tutorial overlay (fades out after movement / 6 s) */}
      {entered && showTutorial && !isTouch && (
        <div className="pointer-events-none fixed bottom-32 left-1/2 -translate-x-1/2 z-30 text-white text-center animate-pulse">
          <div className="bg-black/70 px-6 py-4 flex items-center gap-6">
            <KeyboardGraphic small />
            <div className="text-left">
              <div className="font-display font-black uppercase text-base">Bewegen</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">WASD · Pfeile</div>
            </div>
            <div className="w-px h-10 bg-white/30" />
            <MouseGraphic small />
            <div className="text-left">
              <div className="font-display font-black uppercase text-base">Umsehen</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">Maus bewegen</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile exit */}
      {entered && isTouch && (
        <button
          onClick={exit}
          className="fixed top-4 right-4 z-40 w-12 h-12 bg-black/80 text-white text-xl font-bold backdrop-blur-sm flex items-center justify-center"
          aria-label="Verlassen"
        >
          ✕
        </button>
      )}

      {/* Mobile touch controls */}
      {entered && isTouch && <TouchControlsUI touchRefs={touchRefs} />}

      {/* Persistent desktop corner hint */}
      {entered && !isTouch && (
        <div className="pointer-events-none fixed top-5 left-6 z-30 text-ink text-[10px] uppercase tracking-widest opacity-70 bg-white/70 px-3 py-2 backdrop-blur-sm">
          WASD = Bewegen · Maus = Umsehen · ESC = Raus
        </div>
      )}
    </>
  );
}

// ─── Visual control hints ──────────────────────────────────────────────────

function KeyboardGraphic({ small = false }: { small?: boolean }) {
  const size = small ? 'w-7 h-7 text-[11px]' : 'w-11 h-11 text-base';
  return (
    <div className={`grid gap-1 ${small ? 'scale-90' : ''}`} style={{ gridTemplateColumns: 'repeat(3, auto)' }}>
      <div />
      <Key size={size}>W</Key>
      <div />
      <Key size={size}>A</Key>
      <Key size={size}>S</Key>
      <Key size={size}>D</Key>
    </div>
  );
}

function Key({ children, size }: { children: React.ReactNode; size: string }) {
  return (
    <div
      className={`${size} flex items-center justify-center border-2 border-white text-white font-display font-black uppercase`}
    >
      {children}
    </div>
  );
}

function MouseGraphic({ small = false }: { small?: boolean }) {
  const dim = small ? 'w-7 h-10' : 'w-10 h-14';
  return (
    <div className="relative">
      <div className={`${dim} border-2 border-white relative`} style={{ borderRadius: '50% / 30%' }}>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-2 bg-white" />
      </div>
      <div className="absolute -top-2 -left-3 text-white text-xs">↖</div>
      <div className="absolute -top-2 -right-3 text-white text-xs">↗</div>
    </div>
  );
}

function JoyIcon() {
  return (
    <div className="w-12 h-12 border-2 border-white rounded-full relative flex items-center justify-center">
      <div className="w-4 h-4 bg-white rounded-full" />
    </div>
  );
}
function DragIcon() {
  return (
    <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white text-xl">
      ↔
    </div>
  );
}
function TapIcon() {
  return (
    <div className="w-12 h-12 border-2 border-white flex items-center justify-center text-white text-xl">
      ◉
    </div>
  );
}

function ControlsRow({
  icon,
  label,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-center gap-6">
      {icon}
      <div className="text-left">
        <div className="font-display font-black uppercase text-xl">{label}</div>
        <div className="text-[10px] uppercase tracking-widest opacity-70 mt-1">{detail}</div>
      </div>
    </div>
  );
}

// ─── Geometry ──────────────────────────────────────────────────────────────

function Room() {
  const wallTex = useMemo(() => makePanelTexture(), []);
  const floorTex = useMemo(() => makeFloorTexture(), []);
  const ceilTex = useMemo(() => makePanelTexture(), []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(floorTex, ROOM_W / FLOOR_TILE_M, ROOM_D / FLOOR_TILE_M)}
          color="#ffffff"
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(ceilTex, ROOM_W / WALL_PANEL_M, ROOM_D / WALL_PANEL_M)}
          color="#ffffff"
          roughness={0.95}
        />
      </mesh>

      <Wall w={ROOM_W} h={ROOM_H} position={[0, ROOM_H / 2, -ROOM_D / 2]} rotation={[0, 0, 0]} tex={wallTex} />
      <Wall w={ROOM_W} h={ROOM_H} position={[0, ROOM_H / 2, ROOM_D / 2]} rotation={[0, Math.PI, 0]} tex={wallTex} />
      <Wall w={ROOM_D} h={ROOM_H} position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} tex={wallTex} />
      <Wall w={ROOM_D} h={ROOM_H} position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} tex={wallTex} />

      {/* LED edge strips along ceiling */}
      <LedStrip from={[-ROOM_W / 2, ROOM_H - 0.03, -ROOM_D / 2 + 0.02]} to={[ROOM_W / 2, ROOM_H - 0.03, -ROOM_D / 2 + 0.02]} />
      <LedStrip from={[-ROOM_W / 2, ROOM_H - 0.03, ROOM_D / 2 - 0.02]} to={[ROOM_W / 2, ROOM_H - 0.03, ROOM_D / 2 - 0.02]} />
      <LedStrip from={[-ROOM_W / 2 + 0.02, ROOM_H - 0.03, -ROOM_D / 2]} to={[-ROOM_W / 2 + 0.02, ROOM_H - 0.03, ROOM_D / 2]} />
      <LedStrip from={[ROOM_W / 2 - 0.02, ROOM_H - 0.03, -ROOM_D / 2]} to={[ROOM_W / 2 - 0.02, ROOM_H - 0.03, ROOM_D / 2]} />

      {/* Floor LED strips (cool blue accent) */}
      <LedStrip from={[-ROOM_W / 2, 0.03, -ROOM_D / 2 + 0.02]} to={[ROOM_W / 2, 0.03, -ROOM_D / 2 + 0.02]} accent />
      <LedStrip from={[-ROOM_W / 2, 0.03, ROOM_D / 2 - 0.02]} to={[ROOM_W / 2, 0.03, ROOM_D / 2 - 0.02]} accent />
      <LedStrip from={[-ROOM_W / 2 + 0.02, 0.03, -ROOM_D / 2]} to={[-ROOM_W / 2 + 0.02, 0.03, ROOM_D / 2]} accent />
      <LedStrip from={[ROOM_W / 2 - 0.02, 0.03, -ROOM_D / 2]} to={[ROOM_W / 2 - 0.02, 0.03, ROOM_D / 2]} accent />

      {/* Bright ceiling fills */}
      <pointLight position={[-ROOM_W / 4, ROOM_H - 0.3, -ROOM_D / 4]} intensity={0.6} distance={11} color="#ffffff" />
      <pointLight position={[ROOM_W / 4, ROOM_H - 0.3, -ROOM_D / 4]} intensity={0.6} distance={11} color="#ffffff" />
      <pointLight position={[-ROOM_W / 4, ROOM_H - 0.3, ROOM_D / 4]} intensity={0.6} distance={11} color="#ffffff" />
      <pointLight position={[ROOM_W / 4, ROOM_H - 0.3, ROOM_D / 4]} intensity={0.6} distance={11} color="#ffffff" />
    </group>
  );
}

function Wall({
  w,
  h,
  position,
  rotation,
  tex,
}: {
  w: number;
  h: number;
  position: [number, number, number];
  rotation: [number, number, number];
  tex: THREE.Texture;
}) {
  const mapped = useMemo(
    () => cloneRepeat(tex, w / WALL_PANEL_M, h / WALL_PANEL_M),
    [tex, w, h],
  );
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={mapped}
        color="#ffffff"
        roughness={0.9}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function LedStrip({
  from,
  to,
  accent = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  accent?: boolean;
}) {
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

// ─── Paintings ─────────────────────────────────────────────────────────────

function Paintings({
  paintings,
  hovered,
  onHover,
}: {
  paintings: Product[];
  hovered: Product | null;
  onHover: (p: Product | null) => void;
}) {
  const slots = useMemo(() => buildSlots(paintings.length), [paintings.length]);
  return (
    <>
      {paintings.map((p, i) => (
        <Painting
          key={p.id}
          product={p}
          slot={slots[i % slots.length]}
          isHovered={hovered?.id === p.id}
          onHover={onHover}
        />
      ))}
    </>
  );
}

type Slot = {
  position: [number, number, number];
  rotation: [number, number, number];
};

function buildSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  const offWall = 0.02;
  const back = 4, front = 4, left = 2, right = 2;
  for (let i = 0; i < back; i++) {
    slots.push({
      position: [((i + 0.5) / back - 0.5) * (ROOM_W - 1.5), PAINTING_CENTER_Y, -ROOM_D / 2 + offWall],
      rotation: [0, 0, 0],
    });
  }
  for (let i = 0; i < front; i++) {
    slots.push({
      position: [((i + 0.5) / front - 0.5) * (ROOM_W - 1.5), PAINTING_CENTER_Y, ROOM_D / 2 - offWall],
      rotation: [0, Math.PI, 0],
    });
  }
  for (let i = 0; i < left; i++) {
    slots.push({
      position: [-ROOM_W / 2 + offWall, PAINTING_CENTER_Y, ((i + 0.5) / left - 0.5) * (ROOM_D - 1.5)],
      rotation: [0, Math.PI / 2, 0],
    });
  }
  for (let i = 0; i < right; i++) {
    slots.push({
      position: [ROOM_W / 2 - offWall, PAINTING_CENTER_Y, ((i + 0.5) / right - 0.5) * (ROOM_D - 1.5)],
      rotation: [0, -Math.PI / 2, 0],
    });
  }
  return slots.slice(0, count);
}

function Painting({
  product,
  slot,
  isHovered,
  onHover,
}: {
  product: Product;
  slot: Slot;
  isHovered: boolean;
  onHover: (p: Product | null) => void;
}) {
  const router = useRouter();
  const texture = useLoader(THREE.TextureLoader, product.imagePath);
  const groupRef = useRef<THREE.Group>(null);

  const w =
    product.width && product.height ? product.width / 100 : PAINTING_DEFAULT_W;
  const h =
    product.width && product.height ? product.height / 100 : PAINTING_DEFAULT_H;

  // Animate slight forward push + scale on hover
  useFrame(() => {
    if (!groupRef.current) return;
    const target = isHovered ? 1.04 : 1.0;
    groupRef.current.scale.x += (target - groupRef.current.scale.x) * 0.15;
    groupRef.current.scale.y += (target - groupRef.current.scale.y) * 0.15;
  });

  return (
    <group ref={groupRef} position={slot.position} rotation={slot.rotation}>
      {/* Glow ring (visible when hovered) */}
      <mesh position={[0, 0, -0.008]}>
        <planeGeometry args={[w + 0.12, h + 0.12]} />
        <meshBasicMaterial
          color={isHovered ? '#ffffff' : '#dde2e6'}
          transparent
          opacity={isHovered ? 1 : 0.0}
          toneMapped={false}
        />
      </mesh>
      {/* Subtle dark mat (always visible) */}
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[w + 0.05, h + 0.05]} />
        <meshBasicMaterial color="#0a0a0a" toneMapped={false} />
      </mesh>
      {/* Painting plane */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/werk/${product.slug}`);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(product);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      {/* Spotlight on painting */}
      <pointLight position={[0, h / 2 + 0.25, 0.4]} intensity={0.4} distance={2.2} color="#fff5e8" />
    </group>
  );
}

// ─── Movement & touch input ────────────────────────────────────────────────

function Movement({
  entered,
  isTouch,
  touchRefs,
}: {
  entered: boolean;
  isTouch: boolean;
  touchRefs: TouchRefs;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

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

    // Touch look
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

    velocity.current.set(0, 0, 0);
    velocity.current.addScaledVector(forward.current, fwd);
    velocity.current.addScaledVector(right.current, strafe);
    if (velocity.current.lengthSq() > 0) {
      const mag = Math.min(1, velocity.current.length());
      velocity.current.normalize().multiplyScalar(SPEED * delta * mag);
      camera.position.add(velocity.current);
    }

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -ROOM_W / 2 + WALL_INSET, ROOM_W / 2 - WALL_INSET);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -ROOM_D / 2 + WALL_INSET, ROOM_D / 2 - WALL_INSET);
    camera.position.y = EYE;
  });

  return null;
}

// ─── Touch UI ──────────────────────────────────────────────────────────────

function TouchControlsUI({ touchRefs }: { touchRefs: TouchRefs }) {
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
          moveTouchId.current = t.identifier;
          e.preventDefault();
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
          let dx = t.clientX - cx;
          let dy = t.clientY - cy;
          const len = Math.hypot(dx, dy);
          if (len > r) {
            dx = (dx / len) * r;
            dy = (dy / len) * r;
          }
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
      <div
        ref={lookRef}
        className="fixed top-0 right-0 bottom-0 w-1/2 z-30 touch-none"
        style={{ touchAction: 'none' }}
      />
      <div
        ref={joyRef}
        className="fixed bottom-8 left-8 z-40 w-32 h-32 bg-white/15 border-2 border-white/60 backdrop-blur-sm touch-none flex items-center justify-center"
        style={{ touchAction: 'none', borderRadius: '50%' }}
      >
        <div
          ref={knobRef}
          className="w-14 h-14 bg-white/80 pointer-events-none"
          style={{ borderRadius: '50%' }}
        />
      </div>
      <div className="pointer-events-none fixed bottom-44 left-8 z-40 text-white text-[10px] uppercase tracking-widest opacity-70 mix-blend-difference">
        ← Bewegen
      </div>
      <div className="pointer-events-none fixed top-1/2 right-8 z-40 text-white text-[10px] uppercase tracking-widest opacity-70 mix-blend-difference">
        Ziehen → Umsehen
      </div>
    </>
  );
}

// ─── Procedural textures ───────────────────────────────────────────────────

function makePanelTexture() {
  if (typeof document === 'undefined') return new THREE.Texture();
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  // Very light off-white concrete gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#f0f2f4');
  grad.addColorStop(1, '#e2e6ea');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Single panel seam at edges (so each tile = one big panel)
  ctx.strokeStyle = '#b5bbc1';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);
  // Inner thin highlight
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(3, 3, size - 6, size - 6);
  // Very subtle concrete speckle
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
  // Light polished concrete floor
  const grad = ctx.createRadialGradient(size / 2, size / 2, 30, size / 2, size / 2, size * 0.7);
  grad.addColorStop(0, '#c8cdd2');
  grad.addColorStop(1, '#a8aeb5');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // Tile seam
  ctx.strokeStyle = '#7a8088';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  // Faint speckle
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
