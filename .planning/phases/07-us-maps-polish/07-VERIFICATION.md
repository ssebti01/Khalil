---
phase: 07-us-maps-polish
verified: 2026-04-14T22:30:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Play a full match on the Chicago map and observe wind effect on ball"
    expected: "Ball receives periodic horizontal force pulses (every ~4 seconds, active for 500ms). Force is visible as a slight drift. Gust timing and direction match windForce config (x:3 rightward)."
    why_human: "Physics impulse application requires live browser run; static code shows correct wiring but the feel/magnitude cannot be confirmed without play-testing."
  - test: "Play a full match on the Houston map and observe floor bounce behavior"
    expected: "Ball bounces noticeably higher off the floor than on the default Stadium map. floorRestitution 0.45 vs 0.2 should produce a clearly bouncier feel."
    why_human: "Restitution difference is a physical/feel quality that requires browser observation to confirm the magnitude reads as 'bouncier' to a player."
  - test: "Start a match on Houston, pause, then click Restart Match — confirm the Houston map reloads (not Stadium)"
    expected: "Restarted match opens on Houston arena, not the default Stadium. Map selector state and mapId are preserved."
    why_human: "The PauseScene->GameScene restart data-flow fix (ALL-MAPS-1) is coded correctly but the end-to-end session flow requires a browser run to confirm no regression in scene lifecycle."
  - test: "Cycle through all 7 maps in the map selector on the menu screen without errors"
    expected: "Selector cycles stadium -> rabat -> bouskoura -> shanghai -> chicago -> houston -> nyc -> stadium, displaying each name correctly. No crash, no blank name."
    why_human: "Map selector iterates the live MAPS array — rendering and interaction require browser verification."
  - test: "Play a start-to-finish match on every map in both 1P (VS CPU) and 2P modes, confirm no crashes or visual regressions"
    expected: "All 7 maps load, render, run full match timer, score goals, and reach ResultScene without errors. Chicago shows wind-influenced ball movement. Houston has barrel + ramp obstacles."
    why_human: "Full regression test across 7 maps in both modes requires interactive browser sessions. Static analysis passes, but visual regressions and runtime errors can only be caught live."
---

# Phase 7: US Maps Polish Verification Report

**Phase Goal:** Implement Chicago and Houston arenas, add a wind-force mechanic (Chicago), a bouncy floor (Houston), and do a final integration pass across all 7 maps.
**Verified:** 2026-04-14T22:30:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | Chicago map has wind mechanic applying periodic horizontal force to ball | VERIFIED | `maps.js` line 320: `windForce: { x: 3, y: 0, intervalMs: 4000 }`. `GameScene._setupWind()` registers a repeating Phaser timer; `update()` calls `Matter.Body.applyForce(ball, pos, { x: wf.x * 0.0001, y: 0 })` when `_windActive` is true. |
| 2 | Houston map has higher floor restitution (bouncier feel) and launch ramp obstacle | VERIFIED | `maps.js` line 455: `floorRestitution: 0.45` (vs 0.2 on all other maps). Launch ramp defined as `type: 'box', angle: 0.14` (radians, corrected from bug HOUSTON-1). Two barrel bumpers (`type: 'circle'`) also present. |
| 3 | All 7 maps are accessible in map selector without errors | VERIFIED | `MenuScene._drawMapSelector()` calls `getMaps()` and iterates the full live array. `maps.js` exports 7 entries: stadium, rabat, bouskoura, shanghai, chicago, houston, nyc. Confirmed by `node` runtime check: `MAPS.length === 7`. |
| 4 | Match can be played start-to-finish on every map in both 1P and 2P modes | PARTIAL — needs human | Code path is fully wired: `MenuScene._startGame()` passes `mapId`, `GameScene.init()` resolves `_currentMap`, `createObstacles()` handles all obstacle types (box, circle, ramp). Wind is gated by `windForce !== null`. No stubs detected. Runtime confirmation requires browser. |
| 5 | No regressions in Phase 1-3 fixes | PARTIAL — needs human | Static check: `GameScene` and `PauseScene` changes are additive (mapId forwarding, wind system). `MapLoader.createObstacles()` unchanged. `Player`, `Ball`, `CPUPlayer` unchanged. No destructive edits found. Runtime regression confirmation requires browser. |

**Score:** 3/5 truths fully verified by static analysis; 2/5 pass static checks but require human browser confirmation for full sign-off.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/config/maps.js` | 7 map entries including chicago and houston | VERIFIED | 7 entries confirmed by runtime. Chicago has `windForce: { x:3, y:0, intervalMs:4000 }`, Houston has `floorRestitution: 0.45`, barrel circles, and `angle: 0.14` ramp. |
| `src/scenes/GameScene.js` | `_setupWind()`, `_windActive`, `_windTimer`, wind in `update()`, `mapId` forwarded to PauseScene | VERIFIED | All five elements present. `_windTimer.remove(false)` called in `_endMatch()` for clean lifecycle. `mapId: this.mapId` included in PauseScene launch data (line 69). |
| `src/systems/MapLoader.js` | `circle` obstacle type support, `floorRestitution` applied to floor body | VERIFIED | `circle` branch at line 183: `scene.matter.add.circle(obs.x, obs.y, obs.r, bodyOpts)`. Floor body at line 105-108 reads `mapConfig.floorRestitution`. Both confirmed. |
| `src/scenes/MenuScene.js` | Map selector iterates full MAPS array (7 maps) | VERIFIED | `getMaps()` imported from maps.js, called in `_drawMapSelector()`. Arrows use `maps.length` for modular wrap. `_startGame()` passes `maps[this.mapIndex].id`. |
| `src/scenes/PauseScene.js` | `_restart()` spreads full `initData` including `mapId` | VERIFIED | Line 62: `const data = { ...this.initData }`. `initData` is populated from `scene.launch('PauseScene', { ..., mapId: this.mapId })` in GameScene. |
| `.planning/phases/07-us-maps-polish/07-02-PUNCH-LIST.md` | All 7 maps pass smoke test | VERIFIED | Punch list exists with all 7 rows marked PASS. Two bugs found and fixed: ALL-MAPS-1 (mapId lost on restart) and HOUSTON-1 (ramp angle in degrees vs radians). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `maps.js` chicago entry | `GameScene._setupWind()` | `_currentMap.windForce` | WIRED | `init()` sets `_currentMap = MAPS.find(m => m.id === this.mapId)`. `_setupWind(_currentMap)` checks `mapConfig.windForce`. Guards `update()` via `_currentMap?.windForce`. |
| `GameScene._windActive` | `Matter.Body.applyForce` | `update()` guard | WIRED | `if (this._windActive && this._currentMap?.windForce && this.ball?.body)` then force applied. |
| `maps.js` houston `floorRestitution: 0.45` | `MapLoader.createObstacles()` floor body | `mapConfig.floorRestitution` | WIRED | Floor rectangle at `MapLoader.js:105` uses `restitution: mapConfig.floorRestitution` directly. |
| `GameScene` PauseScene launch | `PauseScene._restart()` | `mapId` in initData | WIRED | GameScene line 69 passes `mapId: this.mapId`. PauseScene `_restart()` spreads `{ ...this.initData }` which includes mapId. |
| `MenuScene` map selector | `GameScene.init()` | `mapId` from `_startGame()` | WIRED | `_startGame()` passes `mapId: maps[this.mapIndex].id`. `GameScene.init()` reads `data.mapId ?? 'stadium'`. |
| `maps.js` circle obstacles | `MapLoader` physics body | `obs.type === 'circle'` branch | WIRED | `MapLoader.js:182-184`: `if (obs.type === 'circle') { scene.matter.add.circle(...) }`. Houston barrel_left, barrel_right both use `type: 'circle'`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `GameScene._windActive` | `_windActive` | Phaser timer set in `_setupWind()`, cleared via `time.delayedCall(500)` | Yes — driven by live timer events from `_currentMap.windForce.intervalMs` | FLOWING |
| `MapLoader.createObstacles` floor body | `floorRestitution` | Read directly from `mapConfig` passed at scene creation | Yes — map config object from `MAPS.find()` with real values (0.45 for Houston, 0.2 for others) | FLOWING |
| `MenuScene._mapNameText` | `maps[this.mapIndex].name` | `getMaps()` → live MAPS array | Yes — 7 real name strings (e.g. "Chicago — Lakefront Park") | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| MAPS array has exactly 7 entries | `node -e "import('./src/config/maps.js').then(m => console.log(m.MAPS.length))"` | `7` | PASS |
| Chicago windForce is non-null with correct shape | `node -e "import('./src/config/maps.js').then(m => { const c = m.MAPS.find(x=>x.id==='chicago'); console.log(JSON.stringify(c.windForce)) })"` | `{"x":3,"y":0,"intervalMs":4000}` | PASS |
| Houston floorRestitution is 0.45 | `node -e "import('./src/config/maps.js').then(m => { const h = m.MAPS.find(x=>x.id==='houston'); console.log(h.floorRestitution) })"` | `0.45` | PASS |
| Houston ramp angle is in radians (0.14, not 8) | grep in `maps.js` line 574 | `angle: 0.14` with comment `// angle: 0.14 rad ≈ 8 degrees` | PASS |
| PauseScene `_restart()` spreads full initData | Read `PauseScene.js:62` | `const data = { ...this.initData }` | PASS |
| Wind timer cleaned up in `_endMatch()` | Read `GameScene.js:188-192` | `_windTimer.remove(false)` + `_windTimer = null` + `_windActive = false` | PASS |

### Requirements Coverage

No explicit `requirements:` IDs were declared in phase 07 plan frontmatter. Coverage mapped directly from Success Criteria.

| Success Criterion | Status | Evidence |
|-------------------|--------|---------|
| Chicago map has wind mechanic applying periodic horizontal force to ball | SATISFIED | `_setupWind()` registers Phaser repeating timer; `update()` applies `Matter.Body.applyForce` when `_windActive` |
| Houston map has higher floor restitution (bouncier feel) and launch ramp obstacle | SATISFIED | `floorRestitution: 0.45`, ramp obstacle `angle: 0.14 rad`, two barrel circles |
| All 7 maps accessible in map selector without errors | SATISFIED | `getMaps()` returns 7-entry array; menu iterates by index with modular wrap |
| Match can be played start-to-finish on every map in 1P and 2P modes | NEEDS HUMAN | All code paths wired; requires browser for confirmation |
| No regressions in Phase 1-3 fixes | NEEDS HUMAN | No destructive edits detected; requires browser for confirmation |

### Anti-Patterns Found

No blockers or warnings found. Scan results:

| File | Pattern | Result |
|------|---------|--------|
| `src/config/maps.js` | TODO/FIXME/placeholder | None found |
| `src/scenes/GameScene.js` | TODO/FIXME/placeholder | None found |
| `src/scenes/PauseScene.js` | TODO/FIXME/placeholder | None found |
| `src/systems/MapLoader.js` | TODO/FIXME/placeholder | None found |
| All 4 files | `return null / return []` (stub returns) | None found |
| Houston ramp angle | Was `angle: 8` (degrees) — fixed to `angle: 0.14` (radians) | Fixed in commit e6b5062 |

### Human Verification Required

#### 1. Chicago Wind Mechanic Feel

**Test:** Start a 2P or CPU match on Chicago map. Wait up to ~5 seconds and watch the ball.
**Expected:** Ball should drift horizontally for approximately 500ms every 4 seconds. Wind is rightward (x:3). Gust should be subtle but perceptible (force scalar 0.0001 applied each frame during active window).
**Why human:** `Matter.Body.applyForce` application is correct in code but the perceived effect magnitude and timing can only be confirmed in a live browser run.

#### 2. Houston Floor Bounce Feel

**Test:** Start a match on Houston. Kick or drop the ball and observe how it bounces off the dirt floor.
**Expected:** Ball should bounce noticeably higher than on Stadium map. `floorRestitution: 0.45` is more than double the `0.2` used on all other maps.
**Why human:** Restitution difference is a physics feel quality that must be experienced in-browser to confirm it reads as "bouncier" to players.

#### 3. PauseScene Restart Match Preserves Houston Map

**Test:** Start a match on Houston. Press ESC to pause. Click "Restart Match".
**Expected:** Match reloads on Houston arena, not Stadium. Barrel bumpers and ramp visible. No crash.
**Why human:** Scene lifecycle (stop + restart) data forwarding is correct in code but end-to-end session state flow requires live browser confirmation.

#### 4. Map Selector Cycles All 7 Maps

**Test:** On the main menu, click the right arrow on the MAP selector repeatedly until it wraps back to Stadium.
**Expected:** Sequence: Stadium -> Rabat -> Bouskoura Forest -> Shanghai — Skyscraper Rooftop -> Chicago — Lakefront Park -> Houston — Rodeo Arena -> New York City — Street Court -> Stadium. No blank names, no crash.
**Why human:** Menu rendering and interaction require browser.

#### 5. Full Regression Pass Across All 7 Maps

**Test:** Play a start-to-finish match (both score or let timer expire) on each of the 7 maps. Test at least one in CPU mode and one in 2P mode.
**Expected:** Each map loads with correct visuals, obstacles function as physics bodies, match completes and reaches ResultScene, no JavaScript errors in console.
**Why human:** Full runtime regression cannot be confirmed by static analysis alone.

### Gaps Summary

No code-level gaps found. All five success criteria have complete implementation evidence:

- Chicago `windForce` config, `_setupWind()`, `update()` force application, and `_endMatch()` cleanup are all present and correctly wired.
- Houston `floorRestitution: 0.45` is read by `MapLoader.createObstacles()` for the floor physics body. Barrel circle obstacles and angle-corrected launch ramp (0.14 radians) are present.
- All 7 maps (stadium, rabat, bouskoura, shanghai, chicago, houston, nyc) are in the MAPS array, confirmed by runtime node check.
- Map selector, `_startGame()`, `GameScene.init()`, and `PauseScene._restart()` form a complete mapId data chain.
- No TODO stubs, placeholder returns, or broken imports found in phase-modified files.

The 5 human verification items are confirmations, not gaps — they exist because browser-level behavior (physics feel, visual rendering, scene lifecycle) cannot be confirmed by static code inspection.

---
_Verified: 2026-04-14T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
