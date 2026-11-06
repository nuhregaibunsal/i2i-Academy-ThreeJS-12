# Graph Report - ThreeJS-12  (2026-11-06)

## Corpus Check
- 11 files · ~39,222 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 121 nodes · 197 edges · 9 communities (7 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50af1f12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Hud.jsx
- dependencies
- App.jsx
- package.json
- Driftline — a neon runner
- World.jsx
- Combat.jsx
- combat.js

## God Nodes (most connected - your core abstractions)
1. `updateCombat()` - 13 edges
2. `spawnPattern()` - 7 edges
3. `difficulty()` - 7 edges
4. `App()` - 6 edges
5. `spawnWave()` - 6 edges
6. `Driftline — a neon runner` - 6 edges
7. `GameLoop()` - 5 edges
8. `take()` - 5 edges
9. `dropPickup()` - 5 edges
10. `scripts` - 4 edges

## Surprising Connections (you probably didn't know these)
- `spawnWave()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/combat.js → src/game/state.js
- `updateCombat()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/combat.js → src/game/state.js
- `App()` --calls--> `createState()`  [EXTRACTED]
  src/App.jsx → src/game/state.js
- `App()` --calls--> `resetState()`  [EXTRACTED]
  src/App.jsx → src/game/state.js
- `spawnPattern()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/World.jsx → src/game/state.js

## Import Cycles
- None detected.

## Communities (9 total, 1 thin omitted)

### Community 0 - "Hud.jsx"
Cohesion: 0.33
Nodes (3): MAX_LIVES, MAX_SPEED, Hud()

### Community 1 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, @react-three/postprocessing, three, react (+5 more)

### Community 2 - "App.jsx"
Cohesion: 0.15
Nodes (16): App(), loadBest(), saveBest(), audio(), sfx, tone(), createState(), resetState() (+8 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, vite, @vitejs/plugin-react, name, private, scripts, build, dev (+5 more)

### Community 4 - "Driftline — a neon runner"
Cohesion: 0.29
Nodes (6): Controls, Driftline — a neon runner, Features, Project structure, Run locally, Tech stack

### Community 5 - "World.jsx"
Cohesion: 0.13
Nodes (24): ACCELERATION, difficulty(), LANE_LIMIT, MAX_MULTIPLIER, OBSTACLE_POOL, ORB_POOL, PLAYER_Z, SPAWN_Z (+16 more)

### Community 8 - "combat.js"
Cohesion: 0.18
Nodes (21): addEnemy(), applyPickup(), clampLane(), createCombat(), dropPickup(), ENEMY, fire(), hurtPlayer() (+13 more)

## Knowledge Gaps
- **35 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+30 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 49 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `difficulty()` connect `World.jsx` to `combat.js`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _35 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `World.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12923076923076923 - nodes in this community are weakly interconnected._