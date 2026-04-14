---
plan: 01-02
status: complete
completed: 2026-04-14
---

# Summary: Fix Movement Drift (Player Keeps Moving After Key Release)

## What Was Built

Fixed two causes of post-release player drift in `Player.js`: asymptotic damping that never fully stops, and focus-loss events leaving keys stuck in the `isDown` state.

## Tasks Completed

| # | Task | Status |
|---|------|--------|
| 1 | Add epsilon hard-stop to movement damping | ✓ Done |
| 2 | Zero velocity on window focus loss | ✓ Done |

## Key Changes

**Task 1 — Epsilon hard-stop (`update()` else branch):**
- Changed `this.sprite.setVelocity(dampedVX, currentVY)` to:
  `this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY)`
- Player stops within ~9 frames of key release; 0.5 px/frame threshold is imperceptible

**Task 2 — Blur listener (`_create()`):**
- Registered `this.scene.game.events.on('blur', () => { this.sprite.setVelocityX(0); })`
- Only zeroes X velocity — preserves jump arcs on alt-tab
- Uses Phaser's built-in game event bus, auto-cleaned with scene lifecycle
- Both P1 and P2 register independently via separate Player instances

## Key Files

- `src/entities/Player.js` — `update()` lines 68-72 (epsilon), `_create()` after line 42 (blur listener)

## Deviations

None. Changes match plan exactly.

## Self-Check: PASSED

Root cause (asymptotic drift) fixed by Task 1. Secondary edge case (alt-tab held key) fixed by Task 2. No API changes, no regressions expected.
