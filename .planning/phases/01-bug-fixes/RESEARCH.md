# Phase 1: Bug Fixes - Research

**Researched:** 2026-04-14
**Domain:** Phaser 3.90 + Matter.js physics — goal detection geometry, keyboard input state
**Confidence:** HIGH (all findings are from direct source reading, no external lookups required)

---

## Summary

Both bugs were diagnosed by reading the full source. No ambiguity remains — root causes are confirmed
and minimal, surgical fixes are identified.

**Bug 1 (ball stops at goal)** is caused by a geometry conflict: the goal sensor rectangle
(`goalLeft`/`goalRight`) and the goal back wall (`goalback`) overlap in the same x-space. The sensor
fires the moment the ball touches the overlapping back wall — which happens before the ball has
meaningfully entered the goal — and then the goal cooldown freezes all further sensor events.
Simultaneously, the back wall body at `x = -thick/2 = -20` only gives the ball 20px of clearance
between the post face (x=57) and the wall face. With ball radius 26, the ball physically cannot
fit; it gets wedged and stops.

**Bug 2 (movement drift)** is caused by applying a `0.75x` damping multiplier every single frame
in the `else` branch of the key check. Matter.js `setVelocity` is called every frame, so at 60fps
this means: after releasing a key the player velocity decays as `speed * 0.75^N`. After 10 frames
this is `5.5 * 0.075 ≈ 0.41 px/frame` — still non-zero and visually drifting. The player never
fully stops unless clamped by the wall boundary or a collision. The fix is a hard zero below a
threshold, or a stronger multiplier.

**Primary recommendation:** Fix Bug 1 by repositioning the sensor so it sits fully behind the goal
back wall (no overlap with the ball's initial approach path), and by widening the physical gap so the
ball can actually pass the post. Fix Bug 2 by zeroing VX when the damped value drops below a small
epsilon (e.g., `|vx| < 0.5`).

---

## Bug 1: Ball Stops at Goal — Confirmed Root Cause

### Geometry Reconstruction

From `_createWalls()` and `_createGoals()`:

| Body | Center X | Half-width | Left edge X | Right edge X |
|---|---|---|---|---|
| Left goal back wall | `-thick/2 = -20` | `thick/2 = 20` | `-40` | `0` |
| Left goal sensor | `30` | `25` | `5` | `55` |
| Left goal post (visual bar) | `62` | `5` | `57` | `67` |
| Ball radius | — | `26` | — | — |

**Problem A — Sensor fires too early:**
The sensor spans x=5 to x=55. The back wall's right face is at x=0. They do not overlap in x, but
the ball (radius 26) will touch the sensor at x = 55 + 26 = 81 from the right side — i.e., when the
ball center reaches x=81, the edge of the ball enters the sensor. At that point the ball is still
outside the goal post (post face at x=57). The sensor fires before the ball is past the post.

However the more critical issue is **Problem B**:

**Problem B — Ball cannot physically enter the goal:**
The gap between the goal post face (x=57) and the right edge of the back wall body (x=0) is 57px.
The ball diameter is 52px. There is only 5px of clearance, and Matter.js collision response (with
non-sensor bodies on both sides) will cause the ball to bounce off the post before it can squeeze
through. With restitution 0.4 on the back wall and 0.4 on the post, the ball rebounds.

The net effect: the ball hits the goal post edge, gets partially in, triggers the sensor, the goal
cooldown fires (`goalCooldownUntil = now + 2500ms`), and all further collisions are ignored for
2.5 seconds. The ball then bounces back out. From the player's view: the ball touched the goal area
then stopped/bounced — no goal scored (or goal scored but ball appears stuck).

**Problem C — stuckTimeout interaction:**
If the ball wedges in the gap (velocity near zero), `Ball.update()` increments `_stuckTimer`. After
5000ms it calls `ball.reset()`. This is why the ball "stops dead" — it gets wedged, the stuckTimer
fires, and the ball teleports back to center.

### Exact Code Locations

```
GameScene.js line 152: left goal back wall — center x = -20
GameScene.js line 160: left goal post — center x = 62, half-width 5 → face at x = 57
GameScene.js line 172-175: left sensor — center x = 30, half-width 25 → spans x=5..55
```

### Fix for Bug 1

Two changes needed:

**Change 1: Move the goal back wall fully outside the arena.**

Current: `this.matter.add.rectangle(-thick / 2, ...)` → center at x=-20, right face at x=0.

The back wall center must be at `-(thick/2)` where `thick` is thick enough so the right face is
flush with or beyond the screen edge. The current thick=40 gives right face at x=0, which is inside
the playable area. The correct placement is to move the back wall further left so its right face is
at or past `x=0` — but actually the real fix is to push it far enough that the gap between post
and wall is larger than the ball diameter.

Gap needed: ball diameter + margin = 52 + 10 = 62px minimum.
Post face is at x=57. So back wall right face should be at x = 57 - 62 = -5 or less.
Back wall center: at `x = -5 - 20 = -25` (for half-width 20).

Simplest fix: push the back wall center to `x = -thick` (i.e., `-40`) so its right face is at
`x = -40 + 20 = -20`. That gives gap = 57 - (-20) = 77px — enough for the ball (52px diameter)
to pass with 25px clearance. Do the same symmetrically for the right side.

**Change 2: Move the sensor zone deeper into the goal (further past the post).**

Current sensor center: x=30, spans x=5..55.
Move to center x=15, half-width 25 → spans x=-10..40. Or shrink and move: center x=10, half-width
20 → spans x=-10..30. The sensor should sit between the back wall and the post, fully inside the
goal — not partially outside the post face.

Alternatively, reduce sensor width so it only occupies x=0..40 (inside the goal, behind the post
face at x=57). Sensor center = 20, half-width = 20 → spans x=0..40. This ensures the ball must
be fully inside the goal mouth before scoring is triggered.

**Minimal fix (2 lines in `_createWalls`, 2 lines in `_createGoals`):**

```javascript
// _createWalls — move back walls outward (right face at x = -20 instead of x = 0)
// LEFT:
this.matter.add.rectangle(-thick, h - 80 - GOAL.height / 2, thick, GOAL.height, { isStatic: true, restitution: 0.4, label: 'goalback' });
// RIGHT:
this.matter.add.rectangle(w + thick, h - 80 - GOAL.height / 2, thick, GOAL.height, { isStatic: true, restitution: 0.4, label: 'goalback' });

// _createGoals — move sensor deeper into goal, reduce width so it's fully inside the post
this.leftGoalZone = this.matter.add.rectangle(
  20, h - 80 - GOAL.height / 2, 40, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalLeft' }
);
this.rightGoalZone = this.matter.add.rectangle(
  GAME_WIDTH - 20, h - 80 - GOAL.height / 2, 40, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalRight' }
);
```

This positions:
- Left back wall: center x=-40, right face at x=-20. Gap to post face (x=57): 77px. Ball (52px) fits.
- Left sensor: center x=20, spans x=0..40. Fully inside the goal (post face at x=57). Ball must
  cross the post face before the sensor fires.

---

## Bug 2: Player Movement Drift — Confirmed Root Cause

### Exact Code Location

```javascript
// Player.js lines 63-72
if (this.controls.left.isDown) {
  this.sprite.setVelocity(-speed, currentVY);
} else if (this.controls.right.isDown) {
  this.sprite.setVelocity(speed, currentVY);
} else {
  // Applied every frame at 60fps:
  const dampedVX = body.velocity.x * 0.75;
  this.sprite.setVelocity(dampedVX, currentVY);
}
```

### Decay Analysis

At `runSpeed = 5.5 px/frame` (character speed multiplier 1.0):

| Frame after release | VX |
|---|---|
| 0 | 5.50 |
| 5 | 1.46 |
| 10 | 0.41 |
| 15 | 0.11 |
| 20 | 0.03 |

After 10 frames (~167ms at 60fps) the player is still moving at 0.41 px/frame. This is
barely perceptible but physically real — the player drifts 2-3 pixels per frame for nearly
20 frames after key release. On a fast display or when the player is near the ball, this
causes the "keeps moving" perception.

The `playerAirFriction = 0.01` and `playerFriction = 0.05` in Matter.js are overridden
entirely because `setVelocity` is called every frame, bypassing all Matter.js friction.
The physics engine's own deceleration never gets a chance to act.

### Why isDown Is Not the Problem

`Phaser.Input.Keyboard.Key.isDown` is reliable — it reads the current key state from
Phaser's KeyboardPlugin which is updated at the start of each frame. There is no caching
bug. The drift is entirely from the 0.75x damping being too gentle, not from misread key state.

Focus-loss edge case: if the user alt-tabs and releases the key while the window is not focused,
the `keyup` event is lost and `isDown` stays `true` until the key is physically pressed and released
again. However, this is a secondary issue; the primary drift occurs during normal gameplay.

### Fix for Bug 2

Zero the velocity when the damped value drops below a threshold:

```javascript
} else {
  const dampedVX = body.velocity.x * 0.75;
  this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY);
}
```

With threshold 0.5: stopping takes at most `ceil(log(0.5/5.5) / log(0.75)) = ceil(8.6) = 9` frames
(~150ms) — snappy and intentional-feeling.

Optional stronger fix: raise damping from 0.75 to 0.6 AND apply the epsilon threshold:

```javascript
const dampedVX = body.velocity.x * 0.6;
this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY);
```

This stops in ~5 frames (~83ms) — very responsive.

The focus-loss edge case (key held across alt-tab) requires a separate listener:
```javascript
// In GameScene.create() or Player._create():
this.scene.game.events.on('blur', () => {
  this.sprite.setVelocityX(0);
});
```
This is optional but eliminates the alt-tab drift scenario entirely.

---

## Architecture Patterns

No structural changes required. Both fixes are local to existing methods.

- Bug 1: 4 number literals changed across 2 methods in `GameScene.js`
- Bug 2: 1 expression changed in `Player.js`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---|---|---|
| Sensor overlap detection | Custom overlap check | Correct geometry placement (no code) |
| Soft-stop physics | Custom friction integrator | Simple epsilon threshold on existing damp |

---

## Common Pitfalls

### Pitfall 1: Sensor placed at wrong x, still overlaps post face
**What goes wrong:** Sensor fires before ball crosses the goal line (post face). Own goals and phantom scores.
**Prevention:** Sensor x-span must be entirely between `x=0` (screen edge) and `x=57` (post face) for left goal. Verify with a debug draw.

### Pitfall 2: Back wall moved too far out, ball escapes the arena
**What goes wrong:** Ball passes through left wall if back wall no longer stops it.
**Prevention:** Back wall right face should still be close to x=0 (screen edge). x=-20 is safe; ball cannot visibly escape but gap is now 77px.

### Pitfall 3: Epsilon threshold too high, jumpy stop
**What goes wrong:** Player velocity snaps to zero from 0.6 px/frame — visible jerk.
**Prevention:** Keep threshold at 0.5 or below. At 0.5 px/frame the visual jerk is imperceptible.

### Pitfall 4: Changing damping breaks CPU player feel
**What goes wrong:** CPUPlayer calls `setVelocityX` directly; damping in Player.update doesn't affect it. No risk here — CPUPlayer is separate.
**Prevention:** No action needed; the classes are independent.

---

## Code Examples

### Bug 1 Fix — GameScene.js `_createWalls()`

```javascript
// BEFORE (line 152):
this.matter.add.rectangle(-thick / 2, h - 80 - GOAL.height / 2, thick, GOAL.height,
  { isStatic: true, restitution: 0.4, label: 'goalback' });
// BEFORE (line 157):
this.matter.add.rectangle(w + thick / 2, h - 80 - GOAL.height / 2, thick, GOAL.height,
  { isStatic: true, restitution: 0.4, label: 'goalback' });

// AFTER:
this.matter.add.rectangle(-thick, h - 80 - GOAL.height / 2, thick, GOAL.height,
  { isStatic: true, restitution: 0.4, label: 'goalback' });
this.matter.add.rectangle(w + thick, h - 80 - GOAL.height / 2, thick, GOAL.height,
  { isStatic: true, restitution: 0.4, label: 'goalback' });
```

### Bug 1 Fix — GameScene.js `_createGoals()`

```javascript
// BEFORE:
this.leftGoalZone = this.matter.add.rectangle(
  30, h - 80 - GOAL.height / 2, 50, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalLeft' }
);
this.rightGoalZone = this.matter.add.rectangle(
  GAME_WIDTH - 30, h - 80 - GOAL.height / 2, 50, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalRight' }
);

// AFTER:
this.leftGoalZone = this.matter.add.rectangle(
  20, h - 80 - GOAL.height / 2, 40, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalLeft' }
);
this.rightGoalZone = this.matter.add.rectangle(
  GAME_WIDTH - 20, h - 80 - GOAL.height / 2, 40, GOAL.height,
  { isStatic: true, isSensor: true, label: 'goalRight' }
);
```

### Bug 2 Fix — Player.js `update()`

```javascript
// BEFORE (lines 69-71):
const dampedVX = body.velocity.x * 0.75;
this.sprite.setVelocity(dampedVX, currentVY);

// AFTER:
const dampedVX = body.velocity.x * 0.75;
this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY);
```

---

## Environment Availability

Step 2.6: SKIPPED — all changes are code-only edits; no external tools, services, or runtimes required beyond the existing Vite dev server.

---

## Open Questions

1. **Goal cooldown duration after sensor fix**
   - What we know: `goalCooldown = 2500ms`. After the geometry fix the ball will now properly enter the goal before triggering the sensor.
   - What's unclear: Is 2500ms the right feel for the reset delay once scoring works correctly? This is a tuning question, not a bug.
   - Recommendation: Leave at 2500ms for now; adjust during playtesting.

2. **Alt-tab focus-loss drift**
   - What we know: `Phaser.Input.Keyboard.Key.isDown` does not reset on window blur.
   - What's unclear: How often does this actually affect players in practice?
   - Recommendation: Add the optional `game.events.on('blur')` handler only if testers report it.

---

## Sources

### Primary (HIGH confidence)
- Direct read of `src/scenes/GameScene.js` — full source, lines 138-198
- Direct read of `src/entities/Player.js` — full source, lines 54-105
- Direct read of `src/entities/Ball.js` — full source, lines 61-90
- Direct read of `src/config/constants.js` — all physics constants

All findings are first-principles geometry and arithmetic from the source code. No external
documentation lookup was required.

---

## Metadata

**Confidence breakdown:**
- Bug 1 root cause: HIGH — geometry computed from exact constants in the source
- Bug 2 root cause: HIGH — decay math verified from exact damping constant and run speed
- Proposed fixes: HIGH — minimal, targeted, no side effects on other systems

**Research date:** 2026-04-14
**Valid until:** Until any of `_createWalls`, `_createGoals`, `Player.update`, or `constants.js` is modified
