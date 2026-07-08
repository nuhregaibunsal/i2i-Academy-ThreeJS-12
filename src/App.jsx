import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

// Where the camera aims. Pointing slightly ahead of the player tilts the view
// down so the ground and the player cube are nicely framed on screen.
const CAMERA_LOOK_AT = [0, 0, 2];

// How fast the player slides along the X axis (units per second).
const PLAYER_SPEED = 8;
// The player can only move within this half-width so it stays on screen.
const PLAYER_X_LIMIT = 4.5;
// Fixed Z position: the player stays near the camera and only moves left/right.
const PLAYER_Z = 6;

// --- Obstacle tuning ---------------------------------------------------------
const OBSTACLE_COUNT = 5; // how many obstacles are recycled through the scene
const OBSTACLE_SPEED = 7; // how fast obstacles travel toward the player (units/s)
const OBSTACLE_SPAWN_Z = -24; // far ahead of the player, where obstacles appear
const OBSTACLE_DESPAWN_Z = 10; // just behind the player, where they get recycled
const OBSTACLE_SPACING = 8; // gap between consecutive obstacles at spawn time
// Collision fires when player/obstacle centers are closer than this (both are
// 1x1 cubes, so ~1.0 means their edges are touching).
const COLLISION_DISTANCE = 1.0;

// Random X within the same band the player can reach, so obstacles are dodgeable.
const randomLaneX = () => (Math.random() * 2 - 1) * PLAYER_X_LIMIT;

/**
 * Tracks which movement keys are currently held down.
 *
 * We keep the state inside a `ref` (not React state) on purpose: keyboard input
 * is read every frame inside `useFrame`, and updating React state on every
 * keypress would trigger needless re-renders. A ref gives us a stable, mutable
 * object we can read synchronously in the render loop.
 */
function useKeyboardControls() {
  // `left` / `right` flags read by the game loop each frame.
  const keys = useRef({ left: false, right: false });

  useEffect(() => {
    // Map both WASD and Arrow keys to the same directions.
    const setKey = (event, isPressed) => {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = isPressed;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = isPressed;
          break;
        default:
          break;
      }
    };

    const handleKeyDown = (event) => setKey(event, true);
    const handleKeyUp = (event) => setKey(event, false);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Clean up listeners when the component unmounts to avoid memory leaks.
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keys;
}

/**
 * The player-controlled cube. It moves smoothly left/right based on keyboard
 * input and is clamped to stay on the ground plane. The mesh is exposed through
 * `playerRef` so the obstacle logic can read the player's position for collision
 * checks. Movement is frozen once `running` becomes false (game over).
 */
function Player({ playerRef, running }) {
  const keys = useKeyboardControls();

  // The game loop: runs once per rendered frame. `delta` is the time (in
  // seconds) since the previous frame, which keeps movement frame-rate
  // independent (smooth on both 60Hz and 144Hz screens).
  useFrame((_, delta) => {
    const mesh = playerRef.current;
    if (!mesh || !running) return;

    // direction = -1 (left), +1 (right), or 0 (idle / both keys).
    const direction = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
    mesh.position.x += direction * PLAYER_SPEED * delta;

    // Keep the player inside the playable area.
    mesh.position.x = Math.max(
      -PLAYER_X_LIMIT,
      Math.min(PLAYER_X_LIMIT, mesh.position.x)
    );
  });

  return (
    <mesh ref={playerRef} position={[0, 0.5, PLAYER_Z]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

/**
 * A pool of obstacle cubes that stream toward the player. Instead of creating
 * and destroying meshes, we keep a fixed pool and recycle each one back to the
 * spawn line once it passes the player. Every frame we also run a simple
 * distance-based collision test against the player.
 */
function Obstacles({ playerRef, running, onCollision, onScore }) {
  // One ref per obstacle mesh so we can move them imperatively each frame.
  const meshRefs = useRef([]);

  // Initial obstacle data: staggered along Z so they arrive one after another.
  // `useMemo` keeps this array stable across re-renders (e.g. on game over).
  const obstacles = useMemo(
    () =>
      Array.from({ length: OBSTACLE_COUNT }, (_, i) => ({
        x: randomLaneX(),
        z: OBSTACLE_SPAWN_Z - i * OBSTACLE_SPACING
      })),
    []
  );

  useFrame((_, delta) => {
    const player = playerRef.current;
    if (!player || !running) return;

    obstacles.forEach((obstacle, i) => {
      // Move the obstacle toward (and past) the player.
      obstacle.z += OBSTACLE_SPEED * delta;

      // Recycle it back to the spawn line with a fresh lane once it's behind us.
      // Reaching this point means the player successfully dodged it: score +1.
      if (obstacle.z > OBSTACLE_DESPAWN_Z) {
        obstacle.z = OBSTACLE_SPAWN_Z;
        obstacle.x = randomLaneX();
        onScore();
      }

      // Push the data onto the actual mesh.
      const mesh = meshRefs.current[i];
      if (mesh) mesh.position.set(obstacle.x, 0.5, obstacle.z);

      // Distance-based collision on the ground plane (X/Z). We use the straight
      // line distance between centers; if it's below the threshold, they overlap.
      const dx = player.position.x - obstacle.x;
      const dz = player.position.z - obstacle.z;
      if (Math.hypot(dx, dz) < COLLISION_DISTANCE) onCollision();
    });
  });

  return (
    <group>
      {obstacles.map((obstacle, i) => (
        <mesh
          key={i}
          ref={(el) => (meshRefs.current[i] = el)}
          position={[obstacle.x, 0.5, obstacle.z]}
          castShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#f43f5e" />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Owns the shared player ref and wires the player together with the obstacles.
 * Keeping the ref here (rather than inside `Player`) lets the obstacle logic
 * read the live player position without lifting it into React state.
 */
function Game({ running, onCollision, onScore }) {
  const playerRef = useRef();

  return (
    <>
      <Player playerRef={playerRef} running={running} />
      <Obstacles
        playerRef={playerRef}
        running={running}
        onCollision={onCollision}
        onScore={onScore}
      />
    </>
  );
}

function Scene({ runKey, running, onCollision, onScore }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 80]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      {/* Changing `runKey` remounts the whole game, which resets the player to
          the center and re-seeds the obstacles — that's our "restart". */}
      <Game
        key={runKey}
        running={running}
        onCollision={onCollision}
        onScore={onScore}
      />
    </>
  );
}

/**
 * Sets up the perspective camera and tilts it down to look at the play area.
 * `drei`'s PerspectiveCamera has no `lookAt` prop, so we grab a ref and call
 * `lookAt` once after it mounts.
 */
function GameCamera() {
  const cameraRef = useRef();

  useEffect(() => {
    if (cameraRef.current) cameraRef.current.lookAt(...CAMERA_LOOK_AT);
  }, []);

  return (
    <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 8, 14]} fov={50} />
  );
}

/** 2D HUD overlay rendered on top of (outside) the Canvas. */
function Hud({ score, gameOver, onRestart }) {
  return (
    <div style={styles.hud}>
      {/* Live score, always visible in the top-left corner. */}
      <div style={styles.score}>Score: {score}</div>

      {/* Full-screen Game Over panel with a restart button. */}
      {gameOver && (
        <div style={styles.overlay}>
          <div style={styles.panel}>
            <h1 style={styles.title}>Game Over</h1>
            <p style={styles.finalScore}>Final score: {score}</p>
            <button style={styles.button} onClick={onRestart}>
              Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // The game freezes when a collision flips this to true.
  const [gameOver, setGameOver] = useState(false);
  // Number of obstacles the player has dodged so far.
  const [score, setScore] = useState(0);
  // Bumping this remounts the game subtree to reset player + obstacles.
  const [runKey, setRunKey] = useState(0);

  // Wrapped in `useCallback` so the identity is stable across frames. The guard
  // makes it idempotent: the first hit ends the game and later hits are ignored.
  const handleCollision = useCallback(() => {
    setGameOver(true);
  }, []);

  const handleScore = useCallback(() => {
    setScore((current) => current + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setRunKey((key) => key + 1);
  }, []);

  return (
    <div style={styles.root}>
      <Canvas shadows>
        <color attach="background" args={["#0f172a"]} />
        <GameCamera />
        <Scene
          runKey={runKey}
          running={!gameOver}
          onCollision={handleCollision}
          onScore={handleScore}
        />
      </Canvas>

      <Hud score={score} gameOver={gameOver} onRestart={handleRestart} />
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    background: "#0f172a"
  },
  // The HUD layer sits above the canvas but lets clicks pass through, so only
  // the interactive parts (the button) actually capture pointer events.
  hud: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    fontFamily: "system-ui, sans-serif",
    color: "#e2e8f0"
  },
  score: {
    position: "absolute",
    top: 20,
    left: 24,
    fontSize: 24,
    fontWeight: 700,
    textShadow: "0 1px 3px rgba(0,0,0,0.6)"
  },
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(15, 23, 42, 0.75)",
    pointerEvents: "auto"
  },
  panel: {
    textAlign: "center",
    padding: "40px 56px",
    borderRadius: 16,
    background: "#1e293b",
    boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  },
  title: {
    margin: 0,
    fontSize: 44,
    color: "#f43f5e"
  },
  finalScore: {
    margin: "16px 0 28px",
    fontSize: 20,
    color: "#cbd5e1"
  },
  button: {
    padding: "12px 32px",
    fontSize: 18,
    fontWeight: 700,
    color: "#0f172a",
    background: "#38bdf8",
    border: "none",
    borderRadius: 10,
    cursor: "pointer"
  }
};
