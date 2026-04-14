---
phase: 08-ability-system-polish
plan: "02"
subsystem: ui
tags: [phaser3, hud, tweens, cooldown, emoji, uiscene]

# Dependency graph
requires:
  - phase: 08-01
    provides: "Ability logic wired to correct char.id values and ABILITY_COOLDOWN constant — HUD now visualizes real cooldown state"
provides:
  - "Top-center ability HUD in UIScene replacing clipped bottom-corner bars"
  - "_buildAbilityHUD / _updateAbilityHUD methods with edge-triggered pulse tween lifecycle"
  - "Per-character emoji icon + countdown number + accentColor glow"
affects:
  - UIScene
  - any future HUD modifications

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge-triggered tween lifecycle via wasReady flag — prevents tween stacking on rapid ability use"
    - "Per-frame Graphics.clear() + fillCircle for glow — cheaper than conditional create/destroy"
    - "Lazy char init in _updateAbilityHUD — HUD created before gs.p1/gs.p2 are available"

key-files:
  created: []
  modified:
    - src/scenes/UIScene.js

key-decisions:
  - "HUD placed at y=97 (just below timer at y=80) with P1 at x=500 (GAME_WIDTH/2 - 140), P2 at x=780 (GAME_WIDTH/2 + 140)"
  - "Glow redrawn every frame via Graphics.clear()+fillCircle rather than cached — avoids conditional lifecycle complexity, cost is negligible"
  - "Edge-triggered pulse via hud.wasReady flag — tween started exactly once on cooldown→ready, stopped+nulled on ready→cooldown"

patterns-established:
  - "Tween lifecycle guard: wasReady boolean flag prevents stacking tweens across repeated ability fires"
  - "Lazy text init: check hud.icon.text !== char.emoji before setText to avoid redundant Phaser text updates every frame"

requirements-completed: [D-01, D-02, D-03]

# Metrics
duration: 30min
completed: 2026-04-14
---

# Phase 8 Plan 02: Ability HUD Redesign Summary

**Replaced clipped bottom-corner ability bars with a top-center emoji+countdown HUD using edge-triggered pulse tweens and per-character accentColor glow in UIScene**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-14
- **Completed:** 2026-04-14
- **Tasks:** 3 (2 auto + 1 human verify)
- **Files modified:** 1

## Accomplishments

- Removed `_buildAbilityBar`, `_drawAbilBar`, `_p1AbilBar`, `_p2AbilBar` — old bottom-corner bars fully gone
- Added `_buildAbilityHUD` to scaffold two HUD clusters (emoji icon + countdown text + glow graphics) below the score bar at y=97
- Added `_updateAbilityHUD` with edge-triggered pulse tween lifecycle (start exactly once on cooldown→ready, stop+null on ready→cooldown, reset alpha/scale) and per-frame accentColor glow
- Human verification passed: both emoji icons visible below score bar, pulse/glow correct per character, countdown ticks 8→1 and disappears on ready, old bars gone

## HUD Position Rationale

P1 HUD at `x = GAME_WIDTH/2 - 140 = 500`, P2 HUD at `x = GAME_WIDTH/2 + 140 = 780`, both at `y = 97`.

- Score bar occupies y=10..70; timer is at y=80; y=97 places the HUD cluster 17px below the timer — visually below the score block without crowding
- ±140 offset centers each icon roughly under the corresponding player's score digit (P1 score at x=570, P2 score at x=710) while staying close to center-screen

## Glow: Per-Frame Redraw vs Cached

The glow circle is redrawn every frame using `Graphics.clear()` + `fillStyle` + `fillCircle`. An alternative would be to create the circle object once and show/hide it. Per-frame redraw was chosen because:

1. `Graphics.clear()` + `fillCircle` is a handful of draw calls — cost is negligible at 60fps for 2 objects
2. Avoids a conditional creation/destruction lifecycle that mirrors the pulse tween lifecycle (two separate state machines to keep in sync)
3. Simpler code: the entire glow is contained in 3 lines at the bottom of `_updateAbilityHUD`

## Pulse-Tween Lifecycle

```
cooldown→ready (ratio crosses 1):
  hud.wasReady was false → NOW true
  Create tween: alpha 1→0.45 + scale 1→1.12, yoyo, repeat:-1
  Store in hud.pulseTween

ready→cooldown (ratio drops below 1):
  hud.wasReady was true → NOW false
  hud.pulseTween.stop()
  hud.pulseTween = null
  hud.icon.setAlpha(1).setScale(1)   ← explicit reset prevents frozen mid-tween state
```

The `wasReady` flag is the edge trigger. Without it, every frame where ratio >= 1 would call `tweens.add()`, stacking infinite tweens (RESEARCH.md Pitfall 2).

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove old ability bars, scaffold top-center HUD cluster** - `b56ac41` (feat)
2. **Task 2: Implement _updateAbilityHUD with pulse tween lifecycle** - `f700c1b` (feat)
3. **Task 3: Human verification** - APPROVED (no code commit)

## Files Created/Modified

- `src/scenes/UIScene.js` — removed bottom-corner bar methods, added `_buildAbilityHUD` and `_updateAbilityHUD`, wired both into `update()`

## Decisions Made

- **y=97 for HUD row:** Leaves 17px gap below timer (y=80) — enough visual separation without wasting vertical space
- **Glow per-frame redraw:** Simpler lifecycle, negligible cost vs benefit of caching
- **wasReady edge trigger:** Single boolean prevents tween stacking — no need for a tween count or active-tween check

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 8 complete. All five abilities (fire/ice/thunder/ninja/tiny) are functional (Plan 01) and the HUD correctly visualizes cooldown state with per-character emoji, countdown, and accentColor pulse/glow (Plan 02). Requirements D-01 through D-05 satisfied.

No blockers for future phases.

---

## Self-Check

- [x] `src/scenes/UIScene.js` exists and contains `_buildAbilityHUD` and `_updateAbilityHUD`
- [x] Task commits `b56ac41` and `f700c1b` exist in git log
- [x] Human verification approved

## Self-Check: PASSED

---

*Phase: 08-ability-system-polish*
*Completed: 2026-04-14*
