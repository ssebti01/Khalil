# Architecture

**Analysis Date:** 2026-04-14

## Pattern Overview

**Overall:** Scene-based game loop with entity composition and optional AI controller layer.

**Key Characteristics:**
- All game logic lives in Phaser 3 `Scene` subclasses; no external state manager
- Entities (`Player`, `Ball`) are plain JS classes that own a single Matter.js-backed `sprite`
- Physics is fully delegated to Matter.js (bundled in Phaser 3); no custom physics math
- `UIScene` runs simultaneously as an overlay on top of `GameScene` using Phaser's parallel scene system
- Config is data-driven: all tunable numbers are exported constants from `src/config/`

## Scene Graph

```
Phaser.Game
└── Scene Manager (sequential unless explicitly parallel)
    ├── BootScene      — asset loading, texture generation
    ├── MenuScene      — character select, mode toggle
    ├── GameScene  ─── — match logic, physics world, entity update loop
    │   └── UIScene    — HUD overlay (launched in parallel via scene.launch)
    └── ResultScene    — post-match summary, navigation
```

All five scenes are registered in `src/main.js` at game boot. Scene keys are string literals (`'BootScene'`, `'MenuScene'`, etc.) used everywhere for `scene.start()` / `scene.launch()`.

## Scene Lifecycle

### BootScene (`src/scenes/BootScene.js`)
- `preload()`: loads all five character head PNG textures via `this.load.image`
- `create()`: generates a `'__DEFAULT'` 4×4 white pixel texture used by the particle emitter; immediately transitions to `MenuScene`
- No `update()` — fires once and exits

### MenuScene (`src/scenes/MenuScene.js`)
- `create()`: draws all UI imperatively using Phaser Graphics + Text objects; no external UI framework
- Maintains `p1CharIndex`, `p2CharIndex`, `vsMode` as instance properties (ephemeral — lost on scene restart)
- Character change re-applies textures and text in-place; mode change calls `this.scene.restart()` (full redraw)
- `_startGame()` passes `{ p1CharId, p2CharId, vsMode }` as scene `init` data to `GameScene`

### GameScene (`src/scenes/GameScene.js`)
- `init(data)`: receives match config; sets `score`, `matchTime`, `matchOver` as instance state
- `create()`: draws arena graphics, creates Matter.js static bodies (walls, goals, sensors), instantiates `Ball` and both `Player` objects, optionally creates `CPUPlayer`, launches `UIScene` as overlay
- `update(time, delta)`: calls `ball.update(delta)`, `p1.update(...)`, and either `cpu.update(...)` or `p2.update(...)` depending on `vsMode`
- Match timer uses a Phaser `time.addEvent` repeating every 1000ms; goal detection uses the Matter.js `collisionstart` world event

### UIScene (`src/scenes/UIScene.js`)
- Launched via `this.scene.launch('UIScene', { gameScene: this })` inside `GameScene.create()`
- Holds a direct reference to the `GameScene` instance (`this.gameScene`) to poll state each frame
- `update()`: reads `gs.score`, `gs.matchTime`, and calls `gs.p1.getAbilityCooldownRatio(now)` — polling, not event-driven
- Stopped explicitly via `this.scene.stop('UIScene')` when the match ends

### ResultScene (`src/scenes/ResultScene.js`)
- `init(data)`: receives `{ score, winner, p1CharId, p2CharId, vsMode }` from `GameScene._endMatch()`
- Renders winner banner, final score, and character heads; provides REMATCH (→ `GameScene`) and MENU (→ `MenuScene`) buttons
- Keyboard shortcuts: Enter = rematch, Esc = menu

## Data Flow

**Match start:**
1. `MenuScene._startGame()` calls `this.scene.start('GameScene', { p1CharId, p2CharId, vsMode })`
2. `GameScene.init(data)` receives and stores config
3. `GameScene.create()` instantiates entities and launches `UIScene`

**Per-frame update (60fps target):**
1. Phaser calls `GameScene.update(time, delta)`
2. `ball.update(delta)` — velocity cap, angular velocity cap, stuck-ball recovery
3. `p1.update(time, delta, ball)` — reads keyboard, applies velocity, handles ability
4. `cpu.update(time, delta, ball)` or `p2.update(time, delta, ball)` depending on mode
5. Matter.js world step (automatic, managed by Phaser)
6. Phaser calls `UIScene.update()` — polls GameScene state, redraws HUD

**Goal scored:**
1. Matter.js `collisionstart` fires; `_setupGoalSensors()` checks body labels
2. `_registerGoal(scoringPlayer)` increments `score[]`, sets `goalCooldownUntil`
3. Tween plays GOAL! text + screen flash
4. `time.delayedCall(goalCooldown)` resets ball and players
5. If score reaches `MATCH.maxScore`, calls `_endMatch()` after 500ms delay

**Match end:**
1. `_endMatch()` sets `matchOver = true`, stops `UIScene`, calls `this.scene.start('ResultScene', data)`

## Entity Design

### Ball (`src/entities/Ball.js`)
- Constructor creates a Matter.js circle body via `this.scene.matter.add.image()`; generates the ball texture procedurally using `scene.make.graphics()` if not already cached
- Physics body label: `'ball'` (used for collision detection in `_setupGoalSensors`)
- `update(delta)`: applies velocity cap (`BALL.maxVelocity`), angular velocity cap (`BALL.maxAngularVelocity`), and stuck-ball recovery (resets to center if displacement < 2px over 5000ms)
- `applyImpulse(forceObj)`: thin wrapper over `sprite.applyForce()` — used by ability system
- Exposes getters: `x`, `y`, `velocity`

### Player (`src/entities/Player.js`)
- Constructor takes `(scene, x, side, characterData, controlScheme)` — all dependencies injected, no singletons
- Creates a Matter.js circle body via `scene.matter.add.image()` with label `player_left` or `player_right`
- `setFixedRotation()` prevents the head sprite from rotating with physics torque
- `update(time, delta, ball)`: horizontal movement via direct `setVelocityX`; jump via `setVelocityY`; ability via `_useAbility`; hard positional clamp at arena edges
- `freeze(duration)`: sets `frozenUntil` timestamp; `update` returns early while frozen; applies blue tint
- `getAbilityCooldownRatio(time)`: returns 0.0–1.0 for the HUD cooldown bar
- `reset(x)`: repositions to spawn X, zeroes velocity, clears freeze and tint

### Ability system (inside `Player._useAbility`)
- Dispatches on `this.char.id`: `'fire'`, `'ice'`, `'thunder'`, `'ninja'`, `'tiny'`
- Cross-player effects (ice freeze) emitted via `this.scene.events.emit('player-ability', { type, source })`
- `GameScene` listens and calls `target.freeze(2000)` on the opposing player
- Particle burst via `scene.add.particles()` using the `'__DEFAULT'` texture from BootScene

## AI Architecture (`src/ai/CPUPlayer.js`)

**Pattern:** Three-state machine — `CHASE | DEFEND | SHOOT`

**State transitions** (evaluated every `reactionDelay` ms, default 80ms):
- `DEFEND`: ball is within 300px of the CPU's own goal side
- `SHOOT`: ball is within 200px horizontally AND below `GAME_HEIGHT - 300`
- `CHASE`: all other conditions

**Execution:**
- Sets player horizontal velocity directly via `p.sprite.setVelocityX()` — bypasses the keyboard `controls` object entirely
- Jumps when ball is within 150px horizontally and above the player's Y position
- Randomly fires ability every ~10s with 40% probability by temporarily zeroing `p.abilityCooldown`

**Limitation:** CPUPlayer calls `p._useAbility()` as a private method. The reaction delay and ability probability are hardcoded, not loaded from data (conflicts with `ai-code.md` rules).

## Physics Integration

- Engine: Matter.js, configured in `src/main.js` with `gravity: { y: 2 }`
- All physics bodies created via `this.matter.add.*` Phaser API
- Static bodies: floor, ceiling, left/right outer walls (split at goal crossbar height), goal back walls, goal posts, crossbars, and two sensor rectangles for goal detection
- Dynamic bodies: ball (circle, mass 0.8), both players (circles, mass 5, fixed rotation)
- Goal detection uses Matter.js sensor bodies (`isSensor: true`) — no collision response, only event
- `collisionstart` event fires on `this.matter.world`; bodies are identified by string `label` properties

## State Management

**No shared state store.** State is held as instance properties on the owning object:
- Match state (`score`, `matchTime`, `matchOver`, `goalCooldownUntil`) — `GameScene` instance
- Player state (`isOnGround`, `frozenUntil`, `abilityCooldown`, `_jumpPressed`, `_abilityPressed`) — `Player` instance
- Ball state (`_stuckTimer`, `_lastPos`) — `Ball` instance
- AI state (`state`, `_lastDecision`, `_abilityTimer`) — `CPUPlayer` instance
- Menu selection (`p1CharIndex`, `p2CharIndex`, `vsMode`) — `MenuScene` instance (reset on scene restart)

Scene-to-scene data is passed only through Phaser's `scene.start(key, data)` mechanism; there is no persistent global store.

## Event / Communication Patterns

| Pattern | Used For |
|---|---|
| `scene.events.emit / .on` | Cross-entity ability effects (ice freeze) within a scene |
| `scene.start(key, data)` | Scene transitions with payload (match config, results) |
| `scene.launch(key, data)` | Starting UIScene overlay in parallel |
| `scene.stop(key)` | Stopping UIScene when match ends |
| `UIScene.gameScene` reference | UIScene polls GameScene state directly each frame |
| `matter.world.on('collisionstart')` | Goal detection |
| `time.addEvent` | Match countdown timer |
| `time.delayedCall` | Post-goal reset delay, ability particle cleanup |

---

*Architecture analysis: 2026-04-14*
