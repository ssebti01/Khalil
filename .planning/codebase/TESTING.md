# Testing Patterns

**Analysis Date:** 2026-04-14

## Test Framework

**Runner:** None — no test framework is installed or configured.

**Assertion Library:** None.

**Test Configuration:** No `jest.config.*`, `vitest.config.*`, `mocha*`, or equivalent config files exist.

**Run Commands:**
```bash
npm run dev      # Start dev server (localhost:5173) — only available script
npm run build    # Vite production build
npm run preview  # Preview production build
```

There is no `npm test` script. Running `npm test` will fail.

## Test File Organization

**Test directory:** `/Users/saad/Khalil/tests/` exists but is completely empty (no files).

**Test files in source:** Zero `.test.js`, `.spec.js`, or similar files found anywhere in the project.

**Coverage config:** None.

## What Is Currently Tested

Nothing is tested via automation. The entire codebase of ~1,200 lines across 11 source files has zero automated test coverage.

## What Is Untested (Full Inventory)

**Physics & gameplay logic:**
- Ball velocity capping (`src/entities/Ball.js` — `update()` lines 65–76)
- Ball angular velocity capping (`src/entities/Ball.js` — lines 73–77)
- Stuck-ball detection and reset timer (`src/entities/Ball.js` — lines 79–89)
- Player ground detection (`src/entities/Player.js` — `checkGround()`)
- Player horizontal velocity and damping (`src/entities/Player.js` — `update()`)
- Jump edge-detection (requires fresh keypress, must be grounded) (`src/entities/Player.js` — lines 75–82)
- Ability cooldown enforcement (`src/entities/Player.js` — lines 85–92)
- `getAbilityCooldownRatio()` formula (`src/entities/Player.js` — lines 157–161)
- Player arena boundary clamping (`src/entities/Player.js` — lines 95–104)
- Player freeze/unfreeze timing (`src/entities/Player.js` — `freeze()`)

**Ability system:**
- Fire ability impulse application (`src/entities/Player.js` — `_useAbility()` lines 111–113)
- Ice ability freeze event emission and cross-player effect (`src/entities/Player.js` — line 116)
- Thunder ability dash (`src/entities/Player.js` — lines 118–120)
- Ninja ability teleport clamping (`src/entities/Player.js` — lines 122–126)
- Tiny ability double-jump + ball lift with delayed call (`src/entities/Player.js` — lines 128–136)

**Character data:**
- `getCharacter(id)` fallback to first character on unknown id (`src/config/characters.js` — line 77)
- Stat multipliers (speed, jump, power) applied correctly in Player (`src/entities/Player.js` — lines 59, 77)

**Match/scoring logic (embedded in GameScene):**
- Goal registration on collision sensor (`src/scenes/GameScene.js` — `_setupGoalSensors()`)
- Score increment and max-score check (`src/scenes/GameScene.js` — `_registerGoal()`)
- Match timer countdown and end-of-time trigger (`src/scenes/GameScene.js` — `create()` timer block)
- Draw detection (equal scores at time expiry) (`src/scenes/GameScene.js` — `_endMatch()`)
- Goal cooldown preventing double-count (`src/scenes/GameScene.js` — `_registerGoal()` line 202)

**AI system:**
- State transitions: DEFEND / CHASE / SHOOT thresholds (`src/ai/CPUPlayer.js` — lines 25–35)
- Target position calculation per state (`src/ai/CPUPlayer.js` — line 38)
- Jump trigger condition (`src/ai/CPUPlayer.js` — lines 48–50)
- Random ability use with manual cooldown bypass (`src/ai/CPUPlayer.js` — lines 53–60)
- CPU arena boundary clamping (`src/ai/CPUPlayer.js` — lines 65–68)

**UI:**
- `getAbilityCooldownRatio()` output clamped to [0, 1] rendered correctly in UIScene
- Score display update each frame
- Timer formatting MM:SS (`src/scenes/UIScene.js` — lines 82–84)
- Timer color change at ≤15 seconds (`src/scenes/UIScene.js` — line 85)

## Testing Gaps by Risk

**High risk (logic errors would go unnoticed in gameplay):**

| Area | Risk | Files |
|---|---|---|
| Ability cooldown math | Off-by-one in ratio formula breaks UI bar | `src/entities/Player.js:157` |
| Jump edge detection | Regression could allow jump-spam | `src/entities/Player.js:75` |
| Goal double-count prevention | Race condition could award extra goals | `src/scenes/GameScene.js:184` |
| Ball stuck detection | Wrong threshold could cause phantom resets | `src/entities/Ball.js:79` |
| Score win condition | Wrong comparison could end match early or never | `src/scenes/GameScene.js:215` |
| AI ability use hack | Direct `abilityCooldown = 0` mutation is fragile | `src/ai/CPUPlayer.js:57` |
| `getCharacter()` fallback | Silent fallback to wrong character could confuse AI | `src/config/characters.js:77` |

**Medium risk (visual/feel issues, harder to unit-test):**

| Area | Risk | Files |
|---|---|---|
| Player boundary clamping | Wrong magic numbers could trap player | `src/entities/Player.js:95` |
| CPU clamp numbers | Hardcoded `60` differs from `GOAL.width` constant | `src/ai/CPUPlayer.js:65` |
| Velocity cap values | Too aggressive caps could nerf abilities silently | `src/entities/Ball.js:67` |

## Recommendations for First Tests

If a test framework is added, priority order for first tests:

1. **`getCharacter(id)` fallback** — pure function, no Phaser dependency, easiest to test
2. **`getAbilityCooldownRatio(time)`** — pure calculation once decoupled from `this.scene.time`
3. **Ball velocity cap formula** — pure math, extract from Phaser body dependency
4. **Stuck-ball timer logic** — stateful but can be unit-tested with mock delta values
5. **AI state transitions** — deterministic given mock `ball.x`, `ball.y`, `p.x`, `p.side`
6. **Score win condition** — simple comparison in `_registerGoal()`
7. **Goal cooldown gate** — time-based guard, testable with mock `time.now`

## Adding a Test Framework

The project uses `"type": "module"` in `package.json`, so any test framework must support ESM natively or via config. Recommended:

```bash
npm install --save-dev vitest
```

Add to `package.json`:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

Place tests in `/Users/saad/Khalil/tests/unit/[system]/` per the project's coding standards. Phaser-dependent code cannot be tested headlessly without mocking the Phaser/Matter.js layer — pure logic should be extracted to testable functions first.

## Test Types Currently Available

**Unit Tests:** Not applicable — no framework.

**Integration Tests:** Not applicable — no framework.

**E2E Tests:** Not applicable — no framework (Playwright/Cypress not installed).

**Manual Playtesting:** This is the only form of verification currently in use.

---

*Testing analysis: 2026-04-14*
