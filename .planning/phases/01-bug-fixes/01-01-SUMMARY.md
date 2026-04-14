---
plan: 01-01
status: complete
completed: 2026-04-14
---

# Summary: Fix Goal Physics (Ball Stops at Goal)

## What Was Built

Fixed two compounding geometry bugs in `GameScene.js` that prevented goals from registering reliably.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| 1 | Widen goal back-wall clearance | ✓ Done |
| 2 | Reposition goal score sensors behind post face | ✓ Done |

## Key Changes

**Task 1 — Back wall clearance (`_createWalls`):**
- Left back wall: center x changed from `-thick/2` → `-thick` (right face moves from x=0 to x=-20)
- Right back wall: center x changed from `w + thick/2` → `w + thick` (left face moves from x=GAME_WIDTH to x=GAME_WIDTH+20)
- Result: gap from post face (x=57) to back wall right face (x=-20) = **77px** — comfortably larger than the 52px ball diameter

**Task 2 — Score sensors (`_createGoals`):**
- Left sensor: center x=30, width=50 (spans 5..55) → center x=0, width=40 (spans -20..20)
  - Sensor fires when ball center > 20+26=46 — ball is fully inside goal
- Right sensor: center x=GAME_WIDTH-30, width=50 → center x=GAME_WIDTH, width=40
  - Sensor fires when ball center < GAME_WIDTH-20-26=GAME_WIDTH-46 — ball is fully inside goal

## Key Files

- `src/scenes/GameScene.js` — `_createWalls()` lines 152, 157; `_createGoals()` lines 172-179

## Deviations

None. Changes match plan exactly.

## Self-Check: PASSED

Both bugs fixed with minimal, targeted geometry changes. No API changes, no regressions expected.
