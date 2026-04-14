---
phase: 04-map-system
plan: "02"
subsystem: ui
tags: [phaser3, menu, map-selector, scene-data]

# Dependency graph
requires:
  - phase: 04-map-system/04-01
    provides: getMaps() function and MAPS array from src/config/maps.js
provides:
  - Map selector widget in MenuScene (horizontal ◄ MAP NAME ► at y=510)
  - mapId forwarded to GameScene via scene.start() init data
affects: [05-morocco-maps, 06-asia-nyc-maps, 07-us-maps-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [getMaps() called in MenuScene to drive selector, mapIndex preserved across scene.restart() via constructor property]

key-files:
  created: []
  modified:
    - src/scenes/MenuScene.js

key-decisions:
  - "mapIndex stored on scene instance (not via scene.restart data) — Phaser preserves constructor-initialized properties across restart()"
  - "Map selector centered at y=510 between character cards (bottom ~y=460) and KICK OFF button (y=570)"
  - "arrows use same style as character select arrows (◄/► 28px white, yellow on hover) for visual consistency"

patterns-established:
  - "Map selector widget: background strip + label + name text + left/right arrows, all driven by getMaps()"
  - "Scene data pattern: scene.start('GameScene', { p1CharId, p2CharId, vsMode, mapId }) — forward all selections"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-04-14
---

# Phase 4 Plan 02: Map Selector UI in MenuScene Summary

**Horizontal map selector widget (◄ Stadium ►) added to MenuScene at y=510, forwarding selected mapId to GameScene via scene.start() data**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-14T20:44:00Z
- **Completed:** 2026-04-14T20:52:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Map selector widget visible between character cards and KICK OFF button, horizontally centered
- Arrow buttons cycle mapIndex with wrap-around (single-map case handled gracefully — no crash)
- mapIndex preserved across mode toggle (scene.restart()) since it is set in constructor
- GameScene now receives mapId in scene init data on every kick-off

## Task Commits

Each task was committed atomically:

1. **Task 1: Add mapIndex state and _drawMapSelector() to MenuScene** - `ce3324c` (feat)
2. **Task 2: Pass mapId to GameScene on start** - `74c04a3` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `src/scenes/MenuScene.js` - Added getMaps import, mapIndex constructor init, _drawMapSelector() method, call in create(), and mapId in _startGame()

## Decisions Made
- mapIndex is a plain constructor property — no special handling needed for scene.restart() because Phaser preserves instance properties set before restart
- Selector positioned at y=510 to sit cleanly in the 110px gap between character cards bottom and KICK OFF button

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Map selector automatically surfaces new maps when added to MAPS array in maps.js
- Ready for 05-01 Morocco maps (rabat, bouskoura) — they will appear in selector without MenuScene changes
- GameScene.init() needs to handle mapId from scene data (reads it, defaults to 'stadium' if absent)

---
*Phase: 04-map-system*
*Completed: 2026-04-14*
