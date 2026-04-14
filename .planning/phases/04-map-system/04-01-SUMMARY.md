---
phase: "04"
plan: "01"
subsystem: map-system
tags: [map-system, refactor, data-driven, phaser3, matter-js]
dependency_graph:
  requires: []
  provides: [map-config-api, map-loader-system]
  affects: [GameScene, future-map-plans]
tech_stack:
  added: [src/config/maps.js, src/systems/MapLoader.js]
  patterns: [data-driven-config, static-function-modules]
key_files:
  created:
    - src/config/maps.js
    - src/systems/MapLoader.js
  modified:
    - src/scenes/GameScene.js
decisions:
  - "Crossbar physics bodies kept in createObstacles (structural arena elements, not goal-scoring logic)"
  - "Goal-back wall x positions preserved from original _createWalls() exact values (-thick and w+thick), not plan's suggested -thick/2"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-14"
  tasks_completed: 3
  files_changed: 3
---

# Phase 04 Plan 01: Map System Infrastructure Summary

Data-driven map system with MAPS config array, MapLoader module (drawBackground + createObstacles), and GameScene refactored to delegate all arena rendering and physics to MapLoader via mapId.

## What Was Built

- `src/config/maps.js`: Exports `MAPS` array with `stadium` config containing all background colors, physics values, empty obstacles/windForce/specialZones. `getMap(id)` throws on unknown ID; `getMaps()` returns full array.
- `src/systems/MapLoader.js`: `drawBackground(scene, mapConfig)` ports the old `_drawArena()` exactly, reading all color constants from `mapConfig.background.*`. `createObstacles(scene, mapConfig)` ports `_createWalls()` exactly (floor, ceiling, outer walls, goal-back walls, crossbars), then iterates `mapConfig.obstacles` to spawn physics bodies and visuals for box/circle/ramp/platform types.
- `src/scenes/GameScene.js`: `init()` reads `data.mapId ?? 'stadium'`. `create()` calls `getMap` then delegates to `MapLoader`. `_drawArena()` and `_createWalls()` deleted (0 dead code remaining).

## Verification

- `npm run build` completed with no errors (19 modules, 385ms)
- `getMap('stadium')` returns correct object; `getMap('nope')` throws `Unknown map: nope`
- `getMaps()` returns array of length 1
- Build output confirms all imports resolve correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Crossbar physics bodies preserved in MapLoader**
- **Found during:** Task 2 / Task 3
- **Issue:** The plan's boundary note said "goal posts, crossbars stay in GameScene._createGoals()" but `_createGoals()` only creates goal zone sensors. The crossbar physics bodies were in `_createWalls()`. Deleting `_createWalls()` without moving the crossbars would have removed physics collision for overhead shots.
- **Fix:** Included crossbar bodies (`label: 'goalpost'`) in `createObstacles()` as structural arena elements. This preserves identical physics to pre-refactor.
- **Files modified:** `src/systems/MapLoader.js`
- **Commit:** 74bb9b9

**2. [Rule 1 - Bug] Goal-back wall x positions use original exact values**
- **Found during:** Task 2
- **Issue:** Plan's code snippet used `-thick/2` (= -20) and `w + thick/2` for goal-back walls, but original `_createWalls()` used `-thick` (= -40) and `w + thick`. Plan stated "identical physics" as a requirement.
- **Fix:** Used original `_createWalls()` exact x values (`-thick` and `w + thick`) to preserve identical physics behavior.
- **Files modified:** `src/systems/MapLoader.js`
- **Commit:** 74bb9b9

## Known Stubs

None. The `obstacles`, `windForce`, and `specialZones` fields in the stadium config are intentionally empty — future map plans (05-Morocco, 06-Asia-NYC, 07-US) will populate them.

## Self-Check: PASSED
