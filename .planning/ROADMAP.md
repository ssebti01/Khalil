# Roadmap: Head Soccer Feature Update

## Overview

Polish and expand the Head Soccer Phaser 3 game with bug fixes, visual improvements, a pause menu, and a full map system supporting 6 themed arenas (Morocco, China, NYC, Chicago, Houston). Bugs ship first to ensure a solid foundation, then visual polish, then the new map infrastructure and content.

## Phases

- [x] **Phase 1: Bug Fixes** - Fix goal-stop physics and player movement drift
- [ ] **Phase 2: Head Visuals** - Bigger heads with wobble/spring physics on impact
- [ ] **Phase 3: Pause Menu** - ESC pause with resume/restart/home options
- [x] **Phase 4: Map System** - Data-driven map architecture with map selector UI (completed 2026-04-14)
- [x] **Phase 5: Morocco Maps** - Rabat and Bouskoura Forest arenas (completed 2026-04-14)
- [x] **Phase 6: Asia & NYC Maps** - Shanghai and New York City arenas (completed 2026-04-14)
- [x] **Phase 7: US Maps & Polish** - Chicago and Houston arenas, full integration pass (completed 2026-04-14)

## Phase Details

### Phase 1: Bug Fixes
**Goal**: Fix two game-breaking bugs: ball stops dead when touching the goal (should roll in freely), and player sometimes keeps moving without input (key state stuck).
**Depends on**: Nothing (first phase)
**Success Criteria** (what must be TRUE):
  1. Ball rolls naturally into goal and scores without stopping mid-goal
  2. Player stops horizontal movement promptly when directional key is released
  3. Bug is reproducible and verified fixed in both 1P vs CPU and 2P modes
**Plans**: 2 plans

Plans:
- [x] 01-01: Fix goal physics — remove stopping body / adjust back wall restitution so ball passes through goal zone naturally
- [x] 01-02: Fix movement drift — audit Player.js key-state tracking and ensure velocity zeroed correctly on key release

### Phase 2: Head Visuals
**Goal**: Increase character head display size and add spring-based wobble physics so heads feel bouncy and alive on jumps, ball contact, and abilities.
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Head sprite is visibly larger than current 96px (target ~120-128px)
  2. Head wobbles/squishes on jump landing, ball contact, and ability activation
  3. Physics collision body is unchanged (only visual sprite is animated)
  4. Wobble decays naturally (no perpetual oscillation)
**Plans**: 1 plan

Plans:
- [ ] 02-01: Increase HEAD_DISPLAY_SIZE and implement spring-based wobble using Phaser tweens or manual spring simulation triggered by game events

### Phase 3: Pause Menu
**Goal**: Add an ESC-triggered pause overlay during gameplay with Resume, Restart Match, and Return to Home options.
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. Pressing ESC during GameScene freezes physics and shows pause overlay
  2. "Resume" restores game state exactly as it was
  3. "Restart Match" resets to same character and map config
  4. "Return to Menu" navigates to MenuScene cleanly
  5. Timer and ability cooldowns stop updating during pause
**Plans**: 1 plan

Plans:
- [ ] 03-01: Implement PauseScene or overlay with Matter.js pause, ESC key toggle, and three action buttons

### Phase 4: Map System
**Goal**: Refactor the hard-coded arena into a data-driven map system, add a map selection UI to MenuScene, and support per-map obstacles and floor physics modifiers.
**Depends on**: Phase 1
**Success Criteria** (what must be TRUE):
  1. `src/config/maps.js` defines a structured data format for maps (background, obstacles, floor modifiers)
  2. `MapLoader` spawns correct physics bodies from map data
  3. GameScene accepts `mapId` in init data and loads the corresponding map
  4. MenuScene shows a map selector (all maps visible, one selectable)
  5. Default "Stadium" map still plays identically to current behavior
**Plans**: 2 plans

Plans:
- [x] 04-01: Create `src/config/maps.js` schema + `src/systems/MapLoader.js`; refactor GameScene._drawArena and _createWalls to be data-driven
- [x] 04-02: Add map selection UI to MenuScene; wire mapId through GameScene init data

### Phase 5: Morocco Maps
**Goal**: Implement two Morocco-themed arenas (Rabat medina rooftop, Bouskoura Forest clearing) using the Phase 4 map system.
**Depends on**: Phase 4
**Success Criteria** (what must be TRUE):
  1. Rabat map loads with distinct visual background and at least 2 obstacles (e.g., brick wall + angled ramp)
  2. Bouskoura map loads with forest visual and at least 2 obstacles (e.g., tree trunk platforms)
  3. CPU AI functions without errors on both maps
  4. Both maps are selectable from the map selector
**Plans**: 1 plan

Plans:
- [x] 05-01: Implement Rabat and Bouskoura maps in maps.js with procedural Phaser canvas backgrounds and obstacle definitions

### Phase 6: Asia & NYC Maps
**Goal**: Implement two internationally-themed arenas (Shanghai rooftop, New York City street court).
**Depends on**: Phase 5
**Success Criteria** (what must be TRUE):
  1. Shanghai map has distinct skyline background and 2+ obstacles (e.g., bamboo scaffold platform)
  2. NYC map has distinct background and 2+ obstacles (e.g., fire hydrant bump, taxi obstacle)
  3. NYC map includes one special-mechanic zone (e.g., subway grate trampoline)
  4. CPU AI functions on both maps
**Plans**: 1 plan

Plans:
- [x] 06-01: Implement Shanghai and NYC maps in maps.js with procedural backgrounds and obstacle/special-zone definitions

### Phase 7: US Maps & Polish
**Goal**: Implement Chicago and Houston arenas, add a wind-force mechanic (Chicago), a bouncy floor (Houston), and do a final integration pass across all 7 maps.
**Depends on**: Phase 6
**Success Criteria** (what must be TRUE):
  1. Chicago map has wind mechanic applying periodic horizontal force to ball
  2. Houston map has higher floor restitution (bouncier feel) and launch ramp obstacle
  3. All 7 maps (default + 6 new) are accessible in map selector without errors
  4. Match can be played start-to-finish on every map in both 1P and 2P modes
  5. No regressions in Phase 1-3 fixes
**Plans**: 2 plans

Plans:
- [x] 07-01: Implement Chicago and Houston maps in maps.js; add wind-force system for Chicago
- [x] 07-02: Integration smoke test all 7 maps; fix any regressions; polish map selector UI

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Bug Fixes | 2/2 | Complete | 2026-04-14 |
| 2. Head Visuals | 0/1 | Not started | - |
| 3. Pause Menu | 0/1 | Not started | - |
| 4. Map System | 2/2 | Complete   | 2026-04-14 |
| 5. Morocco Maps | 1/1 | Complete   | 2026-04-14 |
| 6. Asia & NYC Maps | 1/1 | Complete   | 2026-04-14 |
| 7. US Maps & Polish | 2/2 | Complete   | 2026-04-14 |
| 8. Ability System Polish | 2/2 | Complete   | 2026-04-14 |

### Phase 8: Ability System Polish

**Goal:** Fix the ability-branch id-mismatch bug so all five abilities (fire/ice/thunder/ninja/tiny) actually execute for their matching characters (khalil/beboush/lilya/fafa/sara), close the tiny delayed-callback hazard, and replace the clipped bottom-corner cooldown bars with a top-center emoji+countdown HUD that pulses/glows with each character's accentColor when ready.
**Requirements**: D-01, D-02, D-03, D-04, D-05 (from 08-CONTEXT.md)
**Depends on:** Phase 5
**Plans:** 2/2 plans complete

Plans:
- [x] 08-01-PLAN.md — Ability logic audit & fix: rewrite `_useAbility()` branches to match real `char.id` values, add `ABILITIES.ice.freezeDuration`, add tiny near-center guard, fix GameScene init defaults, add pure-logic regression tests in `tests/abilities.test.js`
- [x] 08-02-PLAN.md — HUD redesign: remove `_buildAbilityBar`/`_drawAbilBar`, add `_buildAbilityHUD` + `_updateAbilityHUD` in UIScene placing emoji+countdown below the score bar with edge-triggered pulse tween and accentColor glow
