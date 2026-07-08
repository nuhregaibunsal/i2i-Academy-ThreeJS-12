import React, { useEffect, useRef } from "react";
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
 * input and is clamped to stay on the ground plane.
 */
function Player() {
  const meshRef = useRef();
  const keys = useKeyboardControls();

  // The game loop: runs once per rendered frame. `delta` is the time (in
  // seconds) since the previous frame, which keeps movement frame-rate
  // independent (smooth on both 60Hz and 144Hz screens).
  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

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
    <mesh ref={meshRef} position={[0, 0.5, PLAYER_Z]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#38bdf8" />
    </mesh>
  );
}

function Scene() {
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
      <Player />
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

export default function App() {
  return (
    <div style={styles.root}>
      <Canvas shadows>
        <color attach="background" args={["#0f172a"]} />
        <GameCamera />
        <Scene />
      </Canvas>
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    background: "#0f172a"
  }
};
