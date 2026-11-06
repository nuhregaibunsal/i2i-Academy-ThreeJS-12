// Tuning values and the mutable game state shared by the render loop.
// The state lives in a plain object (not React state) because it changes every
// frame; React only receives throttled snapshots for the HUD.

import { createCombat } from "./combat.js";

export const LANE_LIMIT = 5.2; // how far the ship can drift left/right
export const TRACK_HALF_WIDTH = 6.2; // where the side rails sit
export const SPAWN_Z = -95; // where new objects appear
export const DESPAWN_Z = 12; // behind the camera, objects get recycled
export const PLAYER_Z = 4;

export const START_SPEED = 16;
export const MAX_SPEED = 46;
export const ACCELERATION = 0.45; // units/s gained every second

export const MAX_LIVES = 3;
export const INVULNERABLE_TIME = 1.6;
export const MAX_MULTIPLIER = 5;

export const OBSTACLE_POOL = 28;
export const ORB_POOL = 16;

export function createState() {
  return {
    speed: START_SPEED,
    distance: 0,
    score: 0,
    multiplier: 1,
    orbStreak: 0,
    lives: MAX_LIVES,
    invulnerable: 0,
    shake: 0,
    untilSpawn: 30,
    elapsed: 0,
    player: { x: 0, vx: 0 },
    input: { left: false, right: false, pointerX: null },
    obstacles: Array.from({ length: OBSTACLE_POOL }, () => ({
      active: false, x: 0, z: 0, w: 1, h: 1, d: 1
    })),
    orbs: Array.from({ length: ORB_POOL }, () => ({ active: false, x: 0, z: 0 })),
    events: [], // one-shot events consumed by effects (hit / pickup)
    ...createCombat()
  };
}

export function resetState(s) {
  Object.assign(s, createState(), { input: s.input });
  s.input.pointerX = null;
}

/** 0 at the start, 1 at max speed. */
export function difficulty(s) {
  return (s.speed - START_SPEED) / (MAX_SPEED - START_SPEED);
}
