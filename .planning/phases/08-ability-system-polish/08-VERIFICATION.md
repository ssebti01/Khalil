---
phase: 08-ability-system-polish
verified: 2026-04-14T23:07:53Z
status: human_needed
score: 9/9 must-haves verified
human_verification:
  - test: "Run `npm run dev`, open http://localhost:5173, pick Khalil (P1) + Beboush (P2), start match. Press Q for P1."
    expected: "Orange fire particles appear, ball receives an impulse toward opponent's goal. P1 icon stops pulsing, countdown ticks 8→1, then pulse resumes."
    why_human: "Ball physics impulse and particle visual require a running Phaser3 browser session to observe."
  - test: "Press SHIFT for Beboush (P2) in the same match."
    expected: "Beboush emits ice particles, P1 (opponent) gains a blue tint and is immobile for ~2 seconds. P2 icon stops pulsing and shows countdown."
    why_human: "Freeze effect and opponent-target resolution require runtime game observation."
  - test: "Restart with Lilya (P1) + Fafa (P2). Press Q (Lilya) and SHIFT (Fafa)."
    expected: "Lilya dashes horizontally toward ball. Fafa teleports to ball position (clamped, offset -60px). Respective emoji icons show cooldown countdown."
    why_human: "Positional teleport and velocity changes require runtime observation."
  - test: "Restart with Sara (P1). Press Q — super-jump happens. Immediately score a goal (ball resets to center within 350ms)."
    expected: "No ball lurch at center after goal reset. The tiny near-center guard prevents the delayed impulse from firing."
    why_human: "Timing-sensitive guard behavior (350ms window) and goal reset interaction require live gameplay observation."
  - test: "Confirm HUD visual: two emoji icons sit below the score bar at top-center (NOT in bottom corners). Both pulse+glow at match start."
    expected: "P1 icon (e.g., fire emoji) is left of center at ~x=500, P2 icon (e.g., ice emoji) is right of center at ~x=780. Each has a translucent colored circle behind it tinted with character's accentColor."
    why_human: "Visual layout, glow tint quality, and pulse animation require browser observation. Cannot verify pixel positions or visual fidelity programmatically."
  - test: "Confirm old bottom-corner ability bars are gone."
    expected: "No horizontal bars visible at bottom-left or bottom-right corners of the game canvas."
    why_human: "Visual absence of removed UI elements requires browser observation."
---

# Phase 8: Ability System Polish Verification Report

**Phase Goal:** Polish and fix the ability system — fix the root bug that prevents all 5 abilities from firing, add ABILITIES.ice constant, fix GameScene defaults, and replace bottom-corner ability bars with a top-center emoji HUD (emoji icon + countdown + accentColor pulse/glow).
**Verified:** 2026-04-14T23:07:53Z
**Status:** human_needed — All automated checks pass; 6 visual/runtime behaviors need human confirmation.
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `_useAbility` branches on `char.id` roster values, not ability-type strings | VERIFIED | `src/entities/Player.js` line 130: `const id = this.char.id;`, branches `id === 'khalil'` through `id === 'sara'`; grep for `id === 'fire'` returns no matches |
| 2 | Pressing Q as Khalil applies ball impulse using `ABILITIES.fire` values | VERIFIED | Line 135: `ball.applyImpulse({ x: dx * ABILITIES.fire.impulseX, y: ABILITIES.fire.impulseY })` — correctly signed by side |
| 3 | Pressing Q as Beboush emits `player-ability` freeze event; GameScene freezes opponent using `ABILITIES.ice.freezeDuration` | VERIFIED | Player.js line 139 emits event; GameScene.js line 85: `target.freeze(ABILITIES.ice.freezeDuration)` — no hardcoded `2000` remains |
| 4 | `ABILITIES.ice.freezeDuration` equals 2000 in constants | VERIFIED | `src/config/constants.js` line 62: `ice: { freezeDuration: 2000 }` — automated test `test_constants_ice_freeze_duration_equals_2000` passes |
| 5 | GameScene defaults use real roster IDs `'khalil'`/`'beboush'` | VERIFIED | GameScene.js lines 18-19: `data.p1CharId ?? 'khalil'` and `data.p2CharId ?? 'beboush'` |
| 6 | Sara/tiny near-center guard uses `BALL.startX`/`BALL.startY` constants | VERIFIED | Player.js lines 159-162: `Math.abs(ball.x - BALL.startX) < 80 && Math.abs(ball.y - BALL.startY) < 80`; `BALL` is imported at line 2 |
| 7 | UIScene has `_buildAbilityHUD` and `_updateAbilityHUD`; old `_buildAbilityBar`/`_drawAbilBar` removed | VERIFIED | UIScene.js: `_buildAbilityHUD` at line 46, `_updateAbilityHUD` at line 105; grep for `_buildAbilityBar`, `_drawAbilBar`, `_p1AbilBar`, `_p2AbilBar` returns no matches |
| 8 | HUD uses edge-triggered tween lifecycle via `hud.wasReady` flag — no tween stacking | VERIFIED | UIScene.js lines 116-134: `wasReady` guards both tween create (line 116) and tween stop+null (lines 129-131); `hud.pulseTween = null` after stop |
| 9 | `npm test` passes (43 tests); `npm run build` exits 0 | VERIFIED | Test run: 2 files, 43 tests (7 ability + 36 maps) — all passed; build: 19 modules transformed, exit 0 |

**Score:** 9/9 truths verified (automated)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/entities/Player.js` | `_useAbility` branches on `char.id` (khalil/beboush/lilya/fafa/sara), tiny delayed-call guard | VERIFIED | Contains all 5 `id ===` branches; `BALL` imported; `nearCenter` guard and `if (nearCenter) return;` present |
| `src/config/constants.js` | `ABILITIES.ice` entry with `freezeDuration: 2000` | VERIFIED | Line 62: `ice: { freezeDuration: 2000 }` present alongside all other ABILITIES entries |
| `src/scenes/GameScene.js` | Corrected default p1/p2 CharId fallbacks; freeze handler uses `ABILITIES.ice.freezeDuration`; `ABILITIES` imported | VERIFIED | Lines 18-19 use `'khalil'`/`'beboush'`; line 85 uses `ABILITIES.ice.freezeDuration`; line 7 imports `ABILITIES` |
| `src/scenes/UIScene.js` | `_buildAbilityHUD` and `_updateAbilityHUD` present; no old bar methods | VERIFIED | Both methods exist; old `_buildAbilityBar`, `_drawAbilBar`, `_p1AbilBar`, `_p2AbilBar` fully absent |
| `tests/abilities.test.js` | 7 passing tests; `describe('ability logic'`; no Player.js import | VERIFIED | 7 tests, all pass; `describe('ability logic'` on line 12; imports only from `constants.js` and `characters.js` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Player._useAbility` | `char.id` roster branches | `id === 'khalil'` through `id === 'sara'` | WIRED | All 5 branches confirmed; pattern `id === 'khalil'\|id === 'beboush'\|id === 'lilya'\|id === 'fafa'\|id === 'sara'` all present |
| `Player._useAbility` (sara branch) | `delayedCall` callback | `Math.abs(ball.x - BALL.startX) < 80` near-center guard | WIRED | Lines 159-162 contain exact condition with `BALL.startX`/`BALL.startY`; `if (nearCenter) return;` on line 162 |
| `GameScene.events('player-ability', freeze)` | `Player.freeze(duration)` | `source === this.p1 ? this.p2 : this.p1` opponent resolution | WIRED | GameScene.js lines 82-86: opponent resolved correctly, `target.freeze(ABILITIES.ice.freezeDuration)` called |
| `UIScene.create` | `_buildAbilityHUD(0, 500)` and `_buildAbilityHUD(1, 780)` | P1 center-left, P2 center-right of score | WIRED | Lines 42-43: `_buildAbilityHUD(0, GAME_WIDTH / 2 - 140)` and `_buildAbilityHUD(1, GAME_WIDTH / 2 + 140)` |
| `UIScene.update` | `Player.getAbilityCooldownRatio(now)` | Per-frame ratio read, countdown formula | WIRED | Lines 93-94 call `getAbilityCooldownRatio(now)` for both players; formula `Math.ceil((1 - ratio) * ABILITY_COOLDOWN / 1000)` present in `_updateAbilityHUD` line 107 |
| `_updateAbilityHUD` | `this.tweens.add` (pulse) and `tween.stop` | `hud.wasReady` edge-trigger flag | WIRED | Lines 116-134: tween created when `ready && !hud.wasReady`, stopped when `!ready && hud.wasReady`; null-assigned after stop |
| `_updateAbilityHUD` | `char.emoji` + `char.accentColor` | Lazy init + glow fill | WIRED | Line 110: `hud.icon.setText(char.emoji)`; lines 140-141: `fillStyle(char.accentColor, 0.25)` + `fillCircle` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `UIScene._updateAbilityHUD` | `ratio` (cooldown ratio) | `gs.p1/gs.p2.getAbilityCooldownRatio(now)` | Yes — computed from `time` vs `abilityCooldown` timestamp in Player | FLOWING |
| `UIScene._updateAbilityHUD` | `char.emoji`, `char.accentColor` | `gs.p1.char` / `gs.p2.char` → `CHARACTERS` roster | Yes — real character data from `characters.js` with 5 entries | FLOWING |
| `Player._useAbility` | `this.char.id` | `characterData` passed to Player constructor from GameScene | Yes — `getCharacter(this.p1CharId)` with real roster IDs `'khalil'`/`'beboush'` | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 7 ability logic unit tests pass | `npm test -- tests/abilities.test.js` | 7 passed (1 file) | PASS |
| Full test suite (43 tests) with no regressions | `npm test` | 43 passed (2 files) | PASS |
| Production build exits 0 | `npm run build` | 19 modules transformed, exit 0 | PASS |
| `ABILITIES.ice` exists in constants module | grep pattern in constants.js | Line 62 confirmed | PASS |
| Old `_buildAbilityBar` removed from UIScene | grep pattern in UIScene.js | No matches found | PASS |
| `id === 'fire'` no longer in Player._useAbility | grep pattern in Player.js | No matches found | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| D-01 | 08-02-PLAN.md | Replace bottom-corner bars with HUD below score bar, top-center | SATISFIED (automated partial) | `_buildAbilityHUD` called at `GAME_WIDTH/2 ± 140` at y=97 in create(); old bar methods absent. Visual position requires human confirmation. |
| D-02 | 08-02-PLAN.md | Large emoji icon + countdown number; disappears when ready | SATISFIED (automated partial) | `_updateAbilityHUD` line 110 sets emoji, line 113 shows/hides countdown; `ready ? '' : String(secsRemaining)`. Visual rendering requires human confirmation. |
| D-03 | 08-02-PLAN.md | Pulse/glow using `char.accentColor` when ready | SATISFIED (automated partial) | Lines 116-141: tween created on ready, glow `fillStyle(char.accentColor, 0.25)` + `fillCircle` when ready. Animation quality requires human confirmation. |
| D-04 | 08-01-PLAN.md | All 5 abilities audited and correct (fire/ice/thunder/ninja/tiny) | SATISFIED | All 5 branches exist in `_useAbility` branching on `char.id`; each branch wired to correct physics/event call per per-ability audit |
| D-05 | 08-01-PLAN.md | Ability IDs matched by `char.id` in `Player._useAbility()` | SATISFIED | `_useAbility` branches on `id === 'khalil'` etc.; automated test `test_roster_character_ids_match_expected_set` confirms roster contract; no `id === 'fire'` etc. remain |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/scenes/UIScene.js` | 99 | `void p1Color; void p2Color;` — variables computed but suppressed with `void` | Info | `p1Color`/`p2Color` are read from player chars in update() but not used (comment says "future use"). These are not stubs — they don't affect rendering. No functional impact. |

No blockers or warnings found. The `void` suppression is a minor code style note with no impact on goal achievement.

---

### Human Verification Required

The following 6 items require a running browser session to confirm. Automated checks have passed for all underlying code paths; these verify visual appearance and runtime behavior.

#### 1. Fire ability visual + HUD response (Khalil)

**Test:** `npm run dev` → pick Khalil (P1) + any P2, start match, press Q.
**Expected:** Orange fire particles appear at Khalil's position; ball receives a directed impulse. P1's fire emoji icon stops pulsing, orange glow disappears, countdown numbers "8" through "1" appear below the icon, then pulse+glow resume.
**Why human:** Ball physics impulse magnitude and particle burst require a running Phaser3 canvas to observe.

#### 2. Freeze ability — opponent targeting (Beboush)

**Test:** Pick Beboush as P2, start match, press SHIFT.
**Expected:** P1 (opponent) receives a blue tint and is immobile for ~2 seconds. Beboush's cooldown begins, not Khalil's.
**Why human:** Opponent-target resolution and freeze visual effect require runtime observation.

#### 3. Thunder/Ninja abilities (Lilya/Fafa)

**Test:** Pick Lilya (P1) + Fafa (P2). Press Q → Lilya dashes. Press SHIFT → Fafa teleports.
**Expected:** Lilya moves horizontally at speed 15 toward ball. Fafa jumps to `(clamp(ball.x, 80, 1200), ball.y - 60)` with zeroed velocity.
**Why human:** Physics-based movement and teleportation positions require visual confirmation.

#### 4. Tiny near-center guard (Sara)

**Test:** Pick Sara (P1), press Q to super-jump, then immediately score a goal (ball resets to center within 350ms).
**Expected:** No ball lurch at center after the goal reset — the delayed-call callback fires but sees `nearCenter = true` and skips the impulse.
**Why human:** Timing-sensitive guard behavior requiring goal scoring within a 350ms window is not safely automatable.

#### 5. HUD layout — top-center positioning, emoji icons, accentColor glow

**Test:** Start any match. Look at the top-center area of the screen below the score bar.
**Expected:** Two large emoji icons visible (P1 left of center, P2 right of center) at approximately y=97. Each icon has a translucent colored circle behind it matching the character's accentColor (e.g., orange-ish for Khalil, pale-blue for Beboush). Both icons pulse with alpha+scale animation at match start.
**Why human:** Visual appearance (size, glow color quality, pulse animation) requires browser observation.

#### 6. Absence of old bottom-corner bars

**Test:** Start any match. Look at bottom-left and bottom-right corners of the game canvas.
**Expected:** No horizontal ability bars visible in either bottom corner.
**Why human:** Visual absence of removed UI elements requires browser inspection.

---

### Gaps Summary

No gaps. All 9 automated truths verified, all 5 requirements satisfied at the code level, build and tests pass. Six items require human confirmation for the visual/runtime layer of D-01, D-02, and D-03.

---

_Verified: 2026-04-14T23:07:53Z_
_Verifier: Claude (gsd-verifier)_
