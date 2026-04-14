# 07-02 Punch List

## Test Date: 2026-04-14

## Method: Static code analysis (no-browser environment)

Each check was verified by reading source files directly. PASS = code evidence found;
FAIL = evidence missing or incorrect; SKIP = not applicable to this map.

| Map | Goal | Pause | P1 Drift | Head Wobble | Obstacles | Special Zone | CPU OK | 2P OK | Result Screen | Notes |
|-----|------|-------|----------|-------------|-----------|--------------|--------|-------|---------------|-------|
| stadium   | PASS | PASS* | PASS | PASS | N/A (none) | N/A | PASS | PASS | PASS | *Restart loses mapId — see STADIUM-1 |
| rabat     | PASS | PASS* | PASS | PASS | PASS (box+ramp) | N/A | PASS | PASS | PASS | *Same restart bug |
| bouskoura | PASS | PASS* | PASS | PASS | PASS (box) | N/A | PASS | PASS | PASS | *Same restart bug |
| shanghai  | PASS | PASS* | PASS | PASS | PASS (box+circle) | N/A | PASS | PASS | PASS | *Same restart bug |
| chicago   | PASS | PASS* | PASS | PASS | PASS (box) | PASS (wind gust timer) | PASS | PASS | PASS | *Same restart bug |
| houston   | PASS | PASS* | PASS | PASS | PASS (circle+box) | N/A | PASS | PASS | PASS | *Same restart bug; ramp angle=8 (deg not rad) — see HOUSTON-1 |
| nyc       | PASS | PASS* | PASS | PASS | PASS (circle+box) | PASS (trampoline sensor) | PASS | PASS | PASS | *Same restart bug |

## Issues Found

### ALL-MAPS-1: PauseScene Restart Match loses mapId
- **Symptom**: Pressing "Restart Match" in pause overlay reloads the game on the stadium (default) map instead of the current map, regardless of which map was selected.
- **Reproduction**: Select any non-stadium map (e.g. NYC). Start game. Press ESC. Click "Restart Match". Map reverts to Stadium.
- **Likely cause**: `PauseScene.js` line 60 — `_restart()` calls `this.scene.get('GameScene').scene.restart(data)` where `data = this.initData` = `{ p1CharId, p2CharId, vsMode }`. The `mapId` field is never included because `GameScene.create()` only passes those three fields to PauseScene via `this.scene.launch('PauseScene', { p1CharId, p2CharId, vsMode })`.
- **Fix**: Add `mapId: this.mapId` to the data object passed when launching PauseScene in `GameScene.js`, and update `PauseScene._restart()` to forward it.

### HOUSTON-1: Ramp angle 8 is in degrees, not radians
- **Symptom**: The launch ramp obstacle in Houston has `angle: 8` in `maps.js`. Matter.js bodies use radians for the angle property in `bodyOpts`. 8 radians ≈ 458 degrees (about 1.27 full rotations), making the ramp nearly horizontal or randomly oriented rather than a gentle launch angle. The visual uses `Math.cos(obs.angle)` / `Math.sin(obs.angle)` which will be wildly wrong too.
- **Reproduction**: Load Houston map — ramp body physics and visual polygon will be misaligned.
- **Likely cause**: `maps.js` houston obstacles array — `{ type: 'box', ..., angle: 8, ... }`. The correct value should be `angle: 0.14` (approximately 8 degrees in radians).
- **Fix**: Change `angle: 8` to `angle: 0.14` (8° in radians ≈ 0.1396).

## Resolved Issues

(Issues moved here after fixes are applied)
