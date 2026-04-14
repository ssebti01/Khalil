# Codebase Concerns

**Analysis Date:** 2026-04-14

---

## Tech Debt

### [CRITICAL] Zero Test Coverage — Entire Codebase Untested

- Issue: The `tests/` directory is completely empty. No unit, integration, or smoke tests exist anywhere in the project.
- Files: `/Users/saad/Khalil/tests/` (empty directory)
- Impact: Any regression in physics constants, ability logic, AI behaviour, goal detection, or score tracking goes undetected. The coding standards mandate automated tests as a BLOCKING gate — this is violated project-wide.
- Fix approach: Add a test runner (Vitest is the natural Vite companion). Write unit tests for pure-logic modules first: `src/config/constants.js` formula assertions, `src/entities/Ball.js` velocity capping, `src/entities/Player.js` cooldown ratio math, and `src/ai/CPUPlayer.js` state transition logic.

---

### [CRITICAL] AI Bypasses Cooldown System Via Direct Property Mutation

- Issue: `CPUPlayer.update()` sets `p.abilityCooldown = 0` to force-fire an ability, then never restores the original value if the ability fires. The comment reads `// restore if it fired` but the restore never happens — `origCwd` is captured and then silently abandoned.
- Files: `src/ai/CPUPlayer.js` lines 56–60
- Impact: After the CPU fires one ability, `abilityCooldown` is never properly reset to the post-fire timestamp, so subsequent cooldown ratio calculations in `UIScene` and `Player.getAbilityCooldownRatio()` return stale/incorrect values. The cooldown bar for P2 in CPU mode is unreliable.
- Fix approach: Remove the `origCooldown` capture dead code. Let `_useAbility` set the cooldown normally (it already does via `this.abilityCooldown = time + ABILITY_COOLDOWN`), and call it through the normal `Player.update` path by synthesising a fake controls state, or expose a public `useAbility(time, ball)` method on `Player`.

---

### [HIGH] AI Directly Manipulates Physics Body — Bypasses Player Update Loop

- Issue: `CPUPlayer.update()` calls `p.sprite.setVelocityX()` and `p.sprite.setVelocityY()` directly on the player entity, and also calls `p._useAbility()` (a private method). The `Player.update()` path is entirely skipped for CPU-controlled players in `GameScene.update()`.
- Files: `src/ai/CPUPlayer.js` lines 45–49, `src/scenes/GameScene.js` lines 268–273
- Impact: Boundary clamping in `Player.update()` (lines 95–104) and ground checking via `checkGround()` are not called for the CPU player each frame. The CPU has its own duplicate clamp (lines 65–68) with a slightly different minX value (60 vs 62), creating a 2px inconsistency. Any future logic added to `Player.update()` won't automatically apply to the CPU.
- Fix approach: Add a `setInputState({ left, right, jump, ability })` method to `Player` that the CPU can populate each frame, then let `Player.update()` run normally for both human and CPU players.

---

### [HIGH] `_useAbility` Is a Private Method Called by an External Class

- Issue: `CPUPlayer` calls `p._useAbility(fakeTime, ball)` on a `Player` instance. The underscore prefix signals private-by-convention in JavaScript, but there is no enforcement.
- Files: `src/ai/CPUPlayer.js` line 59, `src/entities/Player.js` line 107
- Impact: Any internal refactor of `_useAbility` (signature change, split into sub-methods) silently breaks the AI. This is a fragile coupling between two separate subsystems.
- Fix approach: Expose a public `activateAbility(time, ball)` method on `Player` that wraps the internal logic.

---

### [HIGH] `MenuScene._updateCharLabels()` Restarts the Full Scene to Refresh Two Text Labels

- Issue: When the player toggles between 2P and VS CPU mode, the entire scene is destroyed and re-instantiated via `this.scene.restart()`.
- Files: `src/scenes/MenuScene.js` lines 150–153
- Impact: The character selections made by both players are reset on every mode toggle — the player loses their P1/P2 character picks when they switch mode. This is a UX bug, not just debt. Any future state stored in the scene is also wiped.
- Fix approach: Store `vsMode`, `p1CharIndex`, and `p2CharIndex` on a persistent object passed through `init()` data, or update only the relevant label text objects in-place without restarting.

---

### [HIGH] Hardcoded Magic Numbers for Arena Geometry Not in Constants

- Issue: Multiple layout values are repeated literally across files rather than being sourced from `constants.js`:
  - Floor height `80` appears in `Player.js` lines 21, 50; `GameScene.js` lines 83, 103, 116–135, 144–165; `UIScene.js` line 47 (implicitly via `670` which is `GAME_HEIGHT - 50`)
  - Goal post X position `60`/`62` appears in `GameScene.js` lines 133, 162 and `CPUPlayer.js` lines 21, 65–67 with inconsistent values
  - Player clamp minX is `62 + PLAYER.headRadius` in `Player.js` line 95, but `60 + PLAYER.headRadius` in `CPUPlayer.js` line 65
- Files: `src/entities/Player.js` lines 21, 50, 95–104; `src/ai/CPUPlayer.js` lines 65–68; `src/scenes/GameScene.js` throughout `_drawArena()` and `_createWalls()`
- Impact: Changing floor height or goal post position requires hunting across 4+ files. The `62` vs `60` discrepancy is an existing bug.
- Fix approach: Add `ARENA.floorHeight`, `ARENA.goalPostX`, and `ARENA.playerMinX`/`ARENA.playerMaxX` to `src/config/constants.js` and replace all raw literals.

---

### [HIGH] `'ice'` Character Has No Ability Implementation

- Issue: The `characters.js` roster defines an `'ice'` character (Frost) with a "Freeze" ability. In `Player._useAbility()`, the `'ice'` branch only emits a `'player-ability'` event and fires particles. `GameScene` listens and calls `target.freeze(2000)`. This actually works — but `characters.js` lists Frost with `id: 'ice'` while `constants.js` has no `ABILITIES.ice` entry, which is inconsistent with how all other characters reference their tuning values.
- Files: `src/config/constants.js` lines 50–55, `src/config/characters.js` lines 17–28, `src/entities/Player.js` lines 115–117
- Impact: Low immediate risk, but the freeze duration `2000` ms is hardcoded inline at `GameScene.js` line 57 and `Player.js` line 153, not in `ABILITIES`. Any rebalancing requires finding two separate hardcoded values.
- Fix approach: Add `ABILITIES.ice = { freezeDuration: 2000 }` to `constants.js` and reference it from both call sites.

---

### [MEDIUM] `Ball._create()` Generates a Procedural Texture Conditionally

- Issue: `Ball._create()` checks `if (!this.scene.textures.exists('ball'))` before generating the ball texture, but `Ball` is only ever instantiated once per game session. The guard is reasonable for scene restarts but introduces a subtle assumption that texture caching persists across scene transitions.
- Files: `src/entities/Ball.js` lines 14–39
- Impact: If Phaser ever flushes the texture cache on scene stop (it doesn't by default, but plugin or future Phaser versions might), the ball would render as a missing texture. More importantly, the ball's graphical appearance is generated in code rather than being a proper asset — this prevents artists from iterating on the ball design without modifying code.
- Fix approach: Generate the ball texture once in `BootScene.preload()` using `this.load.image()` or `this.textures.addCanvas()`, removing the conditional creation from `Ball._create()`.

---

### [MEDIUM] `GameScene._drawArena()` Is 57 Lines of Inline Drawing Commands

- Issue: All arena rendering — gradient sky, crowd silhouettes, pitch, markings, goal nets, goal posts — is produced by a single 57-line method filled with raw coordinate math.
- Files: `src/scenes/GameScene.js` lines 80–136
- Impact: Hard to maintain. Adding or tweaking visual elements requires navigating dense geometric calculations. There is also duplicated background drawing between `MenuScene._drawBackground()` and `GameScene._drawArena()` (same gradient, same ground colour).
- Fix approach: Extract arena drawing to a dedicated `ArenaRenderer` class or a `drawArena(scene, graphics)` utility. Share the background gradient via a common helper.

---

### [MEDIUM] `UIScene` Holds a Direct Object Reference to `GameScene`

- Issue: `UIScene.init()` stores `this.gameScene = data.gameScene` — a live reference to the `GameScene` instance. `UIScene.update()` then reads `gs.score`, `gs.matchTime`, `gs.p1`, `gs.p2`, and calls `this.scene.get('GameScene').time.now`.
- Files: `src/scenes/UIScene.js` lines 7–9, 72–96
- Impact: Tight coupling between scenes. If `GameScene` is restarted or its internal structure changes, `UIScene` silently accesses stale data. The double access pattern (`gs.p1` via stored reference AND `this.scene.get('GameScene').time.now` via scene manager) is inconsistent and redundant.
- Fix approach: Use Phaser's built-in scene event system — `GameScene` emits `'score-changed'` and `'time-updated'` events; `UIScene` subscribes to them rather than polling raw properties each frame.

---

### [MEDIUM] `Tiny` Ability Uses a `delayedCall` That Can Fire After Match End

- Issue: `Player._useAbility()` for the `'tiny'` character schedules a `this.scene.time.delayedCall(350, ...)` that fires `setVelocityY` on the player sprite and `applyImpulse` on the ball. This callback is not cancelled if the match ends or the scene transitions during those 350ms.
- Files: `src/entities/Player.js` lines 131–134
- Impact: In the rare case a goal is scored or time expires within 350ms of Tiny's ability activation, the delayed callback fires against a potentially destroyed or reset scene, which can throw a runtime error ("Cannot read properties of undefined") or cause unexpected physics impulses during the goal celebration/reset sequence.
- Fix approach: Store the event reference and cancel it in `Player.reset()`. Alternatively, guard the callback with `if (!this.scene || this.scene.sys.isActive() === false) return`.

---

### [MEDIUM] No Audio System Exists

- Issue: `BootScene.preload()` loads zero audio files. There are no sound effect calls anywhere in the codebase. The `assets/` directory is empty.
- Files: `src/scenes/BootScene.js`, `assets/` (empty)
- Impact: The game is completely silent. Goal scoring, ability use, ball kicks, and menu interactions have no audio feedback. This significantly reduces game feel.
- Fix approach: Establish an `AudioManager` class or use Phaser's built-in `this.sound.play()`. Load sound effects in `BootScene` and emit sound events from `GameScene` and `Player`.

---

### [MEDIUM] Character Selection Allows Both Players to Pick the Same Character

- Issue: `MenuScene._changeChar()` applies no constraint preventing P1 and P2 from selecting the same character. Both can independently cycle to the same `charIndex`.
- Files: `src/scenes/MenuScene.js` lines 155–168
- Impact: Minor UX issue, but may cause confusion in replays and results screens. More critically, identical character stats make the match effectively symmetric regardless of selection.
- Fix approach: Add a guard in `_changeChar()` that skips the other player's current index, or add a visual "taken" indicator on already-selected characters.

---

## Performance Concerns

### [MEDIUM] `UIScene.update()` Runs Every Frame and Calls `clear()` + Redraws Graphics Twice

- Issue: `_drawAbilBar()` calls `bar.fill.clear()` followed by `fillRoundedRect()` on every single frame for both P1 and P2, regardless of whether the cooldown ratio has changed.
- Files: `src/scenes/UIScene.js` lines 66–70, 94–95
- Impact: Two `Graphics.clear()` + `fillRoundedRect()` operations every frame (120 draw operations/sec at 60fps). For a simple HUD bar, this is unnecessary churn on the WebGL renderer. Minor at current scale, but establishes a poor pattern.
- Fix approach: Cache the last ratio and only redraw when it changes by more than a threshold (e.g., `> 0.005`). Or replace the `Graphics` bar with a scaled `Rectangle` game object, which updates via `setSize()` without clear/redraw cycles.

### [LOW] Crowd Silhouettes Are Redrawn as 60 Individual `fillRect` Calls Each Scene Create

- Issue: `GameScene._drawArena()` draws 60 crowd silhouettes using a loop of `bg.fillRect()` calls at scene creation.
- Files: `src/scenes/GameScene.js` lines 88–92
- Impact: Static, one-time cost at scene creation — not a runtime concern. However, when the scene restarts (rematch), this is recomputed from scratch. The drawn graphics object is also not converted to a texture/renderTexture, so all 60+ shapes remain as individual draw commands in the graphics object.
- Fix approach: Render arena graphics to a `RenderTexture` once and reuse it on restart.

---

## Architectural Risks

### [HIGH] No Input Abstraction Layer — Controls Are Hardcoded Keyboard Keys

- Issue: All keyboard bindings (`A`, `D`, `W`, `Q`, arrow keys, `SHIFT`) are defined inline in `GameScene.create()` with no remapping capability.
- Files: `src/scenes/GameScene.js` lines 31–43
- Impact: Adding gamepad support, touch controls, or key remapping requires modifying `GameScene` directly. There is no `InputManager` or control-scheme abstraction. The `controlScheme` object passed to `Player` is a good structure, but it is hardcoded at the source.
- Fix approach: Create a `src/input/InputManager.js` that maps logical actions (`p1Move`, `p1Jump`, `p1Ability`) to configurable physical inputs and returns control scheme objects. This enables gamepad and touch with no changes to `Player` or `GameScene`.

### [MEDIUM] Scene Data Is Passed as Raw Strings (`p1CharId`, `vsMode`) With No Type Safety

- Issue: `GameScene.init()` receives `data.p1CharId`, `data.p2CharId`, and `data.vsMode` as raw strings with `?? 'fire'` / `?? '2p'` defaults. There is no validation that the IDs match a known character, and `vsMode` is compared to the string `'cpu'` in two separate places.
- Files: `src/scenes/GameScene.js` lines 13–21, 48, 268; `src/scenes/ResultScene.js` lines 9–14
- Impact: Typos in scene transition calls produce silent fallback to defaults rather than a clear error. As the game grows (more characters, more modes), this becomes harder to audit.
- Fix approach: Add a `MODES` constant to `constants.js`. Add a `validateCharId(id)` guard in `getCharacter()` that throws or warns on unknown IDs.

### [LOW] `GameScene` Is a God Object Mixing Physics Setup, Rendering, Goal Logic, and Match State

- Issue: `GameScene` handles arena drawing (`_drawArena`), physics wall creation (`_createWalls`), goal sensor setup (`_createGoals`, `_setupGoalSensors`), goal registration (`_registerGoal`), match timer, score tracking, and player/ball orchestration — all in one 274-line file.
- Files: `src/scenes/GameScene.js`
- Impact: Low risk at current scale but will become a maintenance burden as features are added. Any future feature (power-ups, multi-ball, weather effects) will extend an already dense class.
- Fix approach: Extract into `MatchManager`, `ArenaBuilder`, and `GoalDetector` helper classes that `GameScene` composes.

---

## Missing Features / Incomplete Implementations

### [HIGH] No Sound Effects or Music (See Audio Concern Above)

### [HIGH] No Loading Screen or Progress Feedback

- Issue: `BootScene` has no loading bar or progress indicator. If assets are large or the network is slow, the user sees a black screen.
- Files: `src/scenes/BootScene.js`
- Fix approach: Add a `Phaser.Scene.Events.PROGRESS` listener in `preload()` to draw a simple loading bar.

### [MEDIUM] `'ice'` Character Freeze Ability Has No Visual Indicator on the Frozen Player Beyond a Tint

- Issue: `Player.freeze()` sets a blue tint and schedules a `clearTint()`, but there is no particle effect, no UI countdown, and no animation to indicate to the frozen player why they cannot move or how long the freeze lasts.
- Files: `src/entities/Player.js` lines 151–155
- Impact: Gameplay legibility issue — frozen players may not understand what is happening or when it ends.

### [MEDIUM] Character Stat Multipliers (`speed`, `jump`, `power`) — `power` Stat Is Unused

- Issue: All five characters define a `power` stat in `characters.js`, but no code reads `char.stats.power`. Only `speed` and `jump` are applied in `Player.update()` and the jump velocity.
- Files: `src/config/characters.js` (all character entries), `src/entities/Player.js` lines 59, 77
- Impact: Blaze's `power: 1.2` and Tiny's `power: 0.7` have zero in-game effect. This is either unimplemented functionality or a dead configuration value.
- Fix approach: Either implement power as a kick impulse multiplier applied when the player physically contacts the ball, or remove the field from the character config until it is designed.

### [LOW] No Pause / ESC During Gameplay

- Issue: There is no pause mechanic. Pressing `ESC` during a match has no effect.
- Files: `src/scenes/GameScene.js` (absent)
- Fix approach: Add a `keydown-ESC` handler in `GameScene.create()` that calls `this.scene.pause()` and overlays a pause menu.

### [LOW] No Win Streak / Match History Tracking

- Issue: Each match is fully stateless — no session data persists between matches. The `ResultScene` shows the current match score only.
- Files: `src/scenes/ResultScene.js`

---

## Dependency Concerns

### [LOW] No Lock on Phaser Minor Version — `^3.90.0` Allows Automatic Minor Upgrades

- Issue: `package.json` specifies `"phaser": "^3.90.0"`, which allows npm to install any `3.x.x >= 3.90.0`. Phaser minor releases occasionally include breaking changes to the Matter.js integration or renderer API.
- Files: `/Users/saad/Khalil/package.json` line 16
- Fix approach: Pin to `"phaser": "3.90.0"` (exact) or generate `package-lock.json` and commit it (it is currently gitignored).

### [LOW] Vite Specified as `^8.0.8` — Vite 8 Is a Very Recent Major Release

- Issue: `"vite": "^8.0.8"` is a caret range on a brand-new major version. Vite 8 may have breaking changes from Vite 5/6/7 in build output format or plugin API.
- Files: `/Users/saad/Khalil/package.json` line 18
- Fix approach: Confirm Vite 8 compatibility with `phaser`'s ES module output, then pin the exact version.

### [LOW] No CI/CD Pipeline

- Issue: There is no `.github/workflows/`, no CI config, and no pre-commit hooks. The coding standards doc mandates CI test runs on every push.
- Impact: No automated gate prevents broken builds from reaching `main`.

---

## Security Considerations

### [LOW] No Security Surface Beyond Static Client-Side Code

- Issue: The game is entirely client-side with no network communication, no user input stored, no authentication, and no server. There is no meaningful attack surface at this time.
- Impact: Negligible. If online multiplayer is added in the future, all game state currently lives in unvalidated JavaScript variables that would need server-side validation.

---

*Concerns audit: 2026-04-14*
