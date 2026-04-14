---
phase: 06-asia-nyc-maps
plan: "01"
subsystem: maps
tags: [phaser3, matter.js, maps, backgrounds, obstacles, specialzones, trampoline]

# Dependency graph
requires:
  - phase: 05-morocco-maps
    provides: map system schema, MapLoader.js, maps.js MAPS array pattern
provides:
  - Shanghai Skyscraper Rooftop map (purple sunset, 4 obstacles)
  - NYC Street Court map (blue twilight, 3 obstacles, subway grate trampoline)
  - Function-based background support in MapLoader.drawBackground
  - specialZones trampoline support in MapLoader.createObstacles
affects: [07-us-maps-polish, map-selector, GameScene]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Function-based background: maps can use background(scene) => void instead of object config"
    - "specialZones trampoline: sensor body with impulseY stored on body for collision handler"

key-files:
  created: []
  modified:
    - src/config/maps.js
    - src/systems/MapLoader.js
    - tests/maps.test.js

key-decisions:
  - "Angles stored in radians (not degrees) to match existing ramp pattern in Rabat/Bouskoura maps"
  - "Function-based background skips legacy rendering path in drawBackground via typeof check"
  - "Trampoline sensor stores impulseY on the Matter.Body directly for collision handler access"
  - "Tests updated from 3-map count to 5-map count with 16 new test cases for Shanghai and NYC"

patterns-established:
  - "Trampoline impulse: clamp newVy = min(current vy, 0) + impulseY to avoid double-boosting upward balls"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-04-14
---

# Phase 06 Plan 01: Shanghai & NYC Maps Summary

**Shanghai (purple sunset, 4 physics obstacles) and NYC (blue twilight, subway grate trampoline) maps added via function-based backgrounds and extended MapLoader support**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-14T21:44:00Z
- **Completed:** 2026-04-14T21:52:01Z
- **Tasks:** 2 (Task 1: Shanghai map, Task 2: NYC map)
- **Files modified:** 3

## Accomplishments
- Added Shanghai Skyscraper Rooftop map with purple/magenta gradient sky, building silhouettes, concrete pitch, and 4 obstacles (2 angled bamboo scaffold platforms, 2 bouncy edge bumpers)
- Added NYC Street Court map with blue twilight sky, building silhouettes with lit windows, yellow taxis, asphalt pitch with faded basketball court lines, 3 obstacles (hydrant, taxi barrier, lamppost), and subway grate trampoline special zone
- Extended MapLoader.drawBackground to support function-based `background` property
- Implemented specialZones trampoline physics in MapLoader.createObstacles using Matter.js sensor + collision event
- Updated and extended test suite: 36 tests all passing (was 19 passing + 2 failing)

## Task Commits

1. **Task 1 + 2: Shanghai and NYC maps (combined)** - `1b9f752` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/config/maps.js` - Added shanghai and nyc map entries with function-based backgrounds, obstacles, and specialZones
- `src/systems/MapLoader.js` - Added function-based background support and specialZones trampoline implementation
- `tests/maps.test.js` - Updated map count assertions (3->5), added 16 new tests for Shanghai and NYC

## Decisions Made
- Angles stored in radians (0.0873 for 5°, -0.0873 for -5°) to be consistent with existing ramp obstacles in Rabat/Bouskoura which use radian angles
- Function-based background detection uses `typeof mapConfig.background === 'function'` check at the top of drawBackground — clean opt-in, no breaking change for legacy object-based maps
- Trampoline impulse stored on the Matter.Body as `body.impulseY` so the collision handler can read per-body configuration without a separate map lookup
- Velocity clamping `Math.min(ball.velocity.y, 0) + impulseY` prevents double-boosting balls already moving upward

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added function-based background support to MapLoader.drawBackground**
- **Found during:** Pre-task analysis
- **Issue:** Plan specifies `background: (scene) => void` function format for new maps, but MapLoader.drawBackground only supported the legacy object format. New maps would throw a runtime error.
- **Fix:** Added `typeof mapConfig.background === 'function'` check at the top of drawBackground — calls the function and returns early, bypassing the legacy path.
- **Files modified:** src/systems/MapLoader.js
- **Verification:** Node module import test confirms drawBackground would dispatch correctly; tests pass.
- **Committed in:** 1b9f752

**2. [Rule 2 - Missing Critical] Implemented specialZones trampoline in MapLoader.createObstacles**
- **Found during:** Pre-task analysis
- **Issue:** Plan schema includes `specialZones: [{ type: 'trampoline', ... }]` and plan context states MapLoader handles trampolines. Existing MapLoader had no specialZones handling — NYC's trampoline would silently do nothing.
- **Fix:** Added loop over `mapConfig.specialZones` in createObstacles that creates a static sensor body and wires a collisionstart handler that applies the impulseY velocity boost to the ball.
- **Files modified:** src/systems/MapLoader.js
- **Verification:** Tests verify specialZones structure and type; logic verified by code review.
- **Committed in:** 1b9f752

**3. [Rule 1 - Bug] Updated failing test count assertions**
- **Found during:** Post-implementation test run
- **Issue:** Two existing tests had hardcoded count of 3 maps; adding Shanghai and NYC caused them to fail with "expected 5 to have length 3".
- **Fix:** Updated assertions from 3 to 5 and added new map IDs to the order test. Added 16 new test cases covering Shanghai and NYC map properties.
- **Files modified:** tests/maps.test.js
- **Verification:** `npm test --run` shows 36 tests all passing.
- **Committed in:** 1b9f752

---

**Total deviations:** 3 auto-fixed (2 missing critical functionality, 1 bug fix)
**Impact on plan:** All auto-fixes were necessary for the maps to function. No scope creep.

## Issues Encountered
- The plan's obstacle angle schema specifies degrees but existing map obstacles use radians (Rabat ramps use `angle: -0.18` rad). Used radians (0.0873) for consistency with existing pattern rather than adding degree-to-radian conversion logic.

## Known Stubs
None — both maps are fully wired with physics, backgrounds, and (for NYC) trampoline behavior.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shanghai and NYC appear in the MAPS array and will automatically show in the map selector
- MapLoader now supports function-based backgrounds for future maps (Phase 7 US maps can use same pattern)
- Trampoline specialZone support is generic — future maps can add trampolines without MapLoader changes

---
*Phase: 06-asia-nyc-maps*
*Completed: 2026-04-14*
