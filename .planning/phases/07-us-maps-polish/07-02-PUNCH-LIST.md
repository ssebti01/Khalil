# 07-02 Punch List

## Test Date: 2026-04-14

## Method: Static code analysis (no-browser environment)

Each check was verified by reading source files directly. PASS = code evidence found;
FAIL = evidence missing or incorrect; SKIP = not applicable to this map.

| Map | Goal | Pause | P1 Drift | Head Wobble | Obstacles | Special Zone | CPU OK | 2P OK | Result Screen | Notes |
|-----|------|-------|----------|-------------|-----------|--------------|--------|-------|---------------|-------|
| stadium   | PASS | PASS | PASS | PASS | N/A (none) | N/A | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |
| rabat     | PASS | PASS | PASS | PASS | PASS (box+ramp) | N/A | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |
| bouskoura | PASS | PASS | PASS | PASS | PASS (box) | N/A | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |
| shanghai  | PASS | PASS | PASS | PASS | PASS (box+circle) | N/A | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |
| chicago   | PASS | PASS | PASS | PASS | PASS (box) | PASS (wind gust timer) | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |
| houston   | PASS | PASS | PASS | PASS | PASS (circle+box) | N/A | PASS | PASS | PASS | Restart fixed; ramp angle fixed (HOUSTON-1) |
| nyc       | PASS | PASS | PASS | PASS | PASS (circle+box) | PASS (trampoline sensor) | PASS | PASS | PASS | Restart fixed (ALL-MAPS-1) |

## Issues Found

(All issues moved to Resolved section below)

## Resolved Issues

### ALL-MAPS-1: PauseScene Restart Match loses mapId
- **Symptom**: Pressing "Restart Match" in pause overlay reloaded the game on the stadium (default) map instead of the current map.
- **Root cause**: `GameScene.js` launched PauseScene without `mapId` in the data object. PauseScene `_restart()` forwarded only `{ p1CharId, p2CharId, vsMode }`.
- **Fix applied**:
  - `src/scenes/GameScene.js`: added `mapId: this.mapId` to the `scene.launch('PauseScene', ...)` call.
  - `src/scenes/PauseScene.js`: `_restart()` now spreads `this.initData` (which now includes `mapId`) via `{ ...this.initData }` before forwarding.
- **Commit**: task 2 commit (see SUMMARY)

### HOUSTON-1: Ramp angle 8 was in degrees, not radians
- **Symptom**: Houston launch ramp `angle: 8` was interpreted as 8 radians (~458°) by Matter.js, causing the physics body and visual polygon to be wildly misaligned.
- **Root cause**: `src/config/maps.js` houston ramp obstacle used `angle: 8` (degrees) instead of the correct radian value.
- **Fix applied**: Changed `angle: 8` to `angle: 0.14` (≈ 8° in radians) in `src/config/maps.js` houston obstacles array, with a clarifying comment.
- **Commit**: task 2 commit (see SUMMARY)
