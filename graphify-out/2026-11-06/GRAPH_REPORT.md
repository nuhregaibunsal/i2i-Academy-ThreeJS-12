# Graph Report - ThreeJS-12  (2026-11-06)

## Corpus Check
- 10 files · ~38,372 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 108 nodes · 185 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `50af1f12`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- state.js
- dependencies
- App.jsx
- package.json
- Driftline — a neon runner
- World.jsx
- audio.js
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

## Communities (9 total, 0 thin omitted)

### Community 0 - "state.js"
Cohesion: 0.14
Nodes (12): ACCELERATION, DESPAWN_Z, INVULNERABLE_TIME, MAX_LIVES, MAX_MULTIPLIER, MAX_SPEED, OBSTACLE_POOL, ORB_POOL (+4 more)

### Community 1 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, @react-three/postprocessing, three, react (+5 more)

### Community 2 - "App.jsx"
Cohesion: 0.19
Nodes (13): App(), loadBest(), saveBest(), createState(), resetState(), Floor(), Mountains(), Obstacles() (+5 more)

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, vite, @vitejs/plugin-react, name, private, scripts, build, dev (+5 more)

### Community 4 - "Driftline — a neon runner"
Cohesion: 0.29
Nodes (6): Controls, Driftline — a neon runner, Features, Project structure, Run locally, Tech stack

### Community 5 - "World.jsx"
Cohesion: 0.20
Nodes (15): difficulty(), addObstacle(), addOrb(), CYAN, EDGE_CYAN, EDGE_PINK, EDGE_WING, GameLoop() (+7 more)

### Community 6 - "audio.js"
Cohesion: 0.67
Nodes (3): audio(), sfx, tone()

### Community 8 - "combat.js"
Cohesion: 0.18
Nodes (21): addEnemy(), applyPickup(), clampLane(), createCombat(), dropPickup(), ENEMY, fire(), hurtPlayer() (+13 more)

## Knowledge Gaps
- **33 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+28 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 37 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `difficulty()` connect `World.jsx` to `combat.js`, `state.js`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _33 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14166666666666666 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._