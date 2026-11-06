import React from "react";
import { MAX_LIVES, MAX_SPEED } from "./game/state.js";
import { MAX_WEAPON, POWER } from "./game/combat.js";

const stop = (e) => e.stopPropagation();

function Heart({ full }) {
  return (
    <svg viewBox="0 0 24 24" className={`heart ${full ? "full" : ""}`} aria-hidden="true">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

export default function Hud({ phase, hud, best, newBest, muted, onStart, onPause, onMute }) {
  const playing = phase === "playing" || phase === "paused";
  const speedPct = Math.min(100, (hud.speed / MAX_SPEED) * 100);

  return (
    <div className="hud">
      {playing && (
        <>
          <div className="hud-top">
            <div>
              <div className="label">Score</div>
              <div className="score">{hud.score.toLocaleString()}</div>
              <div className={`mult m${hud.multiplier}`}>
                x{hud.multiplier}
                <span className="streak">{hud.streak % 5}/5</span>
              </div>
            </div>
            <div className="right">
              <div className="lives">
                {Array.from({ length: MAX_LIVES }, (_, i) => (
                  <Heart key={i} full={i < hud.lives} />
                ))}
              </div>
              <div className="speed">
                <div className="speed-fill" style={{ width: `${speedPct}%` }} />
              </div>
              <div className="label small">{Math.round(hud.speed * 9)} km/h</div>
              <div className="weapon" aria-label={`Weapon level ${hud.weapon}`}>
                <span className="label">Weapon</span>
                {Array.from({ length: MAX_WEAPON }, (_, i) => (
                  <i key={i} className={i < hud.weapon ? "on" : ""} />
                ))}
              </div>
              <div className="status">
                {hud.shield && <span className="chip" style={{ "--c": POWER.shield.color }}>Shield</span>}
                {hud.rapid > 0 && (
                  <span className="chip" style={{ "--c": POWER.rapid.color }}>Rapid {Math.ceil(hud.rapid)}s</span>
                )}
              </div>
            </div>
          </div>
          <div className="kills">{hud.kills} kills</div>
          {hud.boss !== null && (
            <div className="boss">
              <div className="boss-name">Sentinel</div>
              <div className="boss-bar"><div style={{ width: `${Math.max(0, hud.boss) * 100}%` }} /></div>
            </div>
          )}
          {hud.toast && (
            <div className="toast" key={hud.toast.text} style={{ "--c": hud.toast.color }}>{hud.toast.text}</div>
          )}
          <div className="buttons" onPointerDown={stop}>
            <button onClick={onMute} aria-label={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🔊"}</button>
            <button onClick={onPause} aria-label="Pause">{phase === "paused" ? "▶" : "❚❚"}</button>
          </div>
        </>
      )}

      {phase === "menu" && (
        <div className="overlay" onPointerDown={stop}>
          <div className="panel">
            <div className="kicker">a neon runner</div>
            <h1 className="title">DRIFTLINE</h1>
            <p className="tagline">Dodge the walls. Blast the swarm. Survive the Sentinel.</p>
            <button className="primary" onClick={onStart}>Play</button>
            <div className="controls">
              <span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> steer</span>
              <span>drag on touch screens</span>
              <span><kbd>P</kbd> pause · <kbd>M</kbd> mute</span>
              <span>your ship fires on its own</span>
            </div>
            <div className="legend">
              {Object.entries(POWER).map(([k, p]) => (
                <span key={k}><i style={{ background: p.color }} />{p.label}</span>
              ))}
            </div>
            {best > 0 && <div className="best">Best: {best.toLocaleString()}</div>}
          </div>
        </div>
      )}

      {phase === "paused" && (
        <div className="overlay" onPointerDown={stop}>
          <div className="panel">
            <h2 className="title small">Paused</h2>
            <button className="primary" onClick={onPause}>Resume</button>
          </div>
        </div>
      )}

      {phase === "over" && (
        <div className="overlay" onPointerDown={stop}>
          <div className="panel">
            <h2 className="title small over">Crashed</h2>
            <div className="final">{hud.score.toLocaleString()}</div>
            <div className="over-stats">{hud.kills} kills · weapon lv {hud.weapon}</div>
            {newBest ? <div className="badge">New best!</div> : <div className="best">Best: {best.toLocaleString()}</div>}
            <button className="primary" onClick={onStart}>Play again</button>
            <div className="controls"><span>or press <kbd>Space</kbd></span></div>
          </div>
        </div>
      )}
    </div>
  );
}
