# Phase 8: Ability System Polish - Research

**Researched:** 2026-04-14
**Domain:** Phaser 3 UIScene HUD redesign + Player ability logic audit
**Confidence:** HIGH (all findings from direct source code inspection)

## Summary

Phase 8 has two independent deliverables: (1) audit and fix the five ability implementations in `Player._useAbility()`, and (2) replace the current bottom-corner cooldown bars in UIScene with a centered, icon+countdown display below the score bar.

The ability logic audit reveals that four of five abilities work correctly by inspection. The ice ability has a structural correctness issue with freeze target resolution — the `player-ability` handler resolves target at fire-time using the source reference, which is sound. However, the `tiny` ability has an interaction risk: the delayed ball impulse fires 350ms after activation, at which point the ball reference could be anywhere or a goal might have been scored. The thunder ability applies a velocity rather than a force/impulse, which means it has no effect when the player is frozen (correct, `update()` returns early) but does not interact with ball at all — this matches its design as a "dash" not a "kick". All five abilities share the single 8000ms cooldown constant with no variation.

The current HUD sits at y=670 (bottom corners) with plain 120px-wide bars. The new HUD must move to just below the score bar (currently occupying y=10 to y=90). The existing `getAbilityCooldownRatio(now)` method returns 0–1 correctly and is already called in UIScene `update()` — the new HUD can derive countdown seconds from `Math.ceil((1 - ratio) * ABILITY_COOLDOWN / 1000)`. No changes to GameScene or Player are required for the display redesign.

**Primary recommendation:** Fix the `tiny` ability's delayed-call ball reference safety; implement the new HUD as a drop-in replacement for `_buildAbilityBar` / `_drawAbilBar`, keeping all existing state-polling patterns intact.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace the current bottom-corner plain bars with a new HUD element positioned **below the score bar** (top center area), split left/right for each player
- **D-02:** Display format: **large emoji icon** (from `char.emoji`) + **countdown number** (seconds remaining). When ability is ready, number disappears
- **D-03:** When cooldown is ready, the icon **pulses/glows** using the character's `accentColor` to indicate availability
- **D-04:** All five abilities must be audited for correctness: `fire`, `ice`, `thunder`, `ninja`, `tiny`
- **D-05:** Ability IDs are matched by `char.id` in `Player._useAbility()` — the character roster maps: `khalil→fire`, `beboush→ice`, `lilya→thunder`, `fafa→ninja`, `sara→tiny`

### Claude's Discretion
- Exact size, spacing, and positioning of the HUD element relative to the score bar
- Whether the countdown number shows seconds or a progress value
- How "ready" pulse is implemented (tween alpha/scale oscillation vs color flash)
- Frozen player visual state (ice tint, particles, etc.) — not discussed, implement reasonably
- Activation feedback on ability fire — not discussed, implement reasonably (can extend existing `_emitParticles`)
- Whether per-character cooldown durations vary — not discussed, keep uniform at 8s unless a bug warrants change

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

## Ability Logic Audit (Complete Findings)

All findings from direct inspection of `src/entities/Player.js` lines 127-158.

### Character → Ability ID mapping
The `_useAbility()` method branches on `this.char.id`. The mapping is:

| char.id | Character | Ability |
|---------|-----------|---------|
| `khalil` | Khalil | `fire` — applies horizontal ball impulse toward opponent's goal |
| `beboush` | Beboush | `ice` — emits `player-ability { type: 'freeze', source: this }` event |
| `lilya` | Lilya | `thunder` — dashes player body toward ball |
| `fafa` | Fafa | `ninja` — teleports player to ball position |
| `sara` | Sara | `tiny` — super jump up then delayed ball slam down |

Note: `char.id` is `khalil`, `beboush`, `lilya`, `fafa`, `sara` — NOT `fire`, `ice`, etc. The names "fire/ice/thunder/ninja/tiny" are colloquial labels for the ability type, not the id value. `_useAbility()` correctly branches on char.id.

### Per-Ability Audit

**`fire` (khalil) — WORKS CORRECTLY**
- Applies `ABILITIES.fire.impulseX = 0.06` horizontally (direction sign from `this.side`) and `ABILITIES.fire.impulseY = -0.04` (upward) to ball.
- Direction logic: `dx = this.side === 'left' ? 1 : -1` — kicks ball toward opponent's goal. Correct.
- Calls `_emitParticles(0xff6600)`. Correct.
- No issues found.

**`ice` (beboush) — WORKS CORRECTLY**
- Emits `player-ability` event with `{ type: 'freeze', source: this }`.
- GameScene handler (line 82-87): resolves `target = source === this.p1 ? this.p2 : this.p1`. Freezes the correct opponent.
- `freeze(duration)` sets `this.frozenUntil = this.scene.time.now + duration` and applies blue tint for duration.
- In `Player.update()`: `if (time < this.frozenUntil) return;` — frozen player cannot move or fire ability.
- `abilityCooldown` is still set on the ice player before event emit — ice player cannot re-freeze immediately. Correct.
- Edge case: if called by CPU player (p2 in cpu mode), the GameScene handler still resolves correctly because `source` is the player instance reference.
- No issues found.

**`thunder` (lilya) — WORKS BUT HAS NOTABLE BEHAVIOR**
- Sets `this.sprite.setVelocityX(Math.sign(dx) * 15)` where `dx = ball.x - this.x`.
- This is a velocity override, not an impulse. It overrides any current X velocity instantly.
- The dash does not interact with the ball directly — the player must physically reach the ball through normal collision. This matches the "Thunder Rush / dash" design intent.
- Risk: if ball is on the same X as player, `Math.sign(0) === 0` — no dash. This is a very minor edge case (ball exactly on player center).
- No issues found; behavior matches design description ("Dashes across the field at lightning speed").

**`ninja` (fafa) — WORKS CORRECTLY**
- Teleports player sprite to `(Phaser.Math.Clamp(ball.x, 80, GAME_WIDTH - 80), ball.y + (-60))`.
- `ABILITIES.ninja.teleportOffsetY = -60` positions player 60px above the ball (so head is above ball for header).
- Sets velocity to (0,0) on arrival — no momentum carries over. Player then falls naturally onto ball due to gravity.
- The X clamp (80 to GAME_WIDTH-80) prevents teleporting inside goal posts.
- No issues found.

**`tiny` (sara) — HAS A POTENTIAL DEFECT**
- Fires `this.sprite.setVelocityY(PLAYER.jumpForce * 1.8)` = upward jump at 1.8× normal force.
- Then schedules `this.scene.time.delayedCall(350, callback)` where callback: sets player velocityY to +12 (down) and calls `ball.applyImpulse({ x: 0, y: ABILITIES.tiny.ballLiftImpulse })` where `ballLiftImpulse = 0.08` (downward, positive Y = down in Phaser/Matter).
- **Defect:** The `ball` reference is captured at ability-fire time as a parameter to `_useAbility(time, ball)`. The delayedCall closure captures this same reference. If `reset()` is called during the 350ms window (goal scored), the Ball object may have been repositioned or replaced. The `ball` variable is a direct reference to `this.scene.ball` which persists across goals (Ball is not destroyed and recreated on goal, only `ball.reset()` is called). So the impulse will fire on the repositioned ball at center — this is a minor annoyance, not a crash.
- **Second behavior note:** The impulse direction `y: 0.08` pushes ball downward (positive Y = down in Matter.js). The ability name is "Super Bounce" / "slams the ball down hard" — this matches. But the player also re-descends with `setVelocityY(12)` (positive = down), so the player body falls toward the ball simultaneously. This creates a header-slam combo.
- **Severity:** LOW. Not game-breaking. The delayed call firing on a reset ball is cosmetically wrong but not a crash.

### Shared Cooldown System — Correct
- `ABILITY_COOLDOWN = 8000` (ms), single constant for all characters.
- `this.abilityCooldown = time + ABILITY_COOLDOWN` set at fire-time before the ability branch.
- Guard: `time > this.abilityCooldown` checked before each fire.
- `getAbilityCooldownRatio(now)` returns 0 (just fired) → 1 (ready). Formula: `Math.min(elapsed / ABILITY_COOLDOWN, 1)` where elapsed counts from when the cooldown was set.
- **Edge case:** `abilityCooldown` initializes to `0` at construction. `getAbilityCooldownRatio` handles this: `if (this.abilityCooldown === 0) return 1` — correct, starts ready.

---

## Current HUD Implementation (UIScene)

### Score bar geometry (existing, must not move)
- Background: `fillRoundedRect(GAME_WIDTH/2 - 180, 10, 360, 60, 12)` → occupies x=460–820, y=10–70
- P1 score text: `(GAME_WIDTH/2 - 70, 40)` — center-origin
- P2 score text: `(GAME_WIDTH/2 + 70, 40)` — center-origin
- Timer text: `(GAME_WIDTH/2, 80)` — center-origin, y=80 is the bottom edge of this cluster

### Current ability bar geometry (to be replaced)
- P1: `_buildAbilityBar(0, 30)` — anchored at x=30, y=670
  - Background rect: `(30 - 60, 662, 120, 16)` = `(-30, 662, 120, 16)` — **clips off-screen left!** The x of the rect is `x - barW/2 = 30 - 60 = -30`. This is a rendering bug — the P1 bar is partially off-screen.
  - Label text at `(30, 682)` for `[Q] Ability`
- P2: `_buildAbilityBar(1, GAME_WIDTH - 30)` = `_buildAbilityBar(1, 1250)` — anchored at x=1250, y=670
  - Background rect: `(1250 - 60, 662, 120, 16)` = `(1190, 662, 120, 16)` — right edge at 1310 > 1280, **also clips!**

### What the current `update()` already does correctly
- Calls `this.scene.get('GameScene').time.now` to get the Phaser time reference.
- Calls `gs.p1.getAbilityCooldownRatio(now)` and `gs.p2.getAbilityCooldownRatio(now)`.
- Reads `gs.p1.char.accentColor` for bar color.
- Guards on `!gs || gs.matchOver || gs.paused`.
- The new HUD needs only to replace `_buildAbilityBar` / `_drawAbilBar` with new create/update methods using the same input data.

---

## Architecture Patterns

### Recommended Project Structure (unchanged)
```
src/
  scenes/UIScene.js       # HUD redesign here — all visual changes
  entities/Player.js      # tiny fix here — minimal edit
  config/constants.js     # ABILITIES — no changes needed
  config/characters.js    # char.emoji, char.accentColor — already correct
```

### Pattern 1: UIScene Create + Update Split
**What:** All Phaser display objects created in `create()` with references stored on `this`. State mutations happen exclusively in `update()`.
**When to use:** Always in UIScene.
**Example (existing pattern to follow):**
```javascript
// In create():
this._p1AbilIcon = this.add.text(x, y, char.emoji, { fontSize: '36px' }).setOrigin(0.5);
this._p1AbilCountdown = this.add.text(x, y + 30, '', { fontSize: '20px' }).setOrigin(0.5);
this._p1AbilPulseTween = null; // managed tween ref

// In update():
const ratio = gs.p1.getAbilityCooldownRatio(now);
const ready = ratio >= 1;
if (ready && !this._p1AbilPulseTween) {
  this._p1AbilPulseTween = this.tweens.add({ targets: this._p1AbilIcon, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
} else if (!ready && this._p1AbilPulseTween) {
  this._p1AbilPulseTween.stop();
  this._p1AbilPulseTween = null;
  this._p1AbilIcon.setAlpha(1);
}
```

### Pattern 2: Cooldown → Countdown Conversion
```javascript
// Derive countdown seconds from ratio
const ratio = gs.p1.getAbilityCooldownRatio(now);  // 0=just fired, 1=ready
const secsRemaining = Math.ceil((1 - ratio) * ABILITY_COOLDOWN / 1000);
this._p1AbilCountdown.setText(ratio >= 1 ? '' : String(secsRemaining));
```

### Pattern 3: Pulse Tween (Phaser 3)
```javascript
// Oscillate alpha for ready-state glow
this.tweens.add({
  targets: iconTextObject,
  alpha: { from: 1, to: 0.45 },
  duration: 500,
  ease: 'Sine.easeInOut',
  yoyo: true,
  repeat: -1,
});
```
The tween must be stopped and alpha reset when cooldown becomes active again. Store the tween return value to call `.stop()` later.

### Anti-Patterns to Avoid
- **Creating new Phaser objects in update():** Creates memory leaks — always create in `create()`, mutate in `update()`.
- **Using `this.add.text()` for emoji with large fontSize and fontFamily 'Arial':** Emoji rendering depends on system fonts. Use a generous `fontSize` (36–48px) and let the OS handle rendering. Do NOT specify a font family that lacks emoji support.
- **Multiple pulse tweens stacking:** Always check if tween is already running before creating another. Store tween ref and check `this._p1AbilPulseTween !== null`.
- **Positioning HUD elements by hardcoded pixel math without reference to score bar bounds:** Use `GAME_WIDTH / 2` as center anchor and derive offsets from there.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repeating tween animation | Manual setInterval/alpha cycle | `this.tweens.add({ repeat: -1, yoyo: true })` | Built-in, frame-rate independent, auto-pauses with scene |
| Delayed action | `setTimeout` | `this.scene.time.delayedCall(ms, cb)` | Respects Phaser pause state; cleared on scene stop |
| Particle burst | Custom draw loop | `this.scene.add.particles(..., { quantity: N })` | Already used in `_emitParticles()` |
| Countdown seconds math | Custom timer | Derive from `getAbilityCooldownRatio()` × `ABILITY_COOLDOWN` | Single source of truth; already computed |

---

## Common Pitfalls

### Pitfall 1: Off-Screen HUD at Bottom Corners
**What goes wrong:** The current `_buildAbilityBar` positions P1 bar with center x=30, giving a rect at x=-30. This clips at screen edge.
**Why it happens:** Using half-width subtraction from a near-edge anchor.
**How to avoid:** The new HUD lives near center-top (below score bar at y≈90-130), so this is no longer a risk. Remove the old bars entirely.
**Warning signs:** Any bar anchored within 60px of screen edge.

### Pitfall 2: Stacking Pulse Tweens
**What goes wrong:** If the pulse tween is created every update() frame when ready, hundreds of tweens accumulate.
**Why it happens:** Not checking whether the tween already exists.
**How to avoid:** Store tween reference in `this._p1PulseTween`. Only create if `null`. Stop and null when cooldown re-activates.

### Pitfall 3: Emoji Font Rendering
**What goes wrong:** Emoji display as boxes or black-and-white on some systems when fontFamily is specified.
**Why it happens:** Some fonts don't include emoji glyphs; Phaser text falls back to a non-emoji glyph.
**How to avoid:** Use `fontFamily: 'Arial, sans-serif'` (safe cross-platform) or omit fontFamily for emoji-only text objects. Test visually in browser.

### Pitfall 4: `tiny` Delayed Call Across Goal Reset
**What goes wrong:** If Sara fires ability within 350ms of a goal, the `ball.applyImpulse` in the delayed callback fires on the repositioned/reset ball at center field.
**Why it happens:** `delayedCall` callback captures ball reference, `ball.reset()` repositions the same object.
**How to avoid:** Add a guard in the callback: check if the ability was interrupted (e.g., a `_abilityActive` flag or check `this.abilityCooldown` was not reset). Simplest fix: no-op if the ball is near center position.

### Pitfall 5: UIScene `gameScene` Reference Timing
**What goes wrong:** `this.gameScene` is set via `init(data)`, but UIScene launches at same time as GameScene players are created. `gs.p1` / `gs.p2` may be null in the first few frames.
**Why it happens:** UIScene `create()` runs before GameScene fully sets up p1/p2.
**How to avoid:** Already guarded: `if (!gs || gs.matchOver || gs.paused) return` plus `gs.p1 ?` guards. New HUD must preserve these guards for both create-time and update-time char data access.
**Solution for create():** Read char data lazily in `create()` using `this.gameScene.p1?.char` — or pass char data through `init(data)` alongside gameScene reference.

---

## HUD Layout Specification

Based on score bar geometry at y=10–70 and timer at y=80:

```
Score bar:  y=10–70, x=460–820 (center 640)
Timer text: y=80

New HUD placement (recommended):
  P1 indicator: x ≈ GAME_WIDTH/2 - 140 = 500, y ≈ 95
  P2 indicator: x ≈ GAME_WIDTH/2 + 140 = 780, y ≈ 95
  Icon (emoji): fontSize 36-40px, setOrigin(0.5)
  Countdown:    fontSize 18px, positioned 26px below icon
  Glow bg:      small rounded rect behind icon, filled with accentColor at low alpha when ready
```

This keeps the full HUD cluster in the top ~130px of screen, away from gameplay field (floor at y=640).

---

## Code Examples

### New `_buildAbilityHUD(playerIndex, centerX)` (verified Phaser 3 pattern)
```javascript
// Source: direct analysis of UIScene.js existing patterns + Phaser 3 text/tween API
_buildAbilityHUD(playerIndex, centerX) {
  const y = 97; // just below timer at y=80
  const isP1 = playerIndex === 0;

  // Background circle/rect for icon glow (start invisible)
  const glowBg = this.add.graphics();
  // (drawn in update when ready)

  const icon = this.add.text(centerX, y, '', {
    fontSize: '36px',
    fontFamily: 'Arial, sans-serif',
  }).setOrigin(0.5).setDepth(10);

  const countdown = this.add.text(centerX, y + 26, '', {
    fontSize: '16px',
    fontFamily: 'Arial Black, sans-serif',
    color: '#ffffff',
  }).setOrigin(0.5).setDepth(10);

  const store = { icon, countdown, glowBg, pulseTween: null, wasReady: false };
  if (isP1) this._p1AbilHud = store;
  else       this._p2AbilHud = store;
}
```

### New `_updateAbilityHUD(hud, ratio, char)` (update-time mutation)
```javascript
_updateAbilityHUD(hud, ratio, char) {
  if (!hud) return;
  const ready = ratio >= 1;
  const secsRemaining = ready ? 0 : Math.ceil((1 - ratio) * ABILITY_COOLDOWN / 1000);

  // Always show emoji
  hud.icon.setText(char.emoji);

  // Countdown: show seconds if not ready, hide if ready
  hud.countdown.setText(ready ? '' : String(secsRemaining));

  // Pulse tween: start on transition to ready, stop on transition to active
  if (ready && !hud.wasReady) {
    hud.pulseTween = this.tweens.add({
      targets: hud.icon,
      alpha: { from: 1, to: 0.45 },
      scaleX: { from: 1, to: 1.12 },
      scaleY: { from: 1, to: 1.12 },
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    hud.wasReady = true;
  } else if (!ready && hud.wasReady) {
    if (hud.pulseTween) { hud.pulseTween.stop(); hud.pulseTween = null; }
    hud.icon.setAlpha(1).setScale(1);
    hud.wasReady = false;
  }

  // Glow background (redraw each frame is fine for graphics objects)
  hud.glowBg.clear();
  if (ready) {
    const hex = char.accentColor;
    hud.glowBg.fillStyle(hex, 0.25);
    hud.glowBg.fillCircle(hud.icon.x, hud.icon.y, 28);
  }
}
```

### `tiny` ability safe fix
```javascript
} else if (id === 'sara') {
  this.sprite.setVelocityY(PLAYER.jumpForce * 1.8);
  const abilityCooldownSnapshot = this.abilityCooldown; // capture at fire time
  this.scene.time.delayedCall(ABILITIES.tiny.ballLiftDelay, () => {
    // Guard: if a goal reset already changed the cooldown (i.e., player.reset() was called),
    // skip — this prevents slamming a freshly-reset ball at center
    if (this.abilityCooldown !== abilityCooldownSnapshot) return;
    this.sprite.setVelocityY(12);
    ball.applyImpulse({ x: 0, y: ABILITIES.tiny.ballLiftImpulse });
  });
  this._emitParticles(0xffcc44);
}
```

Wait — `reset()` does not clear `abilityCooldown`. A better guard: check if `this.frozenUntil === 0` as a proxy is wrong too. The simplest safe approach is checking if the ball is near its start position:
```javascript
this.scene.time.delayedCall(ABILITIES.tiny.ballLiftDelay, () => {
  const nearCenter = Math.abs(ball.x - GAME_WIDTH / 2) < 80 && Math.abs(ball.y - 280) < 80;
  if (nearCenter) return; // ball was just reset — skip impulse
  this.sprite.setVelocityY(12);
  ball.applyImpulse({ x: 0, y: ABILITIES.tiny.ballLiftImpulse });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No ability system | `_useAbility()` with 5 branches, cooldown, cross-player events | Phase 5 (pre-existing) | Foundation is solid |
| Bottom-corner bars (current) | Centered icon+countdown below score bar | Phase 8 | Better visibility, less clutter |
| Bar fills via `_drawAbilBar` | Text + tween-driven pulse | Phase 8 | More expressive, character-specific feel |

---

## Environment Availability

Step 2.6: All tooling is local web dev. No external dependencies beyond what is already installed.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Build + test | Yes | (project working) | — |
| Vitest | Test runner | Yes | ^4.1.4 (package.json) | — |
| Phaser 3 | Game engine | Yes | ^3.90.0 | — |
| Browser | Manual HUD test | Yes | Any modern | — |

---

## Validation Architecture

nyquist_validation is enabled in config.json.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `vitest.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ABL-01 | `fire` ability: ball impulse direction correct for left/right player | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| ABL-02 | `ice` ability: freeze target is opponent, not self | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| ABL-03 | `thunder` ability: velocity sign toward ball | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| ABL-04 | `ninja` ability: teleport X clamped to [80, GAME_WIDTH-80] | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| ABL-05 | `tiny` ability: delayed callback skips ball at reset position | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| ABL-06 | `getAbilityCooldownRatio` returns 1 at init, 0 immediately after fire | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| HUD-01 | Countdown shows correct seconds remaining from ratio | unit | `vitest run tests/abilities.test.js` | No — Wave 0 |
| HUD-02 | HUD visual changes (pulse, icon, glow) | manual | n/a — visual | n/a |

Note: UIScene and Player both depend on Phaser APIs (scene, matter, tweens) making full unit testing of game objects impractical without a Phaser test harness. The existing `tests/maps.test.js` tests pure config data (no Phaser). Ability logic tests should follow the same pattern: extract pure functions for testable logic (impulse direction calculation, ratio → seconds conversion, tiny guard logic) and test those in isolation. The Phaser-coupled code (particle emission, tween creation) is manual-only.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/abilities.test.js` — covers ABL-01 through HUD-01 (pure logic extraction required)

---

## Open Questions

1. **Character data available in UIScene `create()`?**
   - What we know: UIScene `init(data)` receives `{ gameScene }`. GameScene sets `this.p1` and `this.p2` after UIScene is launched (both happen in `GameScene.create()`). In Phaser 3, `scene.launch()` is async relative to the launching scene's own `create()` — UIScene `create()` runs in a separate update tick.
   - What's unclear: Whether `gs.p1` is defined by the time UIScene `create()` runs.
   - Recommendation: Read char data in the UIScene `update()` loop on first frame where `gs.p1` is defined (lazy init). Set a `this._hudsInitialized = false` flag, build HUD objects with empty/placeholder text in `create()`, and populate char-specific data (emoji, accentColor) in the first `update()` call where `gs.p1 !== undefined`.

2. **Should activation particle feedback be added?**
   - What we know: `_emitParticles(color)` exists on Player and is already called for all 5 abilities.
   - What's unclear: CONTEXT.md says "implement reasonably" — no specific design.
   - Recommendation: No additional activation feedback is needed in Player since particles already fire. In UIScene, a brief icon scale pulse (like the ready-state pulse but faster, one-shot) could be added on ability fire. This is discretionary.

---

## Sources

### Primary (HIGH confidence)
- `/Users/saad/Khalil/src/entities/Player.js` — Full `_useAbility()` inspection, cooldown system, freeze method
- `/Users/saad/Khalil/src/scenes/UIScene.js` — Full `_buildAbilityBar`, `_drawAbilBar`, `update()` inspection
- `/Users/saad/Khalil/src/scenes/GameScene.js` — `player-ability` event handler inspection
- `/Users/saad/Khalil/src/config/characters.js` — Full character roster: id, emoji, accentColor, ability
- `/Users/saad/Khalil/src/config/constants.js` — `ABILITY_COOLDOWN = 8000`, `ABILITIES` object
- `/Users/saad/Khalil/src/scenes/BootScene.js` — Asset loading (no ability-relevant assets)
- `/Users/saad/Khalil/tests/maps.test.js` — Existing test pattern for data-only modules
- `/Users/saad/Khalil/vitest.config.js` — Test runner configuration
- `/Users/saad/Khalil/package.json` — Script definitions

### Secondary (MEDIUM confidence)
- Phaser 3 tween API behavior (repeat: -1, yoyo) — based on Phaser 3 documentation patterns and existing usage in `Player._wobble()`

---

## Metadata

**Confidence breakdown:**
- Ability logic audit: HIGH — based on full source read of all relevant files
- HUD geometry: HIGH — pixel values confirmed from UIScene source
- Phaser tween patterns: HIGH — existing usage in `_wobble()` confirms API
- Tiny bug severity: MEDIUM — requires runtime test to confirm goal-reset interaction

**Research date:** 2026-04-14
**Valid until:** 2026-05-14 (stable codebase, no external dependencies)
