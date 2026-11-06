# Graph Report - ThreeJS-12  (2026-11-06)

## Corpus Check
- 11 files · ~41,001 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 122 nodes · 216 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1dbaa8ff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- state.js
- dependencies
- audio.js
- package.json
- Driftline — a neon runner
- World.jsx
- App.jsx
- combat.js

## God Nodes (most connected - your core abstractions)
1. `updateCombat()` - 14 edges
2. `spawnPattern()` - 8 edges
3. `GameLoop()` - 7 edges
4. `spawnWave()` - 7 edges
5. `difficulty()` - 7 edges
6. `App()` - 6 edges
7. `Driftline — a neon runner` - 6 edges
8. `take()` - 5 edges
9. `dropPickup()` - 5 edges
10. `createState()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `createState()`  [EXTRACTED]
  src/App.jsx → src/game/state.js
- `App()` --calls--> `resetState()`  [EXTRACTED]
  src/App.jsx → src/game/state.js
- `GameLoop()` --calls--> `hurtPlayer()`  [EXTRACTED]
  src/game/World.jsx → src/game/combat.js
- `GameLoop()` --calls--> `updateCombat()`  [EXTRACTED]
  src/game/World.jsx → src/game/combat.js
- `updateCombat()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/combat.js → src/game/state.js

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "state.js"
Cohesion: 0.16
Nodes (13): createCombat(), pool(), ACCELERATION, createState(), INVULNERABLE_TIME, LANE_LIMIT, MAX_MULTIPLIER, MAX_SPEED (+5 more)

### Community 1 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, @react-three/postprocessing, three, react (+5 more)

### Community 2 - "audio.js"
Cohesion: 0.67
Nodes (3): audio(), sfx, tone()

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, vite, @vitejs/plugin-react, name, private, scripts, build, dev (+5 more)

### Community 4 - "Driftline — a neon runner"
Cohesion: 0.29
Nodes (6): Controls, Driftline — a neon runner, Features, Project structure, Run locally, Tech stack

### Community 5 - "World.jsx"
Cohesion: 0.15
Nodes (20): spawnWave(), DESPAWN_Z, difficulty(), addObstacle(), addOrb(), CYAN, EDGE_CYAN, EDGE_PINK (+12 more)

### Community 6 - "App.jsx"
Cohesion: 0.11
Nodes (18): App(), loadBest(), saveBest(), BODY, Boss(), Bullets(), C, Enemies() (+10 more)

### Community 8 - "combat.js"
Cohesion: 0.16
Nodes (19): addEnemy(), applyPickup(), clampLane(), dropPickup(), ENEMY, fire(), hurtPlayer(), killEnemy() (+11 more)

## Knowledge Gaps
- **34 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 42 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `updateCombat()` connect `combat.js` to `World.jsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `World.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14761904761904762 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._