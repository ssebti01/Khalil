# Coding Conventions

**Analysis Date:** 2026-04-14

## Naming Patterns

**Files:**
- PascalCase for all class-bearing source files: `Player.js`, `Ball.js`, `GameScene.js`, `CPUPlayer.js`
- camelCase for config/data files: `constants.js`, `characters.js`
- Scene files use the `Scene` suffix: `BootScene.js`, `MenuScene.js`, `GameScene.js`, `UIScene.js`, `ResultScene.js`

**Classes:**
- PascalCase throughout: `Player`, `Ball`, `CPUPlayer`, `GameScene`, `UIScene`, `ResultScene`
- Phaser scene classes extend `Phaser.Scene` and pass a string key to `super({ key: 'SceneName' })`

**Methods:**
- camelCase for public methods: `update()`, `reset()`, `freeze()`, `checkGround()`, `applyImpulse()`
- Underscore-prefixed camelCase for private/internal methods: `_create()`, `_drawArena()`, `_createWalls()`, `_setupGoalSensors()`, `_registerGoal()`, `_useAbility()`, `_emitParticles()`
- This `_underscore` convention is the only way private intent is communicated — JavaScript `#private` fields are not used

**Variables:**
- camelCase for all instance variables and locals: `this.isOnGround`, `this.abilityCooldown`, `this.matchTime`, `this.goalCooldownUntil`
- Underscore-prefixed for internal state not meant for direct access: `this._jumpPressed`, `this._stuckTimer`, `this._lastPos`, `this._lastDecision`
- Short abbreviations in tight scopes: `p`, `dx`, `vel`, `av`, `h`, `w`

**Constants:**
- SCREAMING_SNAKE_CASE for exported constant objects: `GAME_WIDTH`, `GAME_HEIGHT`, `PHYSICS`, `PLAYER`, `BALL`, `MATCH`, `ABILITIES`, `ABILITY_COOLDOWN`
- Object keys within constant objects use camelCase: `ballRestitution`, `playerMass`, `runSpeed`, `jumpForce`

**Phaser Scene Keys:**
- PascalCase strings matching the class name: `'BootScene'`, `'MenuScene'`, `'GameScene'`, `'UIScene'`, `'ResultScene'`

**AI States:**
- SCREAMING_SNAKE_CASE strings for AI state machine states: `'DEFEND'`, `'CHASE'`, `'SHOOT'`

## Code Organization Patterns

**Non-scene classes (`Player`, `Ball`, `CPUPlayer`):**
- Plain ES classes (not extending Phaser.Scene)
- Constructor sets up all state, then calls `_create()` to build the Phaser physics object
- `update(time, delta, ...)` as the per-frame method signature
- `reset()` method to restore initial position and state
- Getter properties via `get x()` / `get y()` to expose sprite coordinates without exposing the sprite directly

**Scene classes:**
- Extend `Phaser.Scene`
- Constructor single-lines: `constructor() { super({ key: 'SceneName' }); }`
- Phaser lifecycle methods in canonical order: `init(data)` → `preload()` → `create()` → `update()`
- `create()` delegates to private `_draw*()` and `_create*()` helpers — no logic inline in `create()`
- UI setup is split into fine-grained private methods (e.g., `_drawBackground()`, `_drawTitle()`, `_drawModeToggle()`, `_drawCharacterSelect()`, `_drawStartButton()`, `_drawControls()`)

**Config module (`src/config/constants.js`):**
- All gameplay values are named exports — no magic numbers in entity or scene code
- Values grouped into named objects by domain: `PHYSICS`, `PLAYER`, `BALL`, `GOAL`, `MATCH`, `ABILITIES`
- Comments explain units inline: `// px/frame`, `// px/frame²`, `// ms`, `// bounciness 0-1`

**Characters config (`src/config/characters.js`):**
- Data-driven character roster as a plain array of objects
- Each character object carries: `id`, `name`, `headImage`, `color`, `accentColor`, `emoji`, `stats`, `ability`
- Exported helper function `getCharacter(id)` with nullish-coalesce fallback: returns first character if id not found

## ES Module Usage

- All files use named exports: `export class Foo`, `export const BAR`
- No default exports except `vite.config.js`
- Imports always include `.js` extension: `import { Player } from '../entities/Player.js'`
- Phaser imported as a namespace: `import Phaser from 'phaser'`
- Constants are destructured at import: `import { PLAYER, PHYSICS, GAME_WIDTH } from '../config/constants.js'`

## Comment Style

- Inline comments on the same line for short clarifications: `restitution: 0.7, // bounciness 0-1`
- Block comments above logical sections within methods, not above individual lines
- Comments explain *why* or *what the unit is*, not *what the code does*: `// Velocity cap — prevents physics instability after chained ability kicks`
- Em-dash used in comments to separate label from explanation: `// Stuck-ball recovery — reset to center if ball hasn't moved in stuckTimeout ms`
- No JSDoc/TSDoc — no `@param`, `@returns`, or type annotations anywhere in the codebase
- AI state machine has a single-line description comment at the top of the file: `// Simple state-machine AI: DEFEND | CHASE | SHOOT`

## Formatting & Linting

- **No ESLint, Prettier, or Biome configuration files present** — formatting is entirely by convention
- Indentation: 2 spaces throughout
- Quotes: single quotes for strings in JS code; backtick template literals used for dynamic strings
- Trailing commas in multi-line object/array literals (observed consistently)
- Opening brace on the same line as the control structure or function
- Short constructor bodies written on one line: `constructor() { super({ key: 'BootScene' }); }`
- Short getters on one line: `get x() { return this.sprite.x; }`
- Long import lists use multi-line destructuring with shared indentation

## Control Flow Patterns

- Early return guard at the top of `update()` for frozen/matchOver state: `if (time < this.frozenUntil) return;`
- Boolean edge-tracking for input (prevents key-hold repeat): `this._jumpPressed` / `this._abilityPressed` set/cleared each frame
- `??` nullish coalesce used for data defaults: `data.p1CharId ?? 'fire'`
- Ternary expressions used freely for inline conditional values
- `Math.sign()`, `Math.abs()`, `Phaser.Math.Clamp()`, `Phaser.Math.Between()` used for math utilities

## Cross-Scene Communication

- Scene data passed via `this.scene.start('SceneName', { ...data })` — no shared global state
- Same-scene pub/sub via `this.events.emit()` / `this.events.on()` for ability cross-player effects
- UIScene receives a direct reference to GameScene via `init(data)`: `this.gameScene = data.gameScene`
- UIScene launched in parallel with `this.scene.launch('UIScene', { gameScene: this })` from GameScene

## Phaser-Specific Patterns

- Matter.js physics bodies created via `this.scene.matter.add.image()` with physics options inline
- `setFixedRotation()` called on player sprite to prevent tumbling
- Physics sensors (non-colliding trigger zones) used for goal detection
- Particle emitters created ad-hoc per ability use, destroyed after 500ms via `delayedCall`
- Tweens used for goal flash, GOAL text scale/fade, and button flash
- Graphics objects used for all procedural drawing — no external sprite sheets for arena/UI

## Forbidden Patterns (per project rules)

- No hardcoded gameplay values inline — all values must come from `src/config/constants.js` or character data
- No `#private` fields — underscore prefix convention only
- No default exports in game source files

---

*Convention analysis: 2026-04-14*
