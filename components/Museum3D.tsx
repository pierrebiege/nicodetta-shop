'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';

// Room dimensions in metres
const ROOM_W = 22; // x
const ROOM_D = 14; // z
const ROOM_H = 3.0; // y — exactly 3 m as requested
const EYE = 1.65;
const WALL_INSET = 0.6;
const SPEED = 5.0; // Minecraft-ish walk speed (m/s)
const PAINTING_CENTER_Y = 1.55; // centre of every painting
const PAINTING_DEFAULT_W = 0.8; // metres
const PAINTING_DEFAULT_H = 1.0;

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
  const controlsRef = useRef<any>(null);

  // Touch input shared between UI and three.js render loop
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

  function enter() {
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
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#aab3bd']} />
        <fog attach="fog" args={['#aab3bd', 14, 36]} />

        {/* Cool ambient + sky/floor hemispheric light for that clean Portal look */}
        <ambientLight intensity={0.45} color="#e8eef5" />
        <hemisphereLight args={['#e8eef5', '#3a3f46', 0.6]} />
        {/* Big overhead key light */}
        <directionalLight
          position={[6, 8, 4]}
          intensity={0.9}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Suspense fallback={null}>
          <Room />
          <Paintings paintings={paintings} onHover={setHovered} />
          <Movement
            entered={entered || (!isTouch && controlsRef.current?.isLocked)}
            isTouch={isTouch}
            touchRefs={touchRefs}
            controlsRef={controlsRef}
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

      {/* Desktop: centre crosshair */}
      {entered && !isTouch && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-white mix-blend-difference" />
        </div>
      )}

      {/* Hover / aim plaque */}
      {entered && hovered && (
        <div className="pointer-events-none fixed bottom-24 md:bottom-20 left-1/2 -translate-x-1/2 z-30 text-white text-center px-6">
          <div className="font-display font-black uppercase text-2xl tracking-tight drop-shadow-lg">
            {hovered.title}
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-90 mt-1 drop-shadow">
            {hovered.year} {hovered.technique ? `· ${hovered.technique}` : ''}
            {hovered.width && hovered.height
              ? ` · ${hovered.width}×${hovered.height} cm`
              : ''}{' '}
            · {formatCHF(hovered.priceRappen)}
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-60 mt-2 drop-shadow">
            {isTouch ? 'Antippen zum Öffnen' : 'Klick zum Öffnen'}
          </div>
        </div>
      )}

      {/* Entry overlay */}
      {!entered && (
        <button
          onClick={enter}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white backdrop-blur-sm cursor-pointer"
        >
          <div className="font-display font-black uppercase text-[clamp(3rem,8vw,7rem)] leading-[0.85] tracking-tight">
            Eintreten
          </div>
          <div className="mt-8 text-xs uppercase tracking-widest opacity-70 max-w-md text-center leading-relaxed">
            {isTouch ? (
              <>
                Tippen um den Raum zu betreten.
                <br />
                Joystick links = Bewegen · Rechte Seite ziehen = Umsehen
                <br />
                Auf Werk tippen = Detail · X oben rechts = Verlassen
              </>
            ) : (
              <>
                Klick um den Raum zu betreten.
                <br />
                Maus = Umsehen · WASD oder Pfeiltasten = Bewegen · Esc = Verlassen
                <br />
                Klick auf ein Werk = Detail
              </>
            )}
          </div>
        </button>
      )}

      {/* Mobile exit */}
      {entered && isTouch && (
        <button
          onClick={exit}
          className="fixed top-4 right-4 z-40 w-12 h-12 bg-black/70 text-white text-xl font-bold backdrop-blur-sm flex items-center justify-center"
          aria-label="Verlassen"
        >
          ✕
        </button>
      )}

      {/* Mobile touch controls */}
      {entered && isTouch && <TouchControlsUI touchRefs={touchRefs} />}

      {/* Bottom HUD */}
      {entered && !isTouch && (
        <div className="pointer-events-none fixed bottom-5 left-6 z-30 text-white text-[10px] uppercase tracking-widest opacity-70 mix-blend-difference">
          WASD · Maus · Esc
        </div>
      )}
    </>
  );
}

// ─── Geometry ──────────────────────────────────────────────────────────────

function Room() {
  const wallTex = useMemo(() => makePanelTexture('#c2c8cf', '#8a8f96', 4), []);
  const floorTex = useMemo(() => makeTileTexture('#3a3e44', '#2a2d31'), []);
  const ceilTex = useMemo(() => makePanelTexture('#b4babf', '#80848a', 2), []);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(floorTex, ROOM_W, ROOM_D)}
          color="#4a4e54"
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial
          map={cloneRepeat(ceilTex, ROOM_W / 2, ROOM_D / 2)}
          color="#cdd2d8"
          roughness={0.9}
        />
      </mesh>

      {/* 4 walls */}
      <Wall w={ROOM_W} h={ROOM_H} position={[0, ROOM_H / 2, -ROOM_D / 2]} rotation={[0, 0, 0]} tex={wallTex} />
      <Wall w={ROOM_W} h={ROOM_H} position={[0, ROOM_H / 2, ROOM_D / 2]} rotation={[0, Math.PI, 0]} tex={wallTex} />
      <Wall w={ROOM_D} h={ROOM_H} position={[-ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} tex={wallTex} />
      <Wall w={ROOM_D} h={ROOM_H} position={[ROOM_W / 2, ROOM_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} tex={wallTex} />

      {/* LED edge strips along wall-ceiling and wall-floor */}
      <LedStrip from={[-ROOM_W / 2, ROOM_H - 0.04, -ROOM_D / 2 + 0.02]} to={[ROOM_W / 2, ROOM_H - 0.04, -ROOM_D / 2 + 0.02]} />
      <LedStrip from={[-ROOM_W / 2, ROOM_H - 0.04, ROOM_D / 2 - 0.02]} to={[ROOM_W / 2, ROOM_H - 0.04, ROOM_D / 2 - 0.02]} />
      <LedStrip from={[-ROOM_W / 2 + 0.02, ROOM_H - 0.04, -ROOM_D / 2]} to={[-ROOM_W / 2 + 0.02, ROOM_H - 0.04, ROOM_D / 2]} />
      <LedStrip from={[ROOM_W / 2 - 0.02, ROOM_H - 0.04, -ROOM_D / 2]} to={[ROOM_W / 2 - 0.02, ROOM_H - 0.04, ROOM_D / 2]} />

      {/* Floor edge LED for that Portal/Mirror's Edge glow */}
      <LedStrip from={[-ROOM_W / 2, 0.04, -ROOM_D / 2 + 0.02]} to={[ROOM_W / 2, 0.04, -ROOM_D / 2 + 0.02]} dim />
      <LedStrip from={[-ROOM_W / 2, 0.04, ROOM_D / 2 - 0.02]} to={[ROOM_W / 2, 0.04, ROOM_D / 2 - 0.02]} dim />
      <LedStrip from={[-ROOM_W / 2 + 0.02, 0.04, -ROOM_D / 2]} to={[-ROOM_W / 2 + 0.02, 0.04, ROOM_D / 2]} dim />
      <LedStrip from={[ROOM_W / 2 - 0.02, 0.04, -ROOM_D / 2]} to={[ROOM_W / 2 - 0.02, 0.04, ROOM_D / 2]} dim />

      {/* A few ceiling point lights for that brutalist gallery glow */}
      <pointLight position={[-ROOM_W / 4, ROOM_H - 0.3, -ROOM_D / 4]} intensity={0.5} distance={9} color="#f2f6fa" />
      <pointLight position={[ROOM_W / 4, ROOM_H - 0.3, -ROOM_D / 4]} intensity={0.5} distance={9} color="#f2f6fa" />
      <pointLight position={[-ROOM_W / 4, ROOM_H - 0.3, ROOM_D / 4]} intensity={0.5} distance={9} color="#f2f6fa" />
      <pointLight position={[ROOM_W / 4, ROOM_H - 0.3, ROOM_D / 4]} intensity={0.5} distance={9} color="#f2f6fa" />
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
  const mapped = useMemo(() => cloneRepeat(tex, w / 2, h / 2), [tex, w, h]);
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial
        map={mapped}
        color="#c8ced5"
        roughness={0.85}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

function LedStrip({
  from,
  to,
  dim = false,
}: {
  from: [number, number, number];
  to: [number, number, number];
  dim?: boolean;
}) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const length = start.distanceTo(end);
  const mid = start.clone().lerp(end, 0.5);
  const axis = new THREE.Vector3().subVectors(end, start).normalize();
  // Determine orientation: if x-axis aligned, default orientation works;
  // if z-axis aligned, rotate around Y by 90°
  const yRot = Math.abs(axis.z) > 0.5 ? Math.PI / 2 : 0;
  return (
    <mesh position={[mid.x, mid.y, mid.z]} rotation={[0, yRot, 0]}>
      <boxGeometry args={[length, 0.04, 0.03]} />
      <meshBasicMaterial color={dim ? '#7eb2ff' : '#ffffff'} toneMapped={false} />
    </mesh>
  );
}

// ─── Paintings ─────────────────────────────────────────────────────────────

function Paintings({
  paintings,
  onHover,
}: {
  paintings: Product[];
  onHover: (p: Product | null) => void;
}) {
  // Distribute paintings: 4 back, 4 front, 2 left, 2 right (= 12)
  const slots = useMemo(() => buildSlots(paintings.length), [paintings.length]);

  return (
    <>
      {paintings.map((p, i) => (
        <Painting key={p.id} product={p} slot={slots[i % slots.length]} onHover={onHover} />
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
  const backCount = 4;
  for (let i = 0; i < backCount; i++) {
    const x = ((i + 0.5) / backCount - 0.5) * (ROOM_W - 1.5);
    slots.push({
      position: [x, PAINTING_CENTER_Y, -ROOM_D / 2 + offWall],
      rotation: [0, 0, 0],
    });
  }
  const frontCount = 4;
  for (let i = 0; i < frontCount; i++) {
    const x = ((i + 0.5) / frontCount - 0.5) * (ROOM_W - 1.5);
    slots.push({
      position: [x, PAINTING_CENTER_Y, ROOM_D / 2 - offWall],
      rotation: [0, Math.PI, 0],
    });
  }
  const leftCount = 2;
  for (let i = 0; i < leftCount; i++) {
    const z = ((i + 0.5) / leftCount - 0.5) * (ROOM_D - 1.5);
    slots.push({
      position: [-ROOM_W / 2 + offWall, PAINTING_CENTER_Y, z],
      rotation: [0, Math.PI / 2, 0],
    });
  }
  const rightCount = 2;
  for (let i = 0; i < rightCount; i++) {
    const z = ((i + 0.5) / rightCount - 0.5) * (ROOM_D - 1.5);
    slots.push({
      position: [ROOM_W / 2 - offWall, PAINTING_CENTER_Y, z],
      rotation: [0, -Math.PI / 2, 0],
    });
  }
  return slots.slice(0, count);
}

function Painting({
  product,
  slot,
  onHover,
}: {
  product: Product;
  slot: Slot;
  onHover: (p: Product | null) => void;
}) {
  const router = useRouter();
  const texture = useLoader(THREE.TextureLoader, product.imagePath);

  // Real size in metres — width/height are cm in DB
  const w =
    product.width && product.height
      ? product.width / 100
      : PAINTING_DEFAULT_W;
  const h =
    product.width && product.height
      ? product.height / 100
      : PAINTING_DEFAULT_H;

  return (
    <group position={slot.position} rotation={slot.rotation}>
      {/* Painting plane (no heavy frame — clean Portal feel) */}
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
      {/* Tiny dedicated spotlight from above the painting */}
      <pointLight
        position={[0, h / 2 + 0.25, 0.4]}
        intensity={0.35}
        distance={2.2}
        color="#fff5e8"
      />
    </group>
  );
}

// ─── Movement & touch input ────────────────────────────────────────────────

function Movement({
  entered,
  isTouch,
  touchRefs,
  controlsRef,
}: {
  entered: boolean;
  isTouch: boolean;
  touchRefs: TouchRefs;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useEffect(() => {
    if (isTouch) return;
    const kd = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const ku = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [isTouch]);

  useFrame((_, delta) => {
    if (!entered) return;

    // Touch look: apply yaw + pitch deltas to camera euler
    if (isTouch && (touchRefs.lookX.current !== 0 || touchRefs.lookY.current !== 0)) {
      euler.current.setFromQuaternion(camera.quaternion);
      const sensitivity = 0.0028;
      euler.current.y -= touchRefs.lookX.current * sensitivity;
      euler.current.x -= touchRefs.lookY.current * sensitivity;
      euler.current.x = THREE.MathUtils.clamp(
        euler.current.x,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05,
      );
      camera.quaternion.setFromEuler(euler.current);
      touchRefs.lookX.current = 0;
      touchRefs.lookY.current = 0;
    }

    // Movement inputs (keyboard OR joystick)
    let fwd = 0;
    let strafe = 0;
    if (isTouch) {
      fwd = -touchRefs.moveY.current; // up on joystick = forward
      strafe = touchRefs.moveX.current;
    } else {
      const k = keys.current;
      fwd =
        (k['KeyW'] || k['ArrowUp'] ? 1 : 0) -
        (k['KeyS'] || k['ArrowDown'] ? 1 : 0);
      strafe =
        (k['KeyD'] || k['ArrowRight'] ? 1 : 0) -
        (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);
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

    // Clamp
    camera.position.x = THREE.MathUtils.clamp(
      camera.position.x,
      -ROOM_W / 2 + WALL_INSET,
      ROOM_W / 2 - WALL_INSET,
    );
    camera.position.z = THREE.MathUtils.clamp(
      camera.position.z,
      -ROOM_D / 2 + WALL_INSET,
      ROOM_D / 2 - WALL_INSET,
    );
    camera.position.y = EYE;
  });

  return null;
}

// ─── Touch UI (joystick + look pad) ────────────────────────────────────────

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
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    }
    function resetKnob() {
      setKnob(0, 0);
    }

    function onTouchStart(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        const targetEl = document.elementFromPoint(t.clientX, t.clientY);
        if (joy.contains(targetEl) && moveTouchId.current === null) {
          moveTouchId.current = t.identifier;
          e.preventDefault();
        } else if (look.contains(targetEl) && lookTouchId.current === null) {
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
          const max = r;
          if (len > max) {
            dx = (dx / len) * max;
            dy = (dy / len) * max;
          }
          setKnob(dx, dy);
          touchRefs.moveX.current = dx / max;
          touchRefs.moveY.current = dy / max;
          e.preventDefault();
        } else if (t.identifier === lookTouchId.current && lookLast.current) {
          const dx = t.clientX - lookLast.current.x;
          const dy = t.clientY - lookLast.current.y;
          touchRefs.lookX.current += dx;
          touchRefs.lookY.current += dy;
          lookLast.current = { x: t.clientX, y: t.clientY };
          e.preventDefault();
        }
      }
    }

    function onTouchEnd(e: TouchEvent) {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === moveTouchId.current) {
          moveTouchId.current = null;
          resetKnob();
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
      {/* Right-half look pad — invisible catcher */}
      <div
        ref={lookRef}
        className="fixed top-0 right-0 bottom-0 w-1/2 z-30 touch-none"
        style={{ touchAction: 'none' }}
      />
      {/* Left joystick */}
      <div
        ref={joyRef}
        className="fixed bottom-8 left-8 z-40 w-32 h-32 rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-sm touch-none flex items-center justify-center"
        style={{ touchAction: 'none', borderRadius: '50%' }}
      >
        <div
          ref={knobRef}
          className="w-14 h-14 bg-white/70 rounded-full pointer-events-none"
          style={{ borderRadius: '50%' }}
        />
      </div>
    </>
  );
}

// ─── Procedural textures ───────────────────────────────────────────────────

function makePanelTexture(base: string, line: string, panel: number) {
  if (typeof document === 'undefined') return new THREE.Texture();
  const size = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  // Subtle horizontal & vertical grout
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  const step = size / panel;
  for (let i = 1; i < panel; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }
  // Speckle noise for concrete feel
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = `rgba(${rand(80, 180)},${rand(80, 180)},${rand(80, 180)},${(Math.random() * 0.06).toFixed(3)})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeTileTexture(base: string, line: string) {
  if (typeof document === 'undefined') return new THREE.Texture();
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = line;
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, size, size);
  // Subtle speckle
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = `rgba(${rand(40, 80)},${rand(40, 80)},${rand(40, 80)},${(Math.random() * 0.08).toFixed(3)})`;
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

function rand(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min));
}
