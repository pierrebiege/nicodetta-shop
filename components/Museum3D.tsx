'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import type { Product } from '@/db/schema';
import { formatCHF } from '@/lib/format';

// Room dimensions (metres)
const ROOM_W = 28; // x
const ROOM_D = 18; // z
const ROOM_H = 4.2; // y
const EYE = 1.65;
const WALL_INSET = 1.0; // keep camera this far from walls
const SPEED = 4.5; // m/s

export function Museum3D({ paintings }: { paintings: Product[] }) {
  const [locked, setLocked] = useState(false);
  const [hovered, setHovered] = useState<Product | null>(null);
  const controlsRef = useRef<PointerLockControlsImpl | null>(null);

  return (
    <>
      <Canvas
        shadows
        camera={{ fov: 70, near: 0.05, far: 100, position: [0, EYE, ROOM_D / 2 - 2] }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 12, 38]} />

        <ambientLight intensity={0.35} />
        <directionalLight position={[8, 8, 4]} intensity={0.7} castShadow />
        <pointLight position={[0, ROOM_H - 0.5, 0]} intensity={0.6} color="#fff5e8" />

        <Suspense fallback={null}>
          <Room />
          <Paintings paintings={paintings} onHover={setHovered} />
          <Movement locked={locked} />
        </Suspense>

        <PointerLockControls
          ref={controlsRef}
          onLock={() => setLocked(true)}
          onUnlock={() => setLocked(false)}
        />
      </Canvas>

      {/* Crosshair */}
      {locked && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-paper rounded-full mix-blend-difference" />
        </div>
      )}

      {/* Hover label */}
      {locked && hovered && (
        <div className="pointer-events-none fixed bottom-20 left-1/2 -translate-x-1/2 z-30 text-paper text-center">
          <div className="font-display font-black uppercase text-2xl tracking-tight">
            {hovered.title}
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
            {hovered.year} {hovered.technique ? `· ${hovered.technique}` : ''} ·{' '}
            {formatCHF(hovered.priceRappen)}
          </div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mt-2">
            Klick zum Öffnen
          </div>
        </div>
      )}

      {/* Entry overlay */}
      {!locked && (
        <button
          onClick={() => controlsRef.current?.lock()}
          className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-ink/80 text-paper backdrop-blur-sm cursor-pointer"
        >
          <div className="font-display font-black uppercase text-[clamp(3rem,8vw,7rem)] leading-[0.85] tracking-tight">
            Eintreten
          </div>
          <div className="mt-8 text-xs uppercase tracking-widest opacity-60 max-w-md text-center leading-relaxed">
            Klick um den Raum zu betreten.
            <br />
            Maus = Umsehen · WASD oder Pfeiltasten = Bewegen · Esc = Verlassen
            <br />
            Klick auf ein Werk = Detail
          </div>
        </button>
      )}

      {/* Bottom HUD */}
      {locked && (
        <div className="pointer-events-none fixed bottom-5 left-6 z-30 text-paper text-[10px] uppercase tracking-widest opacity-60 mix-blend-difference">
          WASD · Maus · Esc
        </div>
      )}
    </>
  );
}

function Room() {
  // Floor — slightly textured grey
  // Ceiling — dark
  // Walls — gallery off-white
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM_H, 0]}>
        <planeGeometry args={[ROOM_W, ROOM_D]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Back wall */}
      <Wall w={ROOM_W} h={ROOM_H} position={[0, ROOM_H / 2, -ROOM_D / 2]} rotation={[0, 0, 0]} />
      {/* Front wall */}
      <Wall
        w={ROOM_W}
        h={ROOM_H}
        position={[0, ROOM_H / 2, ROOM_D / 2]}
        rotation={[0, Math.PI, 0]}
      />
      {/* Left wall */}
      <Wall
        w={ROOM_D}
        h={ROOM_H}
        position={[-ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
      />
      {/* Right wall */}
      <Wall
        w={ROOM_D}
        h={ROOM_H}
        position={[ROOM_W / 2, ROOM_H / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
      />

      {/* Skirting strip along floor for depth */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 8, 64]} />
        <meshStandardMaterial color="#222" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Wall({
  w,
  h,
  position,
  rotation,
}: {
  w: number;
  h: number;
  position: [number, number, number];
  rotation: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial color="#f0eee8" roughness={0.95} side={THREE.FrontSide} />
    </mesh>
  );
}

function Paintings({
  paintings,
  onHover,
}: {
  paintings: Product[];
  onHover: (p: Product | null) => void;
}) {
  // Distribute 12 paintings around the 4 walls.
  // Long walls (back/front, x-axis): 4 each = 8
  // Short walls (left/right, z-axis): 2 each = 4
  const positions = buildPaintingSlots(paintings.length);

  return (
    <>
      {paintings.map((p, i) => {
        const slot = positions[i % positions.length];
        return (
          <Painting key={p.id} product={p} slot={slot} onHover={onHover} />
        );
      })}
    </>
  );
}

type Slot = {
  position: [number, number, number];
  rotation: [number, number, number];
  width: number;
  height: number;
};

function buildPaintingSlots(count: number): Slot[] {
  const slots: Slot[] = [];
  const wallY = 1.75;
  const margin = 0.05; // off the wall to avoid z-fighting

  // Back wall (z = -ROOM_D/2 + margin), faces +z
  const backCount = 4;
  for (let i = 0; i < backCount; i++) {
    const x = ((i + 0.5) / backCount - 0.5) * (ROOM_W - 2);
    slots.push({
      position: [x, wallY, -ROOM_D / 2 + margin],
      rotation: [0, 0, 0],
      width: 2.4,
      height: 1.7,
    });
  }
  // Front wall (z = ROOM_D/2 - margin), faces -z
  const frontCount = 4;
  for (let i = 0; i < frontCount; i++) {
    const x = ((i + 0.5) / frontCount - 0.5) * (ROOM_W - 2);
    slots.push({
      position: [x, wallY, ROOM_D / 2 - margin],
      rotation: [0, Math.PI, 0],
      width: 2.4,
      height: 1.7,
    });
  }
  // Left wall (x = -ROOM_W/2 + margin), faces +x
  const leftCount = 2;
  for (let i = 0; i < leftCount; i++) {
    const z = ((i + 0.5) / leftCount - 0.5) * (ROOM_D - 2);
    slots.push({
      position: [-ROOM_W / 2 + margin, wallY, z],
      rotation: [0, Math.PI / 2, 0],
      width: 2.8,
      height: 2.0,
    });
  }
  // Right wall (x = ROOM_W/2 - margin), faces -x
  const rightCount = 2;
  for (let i = 0; i < rightCount; i++) {
    const z = ((i + 0.5) / rightCount - 0.5) * (ROOM_D - 2);
    slots.push({
      position: [ROOM_W / 2 - margin, wallY, z],
      rotation: [0, -Math.PI / 2, 0],
      width: 2.8,
      height: 2.0,
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

  // Maintain aspect ratio of the actual image — fit inside slot box
  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : slot.width / slot.height;
  const slotAspect = slot.width / slot.height;
  let w = slot.width;
  let h = slot.height;
  if (aspect > slotAspect) {
    h = slot.width / aspect;
  } else {
    w = slot.height * aspect;
  }

  return (
    <group position={slot.position} rotation={slot.rotation}>
      {/* Frame */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.4} />
      </mesh>
      {/* Painting plane (interactive) */}
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
      {/* Tiny spotlight from above each painting */}
      <pointLight position={[0, h / 2 + 0.6, 0.6]} intensity={0.4} distance={3} color="#fff5e8" />
      {/* Plaque under painting */}
      <Plaque title={product.title} y={-h / 2 - 0.25} />
    </group>
  );
}

function Plaque({ title, y }: { title: string; y: number }) {
  return (
    <mesh position={[0, y, 0]}>
      <planeGeometry args={[0.4, 0.06]} />
      <meshStandardMaterial color="#1a1a1a" />
    </mesh>
  );
}

function Movement({ locked }: { locked: boolean }) {
  const { camera } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const velocity = useRef(new THREE.Vector3());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    function onKey(e: KeyboardEvent, down: boolean) {
      keys.current[e.code] = down;
    }
    const kd = (e: KeyboardEvent) => onKey(e, true);
    const ku = (e: KeyboardEvent) => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, []);

  useFrame((_, delta) => {
    if (!locked) return;
    const k = keys.current;
    const fwd =
      (k['KeyW'] || k['ArrowUp'] ? 1 : 0) - (k['KeyS'] || k['ArrowDown'] ? 1 : 0);
    const strafe =
      (k['KeyD'] || k['ArrowRight'] ? 1 : 0) - (k['KeyA'] || k['ArrowLeft'] ? 1 : 0);

    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();
    right.current.crossVectors(forward.current, camera.up).normalize();

    velocity.current.set(0, 0, 0);
    velocity.current.addScaledVector(forward.current, fwd);
    velocity.current.addScaledVector(right.current, strafe);
    if (velocity.current.lengthSq() > 0) {
      velocity.current.normalize().multiplyScalar(SPEED * delta);
      camera.position.add(velocity.current);
    }

    // Clamp to room
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
