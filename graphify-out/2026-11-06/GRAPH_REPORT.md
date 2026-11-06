# Graph Report - ThreeJS-12  (2026-11-06)

## Corpus Check
- 8 files · ~5,400 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 88 nodes · 109 edges · 8 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6321032c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- state.js
- dependencies
- App.jsx
- package.json
- i2i-Academy-ThreeJS-12
- World.jsx
- audio.js

## God Nodes (most connected - your core abstractions)
1. `spawnPattern()` - 7 edges
2. `i2i-Academy-ThreeJS-12` - 5 edges
3. `scripts` - 4 edges
4. `GameLoop()` - 4 edges
5. `difficulty()` - 4 edges
6. `lerp()` - 3 edges
7. `rand()` - 3 edges
8. `@react-three/drei` - 2 edges
9. `@react-three/fiber` - 2 edges
10. `@react-three/postprocessing` - 2 edges

## Surprising Connections (you probably didn't know these)
- `spawnPattern()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/World.jsx → src/game/state.js
- `GameLoop()` --calls--> `difficulty()`  [EXTRACTED]
  src/game/World.jsx → src/game/state.js

## Import Cycles
- None detected.

## Communities (8 total, 0 thin omitted)

### Community 0 - "state.js"
Cohesion: 0.13
Nodes (15): ACCELERATION, createState(), DESPAWN_Z, INVULNERABLE_TIME, LANE_LIMIT, MAX_LIVES, MAX_MULTIPLIER, MAX_SPEED (+7 more)

### Community 1 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, react, react-dom, @react-three/drei, @react-three/fiber, @react-three/postprocessing, three, react (+5 more)

### Community 2 - "App.jsx"
Cohesion: 0.19
Nodes (7): App(), CAMERA_LOOK_AT, Obstacles(), Player(), randomLaneX(), styles, useKeyboardControls()

### Community 3 - "package.json"
Cohesion: 0.14
Nodes (13): devDependencies, vite, @vitejs/plugin-react, name, private, scripts, build, dev (+5 more)

### Community 4 - "i2i-Academy-ThreeJS-12"
Cohesion: 0.33
Nodes (5): Controls, Getting Started, i2i-Academy-ThreeJS-12, Roadmap, Tech Stack

### Community 5 - "World.jsx"
Cohesion: 0.14
Nodes (12): difficulty(), addObstacle(), addOrb(), CYAN, GameLoop(), GOLD, lerp(), ORANGE (+4 more)

### Community 6 - "audio.js"
Cohesion: 0.67
Nodes (3): audio(), sfx, tone()

## Knowledge Gaps
- **28 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+23 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 42 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _28 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `state.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `World.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._