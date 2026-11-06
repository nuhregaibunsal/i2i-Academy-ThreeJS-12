import React from "react";
import { MAX_LIVES, MAX_SPEED } from "./game/state.js";

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
            </div>
          </div>
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
            <p className="tagline">Dodge the walls. Grab the crystals. Go faster.</p>
            <button className="primary" onClick={onStart}>Play</button>
            <div className="controls">
              <span><kbd>A</kbd><kbd>D</kbd> or <kbd>←</kbd><kbd>→</kbd> steer</span>
              <span>drag on touch screens</span>
              <span><kbd>P</kbd> pause · <kbd>M</kbd> mute</span>
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
            {newBest ? <div className="badge">New best!</div> : <div className="best">Best: {best.toLocaleString()}</div>}
            <button className="primary" onClick={onStart}>Play again</button>
            <div className="controls"><span>or press <kbd>Space</kbd></span></div>
          </div>
        </div>
      )}
    </div>
  );
}
