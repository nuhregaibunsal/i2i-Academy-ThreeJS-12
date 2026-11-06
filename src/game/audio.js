// Tiny synthesized sound effects (Web Audio), so the game ships with no audio files.

let ctx = null;
let muted = false;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ type = "sine", from, to, duration, volume = 0.15, delay = 0 }) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

export const sfx = {
  pickup(multiplier) {
    const base = 660 * Math.pow(1.12, multiplier - 1);
    tone({ type: "triangle", from: base, to: base * 1.5, duration: 0.12, volume: 0.12 });
  },
  hit() {
    tone({ type: "sawtooth", from: 220, to: 40, duration: 0.45, volume: 0.2 });
    tone({ type: "square", from: 120, to: 30, duration: 0.35, volume: 0.08 });
  },
  start() {
    [440, 554, 659, 880].forEach((f, i) =>
      tone({ type: "triangle", from: f, to: f, duration: 0.12, volume: 0.1, delay: i * 0.07 })
    );
  },
  over() {
    [523, 392, 311, 196].forEach((f, i) =>
      tone({ type: "triangle", from: f, to: f * 0.98, duration: 0.22, volume: 0.12, delay: i * 0.13 })
    );
  },
  shoot() {
    tone({ type: "square", from: 1400, to: 700, duration: 0.05, volume: 0.025 });
  },
  enemyHit() {
    tone({ type: "square", from: 500, to: 380, duration: 0.05, volume: 0.04 });
  },
  kill(big) {
    tone({ type: "sawtooth", from: big ? 300 : 520, to: 60, duration: big ? 0.4 : 0.22, volume: big ? 0.14 : 0.09 });
  },
  power() {
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({ type: "triangle", from: f, to: f, duration: 0.09, volume: 0.1, delay: i * 0.05 })
    );
  },
  shield() {
    tone({ type: "sine", from: 900, to: 200, duration: 0.3, volume: 0.15 });
  },
  alarm() {
    for (let i = 0; i < 3; i++) {
      tone({ type: "sawtooth", from: 440, to: 660, duration: 0.25, volume: 0.09, delay: i * 0.35 });
    }
  },
  bossShot() {
    tone({ type: "square", from: 260, to: 140, duration: 0.12, volume: 0.05 });
  },
  bossDown() {
    tone({ type: "sawtooth", from: 400, to: 30, duration: 1.0, volume: 0.2 });
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ type: "triangle", from: f, to: f, duration: 0.12, volume: 0.1, delay: 0.5 + i * 0.08 })
    );
  },
  setMuted(value) {
    muted = value;
  },
  isMuted() {
    return muted;
  }
};
