---
phase: 03-pause-menu
plan: 01
subsystem: pause-menu
tags: [pause, overlay, phaser-scene, matter-physics]
dependency_graph:
  requires: [GameScene, UIScene, MenuScene]
  provides: [PauseScene]
  affects: [GameScene, UIScene, main.js]
tech_stack:
  added: []
  patterns: [scene-launch-overlay, paused-flag-guard]
key_files:
  created:
    - src/scenes/PauseScene.js
  modified:
    - src/scenes/GameScene.js
    - src/scenes/UIScene.js
    - src/main.js
decisions:
  - "PauseScene runs as a launched overlay (not replacing GameScene) using scene.launch — avoids scene teardown costs and allows direct matter.world.pause/resume"
  - "paused flag lives on GameScene so UIScene can read it without a separate event bus"
  - "ESC listener registered in both GameScene (for toggling pause) and PauseScene (for resume), ensuring consistency regardless of which scene receives the key event"
metrics:
  duration: ~10 minutes
  completed: 2026-04-14T20:32:58Z
  tasks_completed: 2
  files_changed: 4
---

# Phase 3 Plan 01: Pause Menu — ESC Overlay Summary

ESC pause overlay using PauseScene launched on top of GameScene with Matter.js physics freeze and UIScene guard.

## What Was Built

A complete ESC pause system:

- **`src/scenes/PauseScene.js`** (new): Phaser overlay scene with a semi-transparent dim rectangle, "PAUSED" heading, and three interactive buttons (Resume, Restart Match, Return to Menu). ESC key in PauseScene also calls `_resume()`. Three action methods communicate back to GameScene via `this.scene.get('GameScene')`.

- **`src/scenes/GameScene.js`**: Added `this.paused = false` in `init()` so flag resets on scene restart. Added ESC key listener in `create()` that toggles `matter.world.pause()/resume()` and launches/stops PauseScene. Added `if (this.paused) return` guard at top of `update()`.

- **`src/scenes/UIScene.js`**: Extended early-return guard in `update()` to include `gs.paused` — prevents timer countdown and cooldown bar updates while the game is paused.

- **`src/main.js`**: Added `PauseScene` import and inserted it into the Phaser scene array before `ResultScene`.

## Tasks Completed

| Task | Name | Commit |
|------|------|--------|
| 1 | Create PauseScene | 62f1021 |
| 2 | Wire ESC pause into GameScene, guard UIScene, register in main.js | b7ea59b |

## Verification

- `npm run build` exits 0 — no import or syntax errors across all modified files.
- PauseScene is importable and registered in the Phaser scene array.
- **Manual walkthrough required** — see checklist below (checkpoint:human-verify skipped per quick-task constraints).

### Manual Verification Checklist

1. Run `npm run dev`, open http://localhost:5173, start a match.
2. Press ESC — ball and players freeze; overlay shows "PAUSED" + 3 buttons; HUD timer does not advance.
3. Press ESC again or click Resume — physics resumes, timer continues.
4. Pause, click "Restart Match" — score resets 0:0, timer 1:30, same characters, no ghost scenes.
5. Pause, click "Return to Menu" — main menu shown cleanly, no lingering scenes.
6. After match ends, confirm ESC does nothing (guarded by `if (this.matchOver) return`).
7. Activate ability before pausing — cooldown bar must not change while paused.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] `src/scenes/PauseScene.js` exists (created)
- [x] `src/scenes/GameScene.js` contains `this.paused`
- [x] `src/scenes/UIScene.js` contains `gs.paused`
- [x] `src/main.js` contains `PauseScene`
- [x] Commits 62f1021 and b7ea59b exist

## Self-Check: PASSED
