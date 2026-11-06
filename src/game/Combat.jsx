import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";

// HDR colors (> 1) so they bloom
const hdr = (r, g, b) => new THREE.Color(r, g, b);
const C = {
  bullet: hdr(0.8, 3.2, 3.6),
  shot: hdr(3.6, 0.5, 0.6),
  drone: hdr(3.4, 0.9, 0.4),
  diver: hdr(3.4, 2.0, 0.3),
  tank: hdr(3.4, 0.4, 0.9),
  boss: hdr(3.6, 0.4, 0.7),
  bossRing: hdr(3.6, 1.6, 0.3),
  weapon: hdr(3.4, 0.7, 2.2),
  rapid: hdr(1.8, 3.2, 0.6),
  shield: hdr(0.6, 2.8, 3.4),
  heal: hdr(3.4, 1.0, 1.4)
};

const BODY = { color: "#140812", metalness: 0.5, roughness: 0.4 };

/* ------------------------------------------------------------ projectiles */

function Instances({ items, color, geometry, place }) {
  const mesh = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    items.forEach((it, i) => {
      if (it.active) place(dummy, it);
      else dummy.scale.setScalar(0);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[null, null, items.length]} frustumCulled={false}>
      {geometry}
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  );
}

export function Bullets({ state }) {
  return (
    <Instances
      items={state.bullets}
      color={C.bullet}
      geometry={<boxGeometry args={[0.1, 0.1, 1.1]} />}
      place={(d, b) => {
        d.position.set(b.x, 0.6, b.z);
        d.rotation.set(0, Math.atan2(-b.vx, 78), 0);
        d.scale.setScalar(1);
      }}
    />
  );
}

export function EnemyShots({ state }) {
  return (
    <Instances
      items={state.shots}
      color={C.shot}
      geometry={<sphereGeometry args={[0.3, 10, 10]} />}
      place={(d, s) => {
        d.position.set(s.x, 0.7, s.z);
        d.rotation.set(0, 0, 0);
        d.scale.setScalar(1);
      }}
    />
  );
}

/* ---------------------------------------------------------------- enemies */

function EnemySlot({ enemy }) {
  const group = useRef();
  const drone = useRef();
  const diver = useRef();
  const tank = useRef();

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = enemy.active;
    if (!enemy.active) return;
    drone.current.visible = enemy.type === "drone";
    diver.current.visible = enemy.type === "diver";
    tank.current.visible = enemy.type === "tank";
    const hover = enemy.type === "tank" ? 1.3 : 1.0;
    g.position.set(enemy.x, hover + Math.sin(enemy.t * 3) * 0.12, enemy.z);
    g.scale.setScalar(enemy.flash > 0 ? 1.6 : 1.35);
    if (enemy.type === "diver") {
      g.rotation.set(0, 0, Math.sin(enemy.t * 6) * 0.3);
    } else {
      g.rotation.set(enemy.t * 0.8, enemy.t * 1.6, 0);
    }
  });

  return (
    <group ref={group} visible={false}>
      <mesh ref={drone}>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial {...BODY} />
        <Edges color={C.drone} lineWidth={2} toneMapped={false} />
      </mesh>
      <mesh ref={diver} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.6, 1.5, 3]} />
        <meshStandardMaterial {...BODY} />
        <Edges color={C.diver} lineWidth={2} toneMapped={false} />
      </mesh>
      <mesh ref={tank}>
        <dodecahedronGeometry args={[1.05, 0]} />
        <meshStandardMaterial {...BODY} />
        <Edges color={C.tank} lineWidth={2.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Enemies({ state }) {
  return state.enemies.map((e, i) => <EnemySlot key={i} enemy={e} />);
}

/* ------------------------------------------------------------------- boss */

export function Boss({ state }) {
  const group = useRef();
  const ring = useRef();
  const ring2 = useRef();
  const core = useRef();

  useFrame(() => {
    const b = state.boss;
    const g = group.current;
    if (!g) return;
    g.visible = b.active;
    if (!b.active) return;
    g.position.set(b.x, 3.4 + Math.sin(b.t * 1.3) * 0.3, b.z);
    g.scale.setScalar(b.flash > 0 ? 1.9 : 1.8);
    g.rotation.y = b.t * 0.4;
    ring.current.rotation.set(Math.PI / 2 + Math.sin(b.t) * 0.3, 0, b.t * 1.5);
    ring2.current.rotation.set(b.t * 0.9, Math.PI / 2, 0);
    const enraged = b.hp < b.maxHp / 2;
    core.current.scale.setScalar(1 + Math.sin(b.t * (enraged ? 14 : 6)) * 0.12);
  });

  return (
    <group ref={group} visible={false}>
      <mesh>
        <octahedronGeometry args={[2.1, 0]} />
        <meshStandardMaterial {...BODY} emissive="#3a0010" emissiveIntensity={0.6} />
        <Edges color={C.boss} lineWidth={2.6} toneMapped={false} />
      </mesh>
      <mesh ref={core}>
        <sphereGeometry args={[0.8, 20, 20]} />
        <meshBasicMaterial color={C.boss} toneMapped={false} />
      </mesh>
      <mesh ref={ring}>
        <torusGeometry args={[3.2, 0.09, 8, 64]} />
        <meshBasicMaterial color={C.bossRing} toneMapped={false} />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[2.7, 0.06, 8, 64]} />
        <meshBasicMaterial color={C.boss} toneMapped={false} />
      </mesh>
      <pointLight color="#ff2d55" intensity={30} distance={14} />
    </group>
  );
}

/* ---------------------------------------------------------------- pickups */

function PickupSlot({ pickup }) {
  const group = useRef();
  const refs = { weapon: useRef(), rapid: useRef(), shield: useRef(), heal: useRef() };

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    g.visible = pickup.active;
    if (!pickup.active) return;
    for (const k in refs) refs[k].current.visible = pickup.type === k;
    g.position.set(pickup.x, 1.0 + Math.sin(pickup.t * 4) * 0.18, pickup.z);
    g.rotation.set(0, pickup.t * 2.5, 0);
  });

  return (
    <group ref={group} visible={false}>
      {/* weapon: double pyramid */}
      <mesh ref={refs.weapon}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={C.weapon} toneMapped={false} wireframe />
      </mesh>
      {/* rapid fire: ring */}
      <mesh ref={refs.rapid}>
        <torusGeometry args={[0.42, 0.1, 8, 24]} />
        <meshBasicMaterial color={C.rapid} toneMapped={false} />
      </mesh>
      {/* shield: wire sphere */}
      <mesh ref={refs.shield}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color={C.shield} toneMapped={false} wireframe />
      </mesh>
      {/* heal: cross */}
      <group ref={refs.heal}>
        <mesh>
          <boxGeometry args={[0.8, 0.24, 0.24]} />
          <meshBasicMaterial color={C.heal} toneMapped={false} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.24, 0.8, 0.24]} />
          <meshBasicMaterial color={C.heal} toneMapped={false} />
        </mesh>
      </group>
      {/* soft ground marker */}
      <mesh position={[0, -0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.7, 32]} />
        <meshBasicMaterial color={C.shield} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export function Pickups({ state }) {
  return state.pickups.map((p, i) => <PickupSlot key={i} pickup={p} />);
}

/* ------------------------------------------------------------ ship shield */

export function ShieldBubble({ state }) {
  const mesh = useRef();
  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    m.visible = state.weapon.shield && state.lives > 0;
    m.position.set(state.player.x, 0.55, 4);
    m.rotation.y += 0.02;
    m.scale.setScalar(1 + Math.sin(state.elapsed * 5) * 0.04);
  });
  return (
    <mesh ref={mesh} visible={false}>
      <icosahedronGeometry args={[1.45, 1]} />
      <meshBasicMaterial color={C.shield} toneMapped={false} wireframe transparent opacity={0.35} />
    </mesh>
  );
}
