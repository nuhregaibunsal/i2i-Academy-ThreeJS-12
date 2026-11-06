import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { GameLoop, Floor, Mountains, Obstacles, Orbs, Particles, Rails, Ship, Sky, Sun } from "./game/World.jsx";
import { LANE_LIMIT, MAX_LIVES, createState, resetState } from "./game/state.js";
import { sfx } from "./game/audio.js";
import Hud from "./Hud.jsx";

const BEST_KEY = "driftline-best";

function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* storage unavailable (private mode) — keep best in memory only */
  }
}

export default function App() {
  const state = useMemo(() => createState(), []);
  const [phase, setPhase] = useState("menu"); // menu | playing | paused | over
  const [hud, setHud] = useState({ score: 0, multiplier: 1, streak: 0, lives: MAX_LIVES, speed: 0, progress: 0 });
  const [best, setBest] = useState(loadBest);
  const [newBest, setNewBest] = useState(false);
  const [muted, setMuted] = useState(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const start = useCallback(() => {
    resetState(state);
    setNewBest(false);
    setHud((h) => ({ ...h, score: 0, multiplier: 1, streak: 0, lives: MAX_LIVES }));
    setPhase("playing");
    sfx.start();
  }, [state]);

  const togglePause = useCallback(() => {
    setPhase((p) => (p === "playing" ? "paused" : p === "paused" ? "playing" : p));
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  }, []);

  const handleGameOver = useCallback((finalScore) => {
    setPhase("over");
    setBest((b) => {
      if (finalScore > b) {
        saveBest(finalScore);
        setNewBest(true);
        return finalScore;
      }
      return b;
    });
  }, []);

  // keyboard
  useEffect(() => {
    const set = (e, down) => {
      const k = e.code;
      if (k === "KeyA" || k === "ArrowLeft") state.input.left = down;
      else if (k === "KeyD" || k === "ArrowRight") state.input.right = down;
      else return false;
      state.input.pointerX = null;
      return true;
    };
    const onDown = (e) => {
      if (set(e, true)) return e.preventDefault();
      const p = phaseRef.current;
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (p === "menu" || p === "over") start();
        else togglePause();
      } else if (e.code === "KeyP" || e.code === "Escape") togglePause();
      else if (e.code === "KeyM") toggleMute();
    };
    const onUp = (e) => set(e, false);
    const onHidden = () => {
      if (document.hidden && phaseRef.current === "playing") setPhase("paused");
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [state, start, togglePause, toggleMute]);

  // touch / mouse drag steering: the ship follows the pointer horizontally
  const pointerToLane = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = (e.clientX - r.left) / r.width; // 0..1
    state.input.pointerX = (t * 2 - 1) * LANE_LIMIT * 1.25;
  };
  const onPointerDown = (e) => {
    if (phaseRef.current !== "playing") return;
    pointerToLane(e);
  };
  const onPointerMove = (e) => {
    if (phaseRef.current !== "playing") return;
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    pointerToLane(e);
  };
  const onPointerUp = () => {
    state.input.pointerX = null;
  };

  return (
    <div
      className="root"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Canvas dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: "high-performance" }}>
        <color attach="background" args={["#07000f"]} />
        <fog attach="fog" args={["#07000f", 45, 125]} />
        <PerspectiveCamera makeDefault position={[0, 3.1, 10.8]} fov={64} near={0.1} far={400} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[0, 8, 6]} intensity={0.9} color="#c4b5fd" />

        <Sky />
        <Sun />
        <Mountains />
        <Floor state={state} />
        <Rails />
        <Obstacles state={state} />
        <Orbs state={state} />
        <Ship state={state} phase={phase} />
        <Particles state={state} phase={phase} />
        <GameLoop state={state} phase={phase} onHud={setHud} onGameOver={handleGameOver} />

        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur intensity={1.15} luminanceThreshold={0.6} luminanceSmoothing={0.25} />
          <Vignette offset={0.25} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      <Hud
        phase={phase}
        hud={hud}
        best={best}
        newBest={newBest}
        muted={muted}
        onStart={start}
        onPause={togglePause}
        onMute={toggleMute}
      />
    </div>
  );
}
