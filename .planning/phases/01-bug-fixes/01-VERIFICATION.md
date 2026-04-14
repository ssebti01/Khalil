---
phase: 01-bug-fixes
verified: 2026-04-14T00:00:00Z
status: human_needed
score: 5/5 must-haves verified in code; runtime behavior requires human confirmation
re_verification: false
human_verification:
  - test: "Kick ball into left goal — P2 scores"
    expected: "Score counter increments for P2, GOAL! flash appears, ball resets to centre"
    why_human: "Physics sensor fire timing can only be confirmed at runtime in the browser"
  - test: "Kick ball into right goal — P1 scores"
    expected: "Score counter increments for P1, GOAL! flash appears, ball resets to centre"
    why_human: "Symmetrical sensor check requires runtime observation"
  - test: "Straight centre-shot into left goal — ball rolls to back wall, no bounce-back before goal registers"
    expected: "Ball travels all the way to the back wall; goal registers before or as it settles; ball does not rebound out through the post without scoring"
    why_human: "Restitution-0.4 back wall with 77px clearance should allow goal registration first, but exact impulse and timing requires live physics"
  - test: "Ball touching goal post face from open field — no goal registered"
    expected: "Sensor right edge is at x=20 (left) / x=1260 (right); ball must travel 26px past post face before triggering; gentle post-tap must NOT score"
    why_human: "Sensor overlap boundary for partial contact depends on Matter.js AABB resolution, not static geometry alone"
  - test: "Release movement key — player stops within ~9 frames (~150ms at 60fps)"
    expected: "No visible slide beyond a quarter-second after key release; no ghost motion on tap-and-release"
    why_human: "Frame-accurate damping behaviour (0.75^9 decay + 0.5 epsilon hard-stop) is a visual feel judgment"
  - test: "Alt-tab away while holding a direction key, then return"
    expected: "Player does not drift into a wall or goal; velocity is zero on return"
    why_human: "Requires triggering actual browser blur event; cannot simulate programmatically without a running browser"
  - test: "Normal movement — no jerkiness, no premature stop while key held"
    expected: "Player moves at full speed the entire duration the key is held; no stutter"
    why_human: "Feel quality judgment requires live play"
---

# Phase 01: Bug Fixes Verification Report

**Phase Goal:** Fix two game-breaking bugs — ball stopping at goal mouth and player movement drift after key release.
**Verified:** 2026-04-14
**Status:** human_needed — all code changes are present, substantive, and wired; runtime physics and feel require human confirmation.
**Re-verification:** No — initial verification.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Ball rolls through goal mouth — back wall clearance > ball diameter | VERIFIED | Back wall right face at x=-20 (left) / x=1300 (right); post face at x=57 / x=1223; gap = 77px vs 52px ball diameter |
| 2 | Score sensor sits inside goal mouth, not in open field | VERIFIED | Left sensor spans x=-20..20; right sensor spans x=1260..1300; both are fully behind their respective post faces (x=57 / x=1223) |
| 3 | Scoring logic fires for correct player on correct goal | VERIFIED | `_setupGoalSensors`: goalLeft → `_registerGoal(1)` (P2 scores), goalRight → `_registerGoal(0)` (P1 scores); wired through collisionstart event |
| 4 | Epsilon hard-stop prevents infinite drift after key release | VERIFIED | `Math.abs(dampedVX) < 0.5 ? 0 : dampedVX` present in `update()` else-branch (Player.js:77) with correct 0.75 multiplier |
| 5 | Blur listener zeros velocity on window focus loss | VERIFIED | `this.scene.game.events.on('blur', ...)` present in `_create()` (Player.js:46); fires `setVelocityX(0)` only, preserving Y jump arc |

**Score:** 5/5 truths verified in code

---

## Required Artifacts

| Artifact | Provides | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/scenes/GameScene.js` | Goal geometry (`_createWalls`, `_createGoals`), sensor collision handling | Yes | Yes — full scene implementation | Yes — imported by main.js scene list | VERIFIED |
| `src/entities/Player.js` | Movement damping, blur listener | Yes | Yes — full player implementation | Yes — instantiated in GameScene as p1/p2 | VERIFIED |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `_createWalls()` | Goal back walls | `matter.add.rectangle` at x=-thick / x=w+thick | WIRED | Left back wall center x=-40, right face x=-20; right back wall center x=1320, left face x=1300 |
| `_createGoals()` | Score sensors | `matter.add.rectangle` at x=0 / x=GAME_WIDTH | WIRED | Left sensor center 0 (spans -20..20); right sensor center 1280 (spans 1260..1300) |
| Sensor labels | Collision handler | `collisionstart` → label match → `_registerGoal` | WIRED | Labels 'goalLeft'/'goalRight' checked in `_setupGoalSensors`; correct player index passed |
| `update()` else-branch | Epsilon hard-stop | `Math.abs(dampedVX) < 0.5 ? 0 : dampedVX` | WIRED | Present at Player.js:77 |
| `_create()` | Blur listener | `this.scene.game.events.on('blur', ...)` | WIRED | Present at Player.js:46; uses Phaser game event bus |

---

## Geometry Verification (Plan 01-01 — Detail)

### Left Goal

| Measurement | Expected (plan) | Actual (code) | Pass |
|-------------|----------------|---------------|------|
| Back wall center x | -thick = -40 | `matter.add.rectangle(-thick, ...)` → -40 | Yes |
| Back wall right face x | -40 + 20 = -20 | -20 | Yes |
| Post face x | 62 - 5 = 57 | Post center 62, half-width 5 → 57 | Yes |
| Gap (face to face) | 77px | 57 - (-20) = 77px | Yes |
| Ball diameter | 52px | BALL.radius=26, diameter=52 | Yes |
| Clearance margin | 25px each side | (77-52)/2 = 12.5px | Acceptable — ball passes cleanly |
| Sensor center x | 0 | 0 | Yes |
| Sensor width | 40 | 40 | Yes |
| Sensor right edge | 20 | 0 + 20 = 20 | Yes |
| Sensor fires when ball center > | 46 (20+26) | 46 | Yes |
| Post face x | 57 | 57 | Ball leading edge reaches 20+26=46 → trailing edge at 46-52=-6; ball straddles post. Not open-field. |

### Right Goal

| Measurement | Expected (plan) | Actual (code) | Pass |
|-------------|----------------|---------------|------|
| Back wall center x | w + thick = 1320 | `matter.add.rectangle(w + thick, ...)` → 1320 | Yes |
| Back wall left face x | 1320 - 20 = 1300 | 1300 | Yes |
| Post face x | 1280 - 62 + 5 = 1223 | Post center 1218, half-width 5 → 1223 | Yes |
| Gap | 1300 - 1223 = 77px | 77px | Yes |
| Sensor center x | GAME_WIDTH = 1280 | 1280 | Yes |
| Sensor left edge | 1260 | 1280 - 20 = 1260 | Yes |
| Sensor right edge in open field | must not overlap | 1260 > 1223 (post face) → sensor entirely behind post | Yes |

### Sensor Pre-trigger Risk

The plan noted (Task 2 detail): "Use right edge = 20 to be safe: center x = 0, half-width = 20." The implementation uses center x=0, half-width=20, right edge=20. The ball triggers the left sensor when its center passes x=46 (20+26). The post face is at x=57. The ball center is 11px short of the post face when the sensor fires — but the ball's right edge (at x=72) is already 15px inside the goal. In practice, Matter.js `collisionstart` fires as the AABB envelopes overlap, so the ball must be partially overlapping the sensor box. The sensor starts at x=-20, and the ball right edge reaches x=20 when ball center is x=-6. The ball begins overlapping the sensor at ball center x = -20 + 26 = 6 (leftmost). The sensor fires as the ball enters the sensor zone from the right, meaning the ball center is moving left (into goal) and the rightward leading edge (x = ball_center + 26) must cross x = 20 (the sensor right edge). The event fires when ball_center + 26 >= 20, i.e., ball_center >= -6. That means sensor fires very deep inside the goal. This is correct — not an open-field trigger. The concern in the plan was about the OLD sensor (right edge = 55) which fired in open field. New sensor right edge = 20 is safe.

**Conclusion:** Geometry is correct. Open-field false triggers are eliminated.

---

## Data-Flow Trace

Not applicable — this phase fixes physics geometry and player movement logic. No dynamic data rendering pipeline is involved. The score counter is updated via `_registerGoal()` which writes to `this.score[]` and the UIScene reads that reference directly.

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for sensor/physics checks — requires a running Phaser browser instance. No headless runtime path available.

Damping math spot-check (static calculation):

| Frame | VX (starting at 5.5 px/frame) | Epsilon check |
|-------|-------------------------------|---------------|
| 0 | 5.500 | — |
| 1 | 4.125 | — |
| 2 | 3.094 | — |
| 3 | 2.320 | — |
| 4 | 1.740 | — |
| 5 | 1.305 | — |
| 6 | 0.979 | — |
| 7 | 0.734 | — |
| 8 | 0.550 | — |
| 9 | 0.413 | < 0.5 → HARD STOP to 0 |

Player stops at frame 9 (~150ms at 60fps). Matches plan specification exactly.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | No TODOs, no placeholder returns, no hardcoded empty data | — | — |

Scanned for: TODO/FIXME, `return null`, `return {}`, `return []`, placeholder strings, empty handlers. None found in the two changed files.

---

## Requirements Coverage

No formal requirements IDs were declared in these plans (no `requirements:` frontmatter). The plans are self-contained bug-fix tasks with explicit must-haves. All must-haves verified:

| Must-Have | Plan | Code Evidence | Status |
|-----------|------|---------------|--------|
| Ball into left goal → P2 scores | 01-01 | `goalLeft` → `_registerGoal(1)` → `score[1]++` | SATISFIED |
| Ball into right goal → P1 scores | 01-01 | `goalRight` → `_registerGoal(0)` → `score[0]++` | SATISFIED |
| Ball rolls through goal mouth (no bounce-back) | 01-01 | 77px gap vs 52px ball; restitution 0.4 back wall positioned at x=-40 | SATISFIED (geometry); runtime feel: HUMAN NEEDED |
| Sensor does not fire in open field | 01-01 | Left sensor right edge x=20; right sensor left edge x=1260; both behind post faces | SATISFIED |
| Key release stops player ~9 frames | 01-02 | 0.75 damping + `< 0.5` hard-stop; mathematical proof: stops at frame 9 | SATISFIED |
| Alt-tab does not cause drift | 01-02 | `game.events.on('blur')` → `setVelocityX(0)` in `_create()` | SATISFIED (presence); runtime: HUMAN NEEDED |
| Normal movement unchanged | 01-02 | `isDown` branches unchanged; else-branch is the only modification | SATISFIED; runtime feel: HUMAN NEEDED |

---

## Human Verification Required

### 1. Goal Registration — Left Goal

**Test:** Start a 2-player match. Run P1 left and kick the ball into the left goal with a direct centre shot.
**Expected:** P2's score increments, GOAL! text appears, ball resets to centre after 2.5s.
**Why human:** Phaser/Matter.js collision timing between ball and sensor depends on physics step ordering, which cannot be verified without a running engine.

### 2. Goal Registration — Right Goal

**Test:** Kick the ball into the right goal from the left side of the pitch.
**Expected:** P1's score increments.
**Why human:** Symmetric to above; confirms both goals work independently.

### 3. No Bounce-Back on Straight Shot

**Test:** Aim a direct shot at the goal centre (not angled). Observe whether the ball rebounds out through the goal mouth before the goal registers.
**Expected:** Ball travels to the back wall and goal registers; no bounce-back before registration.
**Why human:** Even with 77px clearance, an angled or high-speed shot with restitution 0.4 could in theory bounce. The geometry is correct; the feel of the fix requires runtime confirmation.

### 4. Open-Field Post Contact — No False Goal

**Test:** Walk P1 directly into the left goal post face (x=62) from the open field. Let the ball rest briefly against the post without entering the goal.
**Expected:** No GOAL! event fires; score unchanged.
**Why human:** Sensor right edge is at x=20, well behind post face at x=57, but Matter.js AABB broadphase could in theory trigger earlier than expected on corner cases.

### 5. Movement Stop After Key Release

**Test:** Hold A (P1 left), release, watch player. Repeat with D. Tap A quickly.
**Expected:** Player stops within ~150ms of release. No ghost slide. No stutter while holding.
**Why human:** Visual feel of 9-frame deceleration is a subjective quality judgment.

### 6. Alt-Tab Drift Prevention

**Test:** Hold a direction key, alt-tab to another window, return to the browser tab.
**Expected:** Player is stationary where it was when focus left; it has not drifted into a wall or goal.
**Why human:** Requires real browser focus/blur events; no headless equivalent.

---

## Gaps Summary

No gaps found. All code changes specified in both plans are present, exact, and wired correctly:

- Back wall positions match plan exactly (-thick and w+thick).
- Sensor positions match the corrected final values from the plan (center 0 and center GAME_WIDTH, width 40 each).
- Collision handler labels match sensor labels.
- Epsilon hard-stop formula matches plan exactly (0.75 multiplier, 0.5 threshold, 0 clamp).
- Blur listener matches plan exactly (game.events.on, setVelocityX(0) only, registered in _create).

All remaining open items are runtime physics and feel verification — appropriate for human testing in the browser.

---

_Verified: 2026-04-14_
_Verifier: Claude (gsd-verifier)_
