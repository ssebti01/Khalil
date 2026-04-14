---
phase: "05"
plan: "01"
subsystem: "maps"
tags: [maps, decoration, phaser, physics, morocco]
dependency_graph:
  requires: [04-01, 04-02]
  provides: [rabat-map, bouskoura-map]
  affects: [GameScene, MenuScene, MapLoader]
tech_stack:
  added: []
  patterns: [decoration-hook, data-driven-map-config]
key_files:
  created: []
  modified:
    - src/config/maps.js
    - src/systems/MapLoader.js
key_decisions:
  - "Decoration hook placed after goal posts in drawBackground() to ensure decorations render on top of base elements"
  - "Map configs are fully self-contained: background, decoration function, obstacles, and physics overrides all in maps.js"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-14"
  tasks_completed: 3
  files_modified: 2
---

# Phase 05 Plan 01: Morocco Maps — Rabat and Bouskoura Forest Summary

## One-liner

Added Rabat (terracotta urban medina) and Bouskoura Forest (dark green forest clearing) maps using a decoration hook pattern that keeps all map-specific art self-contained in maps.js.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Add decoration hook to MapLoader.drawBackground() | 592e67f | Done |
| 2 | Add Rabat and Bouskoura map configs to maps.js | 08602e2 | Done |
| 3 | Visual and physics smoke test (build verification) | — | Done |

## What Was Built

### Task 1: Decoration Hook in MapLoader

Added a 4-line hook at the end of `drawBackground()` in `src/systems/MapLoader.js`:

```javascript
// Optional per-map decoration (minarets, trees, etc.)
if (mapConfig.decoration) {
  mapConfig.decoration(scene, g);
}
```

The hook runs after all base layers (sky, crowd, pitch, nets, goal posts) so decorations render on top. The `g` graphics object is already in scope from the top of the function. Stadium map is unaffected — it has no `decoration` field.

### Task 2: Map Configs in maps.js

**Rabat (id: 'rabat'):**
- Deep orange/terracotta night sky gradient (0x1a0a00 → 0x3d1a00)
- Terracotta brown pitch (0x8b4513)
- Decoration: 2 minaret silhouettes (shaft + band + spire) + crenellated rooftop wall across crowd zone
- 3 obstacles: center divider box (80x60, restitution 0.4) + 2 angled ramps near each goal (140x18, ±0.18 rad)
- floorFriction: 0.05

**Bouskoura Forest (id: 'bouskoura'):**
- Dark green forest gradient (0x0a1a05 → 0x1a3a0a)
- Forest green pitch (0x2a5a1a)
- Decoration: 4 tree silhouettes (trunk rectangles + canopy circles) in 2 clusters left/right
- 3 obstacles: 2 tree trunk pillars (28x80, restitution 0.3) + fallen log center (180x30, restitution 0.5 — bouncy)
- floorFriction: 0.001 (slippery leaves)

### Task 3: Build Verification

`npm run build` succeeded — 19 modules transformed with no errors. The MAPS array now has 3 entries; getMap() and getMaps() require no changes as they are fully generic.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Both maps are fully wired: MAPS array exports them, getMaps() returns all 3, map selector cycles through them (Phase 4 implementation is generic), and GameScene loads obstacles via MapLoader.createObstacles().

## Self-Check

- [x] src/config/maps.js exists and has 3 MAPS entries
- [x] src/systems/MapLoader.js has decoration hook
- [x] Task 1 commit 592e67f exists
- [x] Task 2 commit 08602e2 exists
- [x] Build passes clean (19 modules, no errors)
