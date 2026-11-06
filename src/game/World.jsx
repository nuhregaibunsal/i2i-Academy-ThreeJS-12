import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Edges, Stars } from "@react-three/drei";
import {
  ACCELERATION, DESPAWN_Z, INVULNERABLE_TIME, LANE_LIMIT, MAX_MULTIPLIER,
  MAX_SPEED, PLAYER_Z, SPAWN_Z, START_SPEED, TRACK_HALF_WIDTH, difficulty
} from "./state.js";
import { sfx } from "./audio.js";
import { hurtPlayer, spawnWave, updateCombat } from "./combat.js";

const PINK = new THREE.Color("#ff3cac");
const CYAN = new THREE.Color("#22d3ee");
const GOLD = new THREE.Color("#fde047");
const ORANGE = new THREE.Color("#fb923c");
const TMP = new THREE.Color();
const EDGE_PINK = new THREE.Color(3.2, 0.7, 2.1);
const EDGE_CYAN = new THREE.Color(0.6, 2.6, 3.2);
const EDGE_WING = new THREE.Color(2.6, 0.5, 1.8);

const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);

/* ------------------------------------------------------------------ spawning */

function addObstacle(s, x, z, w, h, d = 1.2) {
  const o = s.obstacles.find((it) => !it.active);
  if (!o) return;
  Object.assign(o, { active: true, x, z, w, h, d });
}

function addOrb(s, x, z) {
  const o = s.orbs.find((it) => !it.active);
  if (!o) return;
  Object.assign(o, { active: true, x, z, spin: Math.random() * Math.PI });
}

/** Spawns one obstacle pattern at the far end of the track. Returns the gap until the next one. */
function spawnPattern(s) {
  const d = difficulty(s);
  const z = SPAWN_Z;
  const r = Math.random();
  let extra = 0;

  if (r < 0.28) {
    // a single tall pillar
    addObstacle(s, rand(-LANE_LIMIT, LANE_LIMIT), z, rand(1.1, 1.9), rand(1.6, 3.6));
  } else if (r < 0.5) {
    // two pillars with a lane between them
    const a = rand(-LANE_LIMIT, LANE_LIMIT);
    const b = THREE.MathUtils.clamp(a + (Math.random() < 0.5 ? -1 : 1) * rand(3.6, 5.2), -LANE_LIMIT, LANE_LIMIT);
    addObstacle(s, a, z, 1.3, rand(1.8, 3.2));
    addObstacle(s, b, z - rand(0, 3), 1.3, rand(1.8, 3.2));
  } else if (r < 0.76) {
    // a low wall with a single gap to thread through
    const gap = lerp(3.6, 2.7, d);
    const c = rand(-LANE_LIMIT + gap / 2, LANE_LIMIT - gap / 2);
    const leftW = c - gap / 2 + TRACK_HALF_WIDTH;
    const rightW = TRACK_HALF_WIDTH - (c + gap / 2);
    if (leftW > 0.2) addObstacle(s, -TRACK_HALF_WIDTH + leftW / 2, z, leftW, 1.1, 0.8);
    if (rightW > 0.2) addObstacle(s, TRACK_HALF_WIDTH - rightW / 2, z, rightW, 1.1, 0.8);
    // reward threading the needle
    addOrb(s, c, z);
  } else {
    // slalom: three pillars alternating sides
    const side = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      addObstacle(s, side * (i % 2 ? -1 : 1) * rand(1.6, 3.4), z - i * 8, 1.2, rand(2, 3.2));
    }
    extra = 16;
  }

  const gapDistance = lerp(26, 13, d) + extra;

  // the free band between this pattern and the next holds either an enemy wave or a crystal trail
  const freeCenter = z - extra - (gapDistance - extra) / 2;
  if (s.pendingWave && !s.boss.active) {
    spawnWave(s, freeCenter);
    s.pendingWave = false;
  } else if (Math.random() < 0.65) {
    const count = 4;
    const x0 = rand(-LANE_LIMIT + 1, LANE_LIMIT - 1);
    const wave = rand(-0.8, 0.8);
    const start = z - extra - gapDistance * 0.35;
    for (let i = 0; i < count; i++) {
      addOrb(s, THREE.MathUtils.clamp(x0 + wave * i, -LANE_LIMIT, LANE_LIMIT), start - i * 1.8);
    }
  }
  return gapDistance;
}

/* --------------------------------------------------------------- game loop */

/**
 * Advances the simulation: speed ramp, ship movement, spawning, collisions,
 * scoring and the camera. Everything else just renders the shared state.
 */
export function GameLoop({ state, phase, onHud, onGameOver }) {
  const { camera, size } = useThree();
  const hudTimer = useRef(0);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const s = state;
    const dt = Math.min(delta, 1 / 20);
    const playing = phase === "playing";

    if (phase === "paused") return;

    // --- speed
    if (playing) s.speed = Math.min(MAX_SPEED, s.speed + ACCELERATION * dt);
    else if (phase === "over") s.speed = Math.max(0, s.speed - 30 * dt);
    else s.speed = lerp(s.speed, START_SPEED * 0.6, dt * 2); // attract mode on the menu
    s.elapsed += dt;

    // --- ship movement (keyboard accelerates, touch/mouse steers to a point)
    const p = s.player;
    if (playing) {
      if (s.input.pointerX !== null) {
        const target = THREE.MathUtils.clamp(s.input.pointerX, -LANE_LIMIT, LANE_LIMIT);
        p.vx = (target - p.x) * 9;
      } else {
        const dir = (s.input.right ? 1 : 0) - (s.input.left ? 1 : 0);
        p.vx = lerp(p.vx, dir * lerp(11, 15, difficulty(s)), Math.min(1, dt * 9));
      }
    } else if (phase === "menu") {
      p.vx = (Math.sin(s.elapsed * 0.9) * 2.2 - p.x) * 2;
    } else {
      p.vx = lerp(p.vx, 0, dt * 4);
    }
    p.x = THREE.MathUtils.clamp(p.x + p.vx * dt, -LANE_LIMIT, LANE_LIMIT);

    // --- world scroll
    const move = s.speed * dt;
    s.distance += move;

    if (playing) {
      s.untilSpawn -= move;
      // the track stays clear while the boss is out
      if (s.untilSpawn <= 0) s.untilSpawn = s.boss.active ? 10 : spawnPattern(s);
      s.score += move * 0.5 * s.multiplier;
    }

    s.invulnerable = Math.max(0, s.invulnerable - dt);

    for (const o of s.obstacles) {
      if (!o.active) continue;
      o.z += move;
      if (o.z - o.d / 2 > DESPAWN_Z) {
        o.active = false;
        continue;
      }
      if (
        playing &&
        s.invulnerable <= 0 &&
        Math.abs(p.x - o.x) < o.w / 2 + 0.55 &&
        Math.abs(PLAYER_Z - o.z) < o.d / 2 + 0.7
      ) {
        hurtPlayer(s, onGameOver);
      }
    }

    for (const o of s.orbs) {
      if (!o.active) continue;
      o.z += move;
      if (o.z > DESPAWN_Z) {
        o.active = false;
        continue;
      }
      if (playing && Math.abs(p.x - o.x) < 1.0 && Math.abs(PLAYER_Z - o.z) < 1.1) {
        o.active = false;
        s.orbStreak += 1;
        s.multiplier = Math.min(MAX_MULTIPLIER, 1 + Math.floor(s.orbStreak / 5));
        s.score += 25 * s.multiplier;
        s.events.push({ type: "pickup", x: o.x, z: o.z });
        sfx.pickup(s.multiplier);
      }
    }

    updateCombat(s, dt, move, playing, onGameOver);

    // --- camera: follows the ship, widens with speed, shakes on hits
    const d = difficulty(s);
    s.shake = Math.max(0, s.shake - dt * 1.6);
    const sh = s.shake * s.shake;
    camera.position.set(
      p.x * 0.45 + (Math.random() - 0.5) * sh * 1.2,
      3.1 + (Math.random() - 0.5) * sh,
      PLAYER_Z + 6.8
    );
    look.set(p.x * 0.6, 1.0, PLAYER_Z - 12);
    camera.lookAt(look);
    camera.rotation.z += -p.vx * 0.004;
    // portrait screens get a wider lens so the whole track stays visible
    const aspect = size.width / size.height;
    const portraitBoost = aspect < 1 ? (1 - aspect) * 50 : 0;
    const fov = Math.min(100, 64 + portraitBoost + d * 14);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = lerp(camera.fov, fov, dt * 2);
      camera.updateProjectionMatrix();
    }

    // --- throttled HUD snapshot for React
    hudTimer.current -= dt;
    if (hudTimer.current <= 0) {
      hudTimer.current = 0.08;
      onHud({
        score: Math.floor(s.score),
        multiplier: s.multiplier,
        streak: s.orbStreak,
        lives: s.lives,
        speed: s.speed,
        progress: d,
        weapon: s.weapon.level,
        rapid: s.weapon.rapid,
        shield: s.weapon.shield,
        kills: s.kills,
        boss: s.boss.active ? s.boss.hp / s.boss.maxHp : null,
        toast: s.toast ? { text: s.toast.text, color: s.toast.color } : null
      });
    }
  });

  return null;
}

/* ------------------------------------------------------------------- ship */

export function Ship({ state, phase }) {
  const group = useRef();
  const light = useRef();

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const p = state.player;
    const visible = phase !== "over" || state.lives > 0;
    g.visible = visible && !(state.invulnerable > 0 && Math.floor(state.invulnerable * 14) % 2 === 0);
    g.position.set(p.x, 0.55 + Math.sin(state.elapsed * 3) * 0.06, PLAYER_Z);
    g.rotation.z = -p.vx * 0.045; // bank into turns
    g.rotation.y = -p.vx * 0.015;
    if (light.current) light.current.position.set(p.x, 1.4, PLAYER_Z + 0.5);
  });

  return (
    <>
      <group ref={group}>
        {/* hull */}
        <mesh rotation={[-Math.PI / 2, Math.PI / 4, 0]} scale={[1.15, 1, 0.5]}>
          <coneGeometry args={[0.6, 2, 4]} />
          <meshStandardMaterial color="#0b1020" metalness={0.7} roughness={0.25} emissive="#0e7490" emissiveIntensity={0.35} />
          <Edges color={EDGE_CYAN} lineWidth={1.6} toneMapped={false} />
        </mesh>
        {/* wings */}
        <mesh position={[0, -0.05, 0.45]}>
          <boxGeometry args={[2.2, 0.05, 0.55]} />
          <meshStandardMaterial color="#0b1020" metalness={0.6} roughness={0.3} />
          <Edges color={EDGE_WING} lineWidth={1.4} toneMapped={false} />
        </mesh>
        {/* engine */}
        <mesh position={[0, 0, 1.0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={[0.6, 2.6, 3.2]} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} color="#22d3ee" intensity={6} distance={7} />
    </>
  );
}

/* -------------------------------------------------------------- obstacles */

export function Obstacles({ state }) {
  const refs = useRef([]);
  useFrame(() => {
    state.obstacles.forEach((o, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.visible = o.active;
      if (!o.active) return;
      m.position.set(o.x, o.h / 2, o.z);
      m.scale.set(o.w, o.h, o.d);
    });
  });

  return state.obstacles.map((_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#14051f" emissive="#ff3cac" emissiveIntensity={0.18} metalness={0.4} roughness={0.5} />
      <Edges color={EDGE_PINK} lineWidth={2.2} toneMapped={false} />
    </mesh>
  ));
}

export function Orbs({ state }) {
  const refs = useRef([]);
  useFrame((_, delta) => {
    state.orbs.forEach((o, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.visible = o.active;
      if (!o.active) return;
      o.spin += delta * 3;
      m.position.set(o.x, 0.9 + Math.sin(o.spin * 1.3) * 0.15, o.z);
      m.rotation.set(0, o.spin, o.spin * 0.5);
    });
  });

  return state.orbs.map((_, i) => (
    <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false}>
      <octahedronGeometry args={[0.36, 0]} />
      <meshBasicMaterial color={[2.8, 2.3, 0.5]} toneMapped={false} />
    </mesh>
  ));
}

/* -------------------------------------------------------------- particles */

const PARTICLES = 220;

export function Particles({ state, phase }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pool = useMemo(
    () => Array.from({ length: PARTICLES }, () => ({
      life: 0, max: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, size: 0.1, color: new THREE.Color()
    })),
    []
  );
  const cursor = useRef(0);

  const emit = (x, y, z, vx, vy, vz, life, size, color) => {
    const p = pool[cursor.current];
    cursor.current = (cursor.current + 1) % PARTICLES;
    Object.assign(p, { x, y, z, vx, vy, vz, life, max: life, size });
    p.color.copy(color);
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const s = state;
    if (phase === "paused") return;

    // engine exhaust
    if (phase !== "over" || s.lives > 0) {
      for (let i = 0; i < 2; i++) {
        emit(
          s.player.x + rand(-0.12, 0.12), 0.55 + rand(-0.08, 0.08), PLAYER_Z + 1.1,
          rand(-0.3, 0.3), rand(-0.2, 0.2), s.speed * 0.35 + rand(2, 5),
          rand(0.25, 0.45), rand(0.08, 0.16), Math.random() < 0.8 ? CYAN : PINK
        );
      }
    }

    // one-shot effects
    for (const e of s.events) {
      if (e.type === "pickup") {
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * Math.PI * 2;
          emit(e.x, 0.9, e.z, Math.cos(a) * 4, Math.sin(a) * 4, s.speed * 0.5, 0.4, 0.09, GOLD);
        }
      } else if (e.type === "burst") {
        TMP.set(e.color);
        TMP.r *= 2.6; TMP.g *= 2.6; TMP.b *= 2.6;
        for (let i = 0; i < e.n; i++) {
          const a = Math.random() * Math.PI * 2;
          const el = rand(-0.6, 1);
          const sp = rand(0.4, 1) * e.speed;
          emit(e.x, e.y, e.z, Math.cos(a) * sp, el * sp * 0.7 + 1.5, Math.sin(a) * sp, rand(0.5, 1) * e.life, rand(0.07, 0.17), TMP);
        }
      } else if (e.type === "hit" || e.type === "explode") {
        const n = e.type === "explode" ? 90 : 40;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = rand(3, e.type === "explode" ? 12 : 8);
          emit(
            e.x, 0.6, PLAYER_Z,
            Math.cos(a) * sp, Math.abs(Math.sin(a)) * sp * 0.8, rand(-2, 6),
            rand(0.5, 1.1), rand(0.08, 0.2), Math.random() < 0.5 ? PINK : ORANGE
          );
        }
      }
    }
    s.events.length = 0;

    const m = mesh.current;
    if (!m) return;
    pool.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= dt;
        p.vy -= 6 * dt;
        p.x += p.vx * dt;
        p.y = Math.max(0.05, p.y + p.vy * dt);
        p.z += p.vz * dt;
      }
      const k = Math.max(0, p.life / p.max);
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.size * k);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, p.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, PARTICLES]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={[2.2, 2.2, 2.2]} toneMapped={false} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------ environment */

const floorVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const floorFragment = /* glsl */ `
  uniform float uOffset;
  uniform float uPulse;
  uniform float uTrack;
  varying vec3 vWorld;

  float gridLine(float c) {
    float d = abs(fract(c - 0.5) - 0.5) / fwidth(c);
    return 1.0 - min(d, 1.0);
  }

  void main() {
    vec2 g = vec2(vWorld.x / 2.0, (vWorld.z - uOffset) / 2.0);
    float line = max(gridLine(g.x), gridLine(g.y));
    float depth = 4.0 - vWorld.z;
    float fade = 1.0 - smoothstep(25.0, 115.0, depth);
    float inside = 1.0 - smoothstep(uTrack - 0.2, uTrack + 0.6, abs(vWorld.x));
    vec3 pink = vec3(1.0, 0.24, 0.67);
    vec3 violet = vec3(0.45, 0.2, 1.0);
    vec3 col = mix(violet * 0.45, pink * (1.2 + uPulse), inside);
    vec3 base = vec3(0.025, 0.0, 0.06);
    gl_FragColor = vec4(base + col * line * fade, 1.0);
  }
`;

export function Floor({ state }) {
  const mat = useRef();
  const uniforms = useMemo(
    () => ({ uOffset: { value: 0 }, uPulse: { value: 0 }, uTrack: { value: TRACK_HALF_WIDTH } }),
    []
  );
  useFrame(() => {
    if (!mat.current) return;
    mat.current.uniforms.uOffset.value = state.distance % 2;
    mat.current.uniforms.uPulse.value = state.shake * 1.5;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -55]}>
      <planeGeometry args={[90, 140]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={floorVertex} fragmentShader={floorFragment} />
    </mesh>
  );
}

export function Rails() {
  return [-1, 1].map((side) => (
    <mesh key={side} position={[side * (TRACK_HALF_WIDTH + 0.1), 0.06, -55]}>
      <boxGeometry args={[0.08, 0.08, 140]} />
      <meshBasicMaterial color={[0.4, 2.4, 3]} toneMapped={false} />
    </mesh>
  ));
}

const sunFragment = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  void main() {
    vec3 top = vec3(1.0, 0.85, 0.3);
    vec3 bottom = vec3(1.0, 0.15, 0.55);
    vec3 col = mix(bottom, top, smoothstep(0.1, 0.95, vUv.y));
    // horizontal cut-outs that get thicker towards the bottom and slowly scroll
    float y = vUv.y;
    if (y < 0.55) {
      float band = fract(y * 14.0 + uTime * 0.25);
      float thickness = mix(0.55, 0.05, y / 0.55);
      if (band < thickness) discard;
    }
    float r = length(vUv - 0.5) * 2.0;
    if (r > 1.0) discard;
    gl_FragColor = vec4(col * 1.6, 1.0);
  }
`;

const sunVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function Sun() {
  const mat = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value += delta;
  });
  return (
    <mesh position={[0, 13, -150]}>
      <planeGeometry args={[60, 60]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={sunVertex} fragmentShader={sunFragment} fog={false} />
    </mesh>
  );
}

export function Mountains() {
  const geometries = useMemo(
    () =>
      [-1, 1].map((side) => {
        const geo = new THREE.PlaneGeometry(80, 24, 32, 10);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const y = pos.getY(i); // becomes depth after rotation
          const away = Math.abs(x + side * 40) / 40; // 0 near the track, 1 far out
          const h = (Math.sin(x * 0.35 + side) * 0.5 + 0.5) * 5 + Math.random() * 3;
          const ridge = Math.max(0, 1 - Math.abs(y) / 12);
          pos.setZ(i, h * ridge * (0.25 + away));
        }
        geo.computeVertexNormals();
        return { side, geo };
      }),
    []
  );
  return geometries.map(({ side, geo }) => (
    <mesh key={side} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[side * 52, -0.5, -128]}>
      <meshBasicMaterial color={[0.55, 0.25, 1.4]} wireframe toneMapped={false} fog={false} />
    </mesh>
  ));
}

export function Sky() {
  return <Stars radius={160} depth={40} count={2500} factor={4} saturation={0} fade speed={0.6} />;
}
