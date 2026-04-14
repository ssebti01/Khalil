---
phase: tp8
plan: phase-2
subsystem: player-visuals
tags: [head-visuals, squash-stretch, wobble, sprite-scale]
tech-stack:
  patterns: [yoyo-tween, debounce-flag, per-player-collision-listener]
key-files:
  modified: [src/entities/Player.js]
decisions:
  - "HEAD_DISPLAY_SIZE set to literal 128 rather than formula to decouple display from physics radius"
  - "Debounce via _wobbling flag (implicit undefined) — no constructor change required"
  - "Per-player collisionstart listener registered in _create() for independent P1/P2 wobble"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-14"
  tasks: 3
  files: 1
---

# Phase tp8 Plan phase-2: Head Visuals — Larger Sprites + Squash-and-Stretch Wobble

**One-liner:** Increased head display from 96px to 128px and added 120ms yoyo squash-and-stretch tween triggered on jump landing, ball contact, and ability use, all debounced per player.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Increase HEAD_DISPLAY_SIZE to 128 | 1860139 |
| 2 | Add _wobble() helper with yoyo tween + debounce | 60b5239 |
| 3 | Wire triggers: landing, ball contact, ability | c69bab2 |

## What Was Built

All changes are confined to `src/entities/Player.js`.

**Task 1 — HEAD_DISPLAY_SIZE = 128:**
Replaced `PLAYER.headRadius * 2 + 16` (= 96) with literal `128`. The existing scale
calculation in `_create()` (`scale = HEAD_DISPLAY_SIZE / Math.max(frame.realWidth, frame.realHeight)`)
adapts automatically. Physics body `setCircle(PLAYER.headRadius, ...)` is untouched.

**Task 2 — _wobble() method:**
Added after `_emitParticles()`. Uses a Phaser yoyo tween (scaleX × 1.15, scaleY × 0.85,
60ms duration) that auto-reverses for ~120ms total motion. Debounce flag `_wobbling`
prevents stacking tweens. `onComplete` pins exact base scale and clears the flag.

**Task 3 — Trigger wires:**
- Landing: `wasOnGround` captured before `checkGround()` in `update()`; wobble fires on false→true transition
- Ball contact: per-player `collisionstart` listener in `_create()` checks `b === this.sprite.body` and `b.label === 'ball'`
- Ability: `this._wobble()` inserted as first statement of `_useAbility()` before cooldown assignment

## Deviations from Plan

None — plan executed exactly as written. All three tasks matched the 02-01-PLAN.md specifications verbatim.

## Verification Status

Build passes (`npm run build` — 367ms, no errors). Manual visual verification pending
(checkpoint:human-verify) — user must confirm in browser:
1. Heads appear noticeably larger (128px vs 96px)
2. Squish on jump landing, ball contact, ability use
3. No tween stacking on rapid triggering
4. No physics regression (collision behavior unchanged)

## Known Stubs

None.

## Self-Check: PASSED

- `src/entities/Player.js` exists and contains `HEAD_DISPLAY_SIZE = 128`
- Commits 1860139, 60b5239, c69bab2 all present in git log
- Build succeeds without errors
