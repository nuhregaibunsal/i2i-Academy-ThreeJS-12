// Shooting, enemies, the boss and power-ups. Pure simulation code: it only
// mutates the shared state and pushes events; rendering lives in Combat.jsx.
import { DESPAWN_Z, INVULNERABLE_TIME, LANE_LIMIT, MAX_LIVES, PLAYER_Z, SPAWN_Z, difficulty } from "./state.js";
import { sfx } from "./audio.js";

const pool = (n, make) => Array.from({ length: n }, make);
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const clampLane = (x) => Math.max(-LANE_LIMIT, Math.min(LANE_LIMIT, x));

export const MAX_WEAPON = 5;
const BULLET_SPEED = 78;

export const ENEMY = {
  drone: { radius: 0.95, score: 50, color: "#ff5a36", drop: 0.1 },
  diver: { radius: 0.95, score: 80, color: "#ffb020", drop: 0.15 },
  tank: { radius: 1.5, score: 150, color: "#ff2d55", drop: 0.55 }
};

export const POWER = {
  weapon: { color: "#ff3cac", label: "Weapon +1" },
  rapid: { color: "#a3e635", label: "Rapid fire" },
  shield: { color: "#22d3ee", label: "Shield" },
  heal: { color: "#fb7185", label: "+1 life" }
};

export function createCombat() {
  return {
    bullets: pool(80, () => ({ active: false, x: 0, z: 0, vx: 0 })),
    enemies: pool(18, () => ({ active: false, type: "drone", x: 0, z: 0, baseX: 0, hp: 1, t: 0, flash: 0 })),
    shots: pool(48, () => ({ active: false, x: 0, z: 0, vx: 0, vz: 0 })),
    pickups: pool(8, () => ({ active: false, type: "weapon", x: 0, z: 0, t: 0 })),
    weapon: { level: 1, rapid: 0, shield: false, cooldown: 0.4 },
    boss: { active: false, hp: 1, maxHp: 1, x: 0, z: -130, t: 0, fireT: 0, flash: 0 },
    bossCount: 0,
    nextBoss: 40,
    kills: 0,
    playTime: 0,
    untilEnemy: 45,
    toast: null // { text, color, t }
  };
}

const take = (list) => list.find((it) => !it.active);

/* ------------------------------------------------------------- damage */

/** Called whenever something hurts the ship. Returns true if a life was lost. */
export function hurtPlayer(s, onGameOver) {
  if (s.invulnerable > 0) return false;
  if (s.weapon.shield) {
    s.weapon.shield = false;
    s.invulnerable = 1.0;
    s.shake = 0.35;
    s.events.push({ type: "burst", x: s.player.x, y: 0.6, z: PLAYER_Z, n: 30, color: "#22d3ee", speed: 7, life: 0.6 });
    sfx.shield();
    return false;
  }
  s.lives -= 1;
  s.invulnerable = INVULNERABLE_TIME;
  s.shake = 0.7;
  s.multiplier = 1;
  s.orbStreak = 0;
  s.weapon.level = Math.max(1, s.weapon.level - 1);
  s.weapon.rapid = 0;
  s.events.push({ type: "hit", x: s.player.x });
  sfx.hit();
  if (s.lives <= 0) {
    s.events.push({ type: "explode", x: s.player.x });
    sfx.over();
    onGameOver(Math.floor(s.score));
  }
  return true;
}

/* ------------------------------------------------------------- spawning */

function addEnemy(s, type, x, z, hp) {
  const e = take(s.enemies);
  if (!e) return;
  Object.assign(e, { active: true, type, x, baseX: x, z, hp, t: Math.random() * 6, flash: 0 });
}

function spawnWave(s) {
  const d = difficulty(s);
  const r = Math.random();
  const z = SPAWN_Z + 20;
  if (r < 0.5) {
    const n = 3 + Math.floor(d * 3);
    const cx = rand(-LANE_LIMIT + 2, LANE_LIMIT - 2);
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      addEnemy(s, "drone", clampLane(cx + (i - mid) * 1.7), z - Math.abs(i - mid) * 3, d > 0.55 ? 2 : 1);
    }
  } else if (r < 0.78) {
    addEnemy(s, "diver", -2.8, z, 2);
    addEnemy(s, "diver", 2.8, z - 6, 2);
  } else {
    addEnemy(s, "tank", rand(-3, 3), z, 6 + Math.round(d * 6));
  }
}

function dropPickup(s, x, z, forced) {
  let type = forced;
  if (!type) {
    const r = Math.random();
    type = r < 0.4 ? "weapon" : r < 0.65 ? "rapid" : r < 0.85 ? "shield" : "heal";
  }
  if (type === "heal" && s.lives >= MAX_LIVES) type = "shield";
  if (type === "shield" && s.weapon.shield) type = "weapon";
  const p = take(s.pickups);
  if (!p) return;
  Object.assign(p, { active: true, type, x: clampLane(x), z, t: 0 });
}

function toast(s, text, color) {
  s.toast = { text, color, t: 1.6 };
}

function applyPickup(s, type) {
  const w = s.weapon;
  if (type === "weapon") {
    if (w.level < MAX_WEAPON) {
      w.level += 1;
      toast(s, `Weapon lv ${w.level}`, POWER.weapon.color);
    } else {
      s.score += 300 * s.multiplier;
      toast(s, "Max weapon +300", POWER.weapon.color);
    }
  } else if (type === "rapid") {
    w.rapid = 10;
    toast(s, "Rapid fire", POWER.rapid.color);
  } else if (type === "shield") {
    w.shield = true;
    toast(s, "Shield up", POWER.shield.color);
  } else if (type === "heal") {
    s.lives = Math.min(MAX_LIVES, s.lives + 1);
    toast(s, "+1 life", POWER.heal.color);
  }
  sfx.power();
}

/* --------------------------------------------------------------- firing */

const PATTERNS = {
  1: [[0, 0]],
  2: [[-0.32, 0], [0.32, 0]],
  3: [[0, 0], [-0.2, -2.6], [0.2, 2.6]],
  4: [[-0.3, 0], [0.3, 0], [-0.3, -3.4], [0.3, 3.4]],
  5: [[0, 0], [-0.25, -2.2], [0.25, 2.2], [-0.35, -5], [0.35, 5]]
};

function fire(s) {
  for (const [ox, vx] of PATTERNS[s.weapon.level]) {
    const b = take(s.bullets);
    if (!b) return;
    Object.assign(b, { active: true, x: s.player.x + ox, z: PLAYER_Z - 1.2, vx });
  }
  sfx.shoot();
}

/* ----------------------------------------------------------------- kill */

function killEnemy(s, e) {
  const def = ENEMY[e.type];
  e.active = false;
  s.kills += 1;
  s.score += def.score * s.multiplier;
  s.events.push({ type: "burst", x: e.x, y: 1, z: e.z, n: e.type === "tank" ? 50 : 26, color: def.color, speed: e.type === "tank" ? 10 : 7, life: 0.7 });
  sfx.kill(e.type === "tank");
  if (Math.random() < def.drop) dropPickup(s, e.x, e.z);
}

/* --------------------------------------------------------------- update */

export function updateCombat(s, dt, move, playing, onGameOver) {
  const p = s.player;
  const w = s.weapon;
  const boss = s.boss;
  const d = difficulty(s);

  if (playing) {
    s.playTime += dt;
    w.rapid = Math.max(0, w.rapid - dt);
    w.cooldown -= dt;
    if (w.cooldown <= 0) {
      fire(s);
      w.cooldown = w.rapid > 0 ? 0.085 : 0.19;
    }

    // waves (paused while the boss is out)
    if (!boss.active) {
      s.untilEnemy -= move;
      if (s.untilEnemy <= 0) {
        spawnWave(s);
        s.untilEnemy = lerp(60, 30, d);
      }
    }

    // boss arrival
    if (!boss.active && s.playTime >= s.nextBoss) {
      Object.assign(boss, {
        active: true,
        maxHp: 60 + s.bossCount * 40,
        hp: 60 + s.bossCount * 40,
        x: 0,
        z: -135,
        t: 0,
        fireT: 2.5,
        flash: 0
      });
      toast(s, "Warning: boss incoming", "#ff2d55");
      sfx.alarm();
    }
  }

  if (s.toast) {
    s.toast.t -= dt;
    if (s.toast.t <= 0) s.toast = null;
  }

  // bullets
  for (const b of s.bullets) {
    if (!b.active) continue;
    b.z -= BULLET_SPEED * dt;
    b.x += b.vx * dt;
    // limited range, so fights happen up close instead of on the horizon
    if (b.z < PLAYER_Z - 64 || Math.abs(b.x) > 9) {
      b.active = false;
      continue;
    }
    // walls and pillars absorb bullets
    for (const o of s.obstacles) {
      if (o.active && Math.abs(b.x - o.x) < o.w / 2 && Math.abs(b.z - o.z) < o.d / 2 + 0.4) {
        b.active = false;
        s.events.push({ type: "burst", x: b.x, y: 0.6, z: o.z + o.d / 2, n: 4, color: "#ff3cac", speed: 3, life: 0.25 });
        break;
      }
    }
    if (!b.active) continue;
    for (const e of s.enemies) {
      if (!e.active) continue;
      const r = ENEMY[e.type].radius;
      if (Math.abs(b.x - e.x) < r && Math.abs(b.z - e.z) < r + 0.5) {
        b.active = false;
        e.hp -= 1;
        e.flash = 0.08;
        if (e.hp <= 0) killEnemy(s, e);
        else sfx.enemyHit();
        break;
      }
    }
    if (b.active && boss.active && Math.abs(b.x - boss.x) < 4 && Math.abs(b.z - boss.z) < 3.4) {
      b.active = false;
      boss.hp -= 1;
      boss.flash = 0.06;
      if (Math.random() < 0.3) sfx.enemyHit();
      if (boss.hp <= 0) {
        boss.active = false;
        s.bossCount += 1;
        s.nextBoss = s.playTime + 60;
        s.kills += 1;
        s.score += 2000 * s.multiplier;
        s.shake = 0.6;
        for (let k = 0; k < 3; k++) {
          s.events.push({ type: "burst", x: boss.x + rand(-1.5, 1.5), y: 1.8, z: boss.z + rand(-1, 1), n: 70, color: k === 1 ? "#ffb020" : "#ff2d55", speed: 14, life: 1.2 });
        }
        dropPickup(s, boss.x - 1.5, boss.z, "weapon");
        dropPickup(s, boss.x + 1.5, boss.z, s.lives < MAX_LIVES ? "heal" : "shield");
        toast(s, "Boss down +2000", "#ffb020");
        sfx.bossDown();
      }
    }
  }

  // enemies
  for (const e of s.enemies) {
    if (!e.active) continue;
    e.t += dt;
    e.flash = Math.max(0, e.flash - dt);
    if (e.type === "drone") {
      // cruise in fast, then slow down to hover in front of the ship
      e.z += move * (e.z < -45 ? 0.95 : 0.45);
      e.x = clampLane(e.baseX + Math.sin(e.t * 2.2) * 1.3);
    } else if (e.type === "diver") {
      const diving = e.z > -38;
      e.z += move * (diving ? 1.1 : 0.8);
      if (diving) e.x = clampLane(e.x + Math.sign(p.x - e.x) * Math.min(Math.abs(p.x - e.x), 7 * dt));
    } else {
      e.z += move * (e.z < -45 ? 0.85 : 0.3);
      e.x = clampLane(e.baseX + Math.sin(e.t * 0.8) * 1.0);
    }
    if (e.z > DESPAWN_Z) {
      e.active = false;
      continue;
    }
    const r = ENEMY[e.type].radius;
    if (playing && Math.abs(p.x - e.x) < r + 0.4 && Math.abs(PLAYER_Z - e.z) < r + 0.4) {
      e.active = false;
      s.events.push({ type: "burst", x: e.x, y: 1, z: e.z, n: 24, color: ENEMY[e.type].color, speed: 7, life: 0.6 });
      hurtPlayer(s, onGameOver);
    }
  }

  // boss
  if (boss.active) {
    boss.t += dt;
    boss.flash = Math.max(0, boss.flash - dt);
    boss.z = lerp(boss.z, -15, Math.min(1, dt * 0.9));
    boss.x = Math.sin(boss.t * 0.55) * 3.4;
    if (playing) {
      boss.fireT -= dt;
      if (boss.fireT <= 0 && boss.z > -60) {
        const enraged = boss.hp < boss.maxHp / 2;
        const n = enraged ? 5 : 3;
        const dx = p.x - boss.x;
        const dz = PLAYER_Z - boss.z;
        const base = Math.atan2(dx, dz);
        const speed = enraged ? 24 : 20;
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.16;
          const sh = take(s.shots);
          if (!sh) break;
          Object.assign(sh, { active: true, x: boss.x, z: boss.z + 2, vx: Math.sin(a) * speed, vz: Math.cos(a) * speed });
        }
        boss.fireT = enraged ? 0.8 : 1.25;
        sfx.bossShot();
      }
    }
  }

  // enemy shots
  for (const sh of s.shots) {
    if (!sh.active) continue;
    sh.x += sh.vx * dt;
    sh.z += sh.vz * dt;
    if (sh.z > DESPAWN_Z || Math.abs(sh.x) > 12) {
      sh.active = false;
      continue;
    }
    if (playing && Math.abs(p.x - sh.x) < 0.55 && Math.abs(PLAYER_Z - sh.z) < 0.6) {
      sh.active = false;
      hurtPlayer(s, onGameOver);
    }
  }

  // pickups ride with the track
  for (const pk of s.pickups) {
    if (!pk.active) continue;
    pk.t += dt;
    pk.z += move;
    if (pk.z > DESPAWN_Z) {
      pk.active = false;
      continue;
    }
    if (playing && Math.abs(p.x - pk.x) < 1.1 && Math.abs(PLAYER_Z - pk.z) < 1.2) {
      pk.active = false;
      s.events.push({ type: "burst", x: pk.x, y: 1, z: pk.z, n: 20, color: POWER[pk.type].color, speed: 5, life: 0.5 });
      applyPickup(s, pk.type);
    }
  }
}
