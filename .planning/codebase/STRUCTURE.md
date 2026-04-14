# Codebase Structure

**Analysis Date:** 2026-04-14

## Directory Layout

```
/Users/saad/Khalil/
├── src/                         # Game source code (entry point for Vite)
│   ├── index.html               # HTML shell — loads main.js as ES module
│   ├── main.js                  # Phaser.Game config and scene registry
│   ├── scenes/                  # All Phaser Scene subclasses
│   │   ├── BootScene.js         # Asset preload + texture generation
│   │   ├── MenuScene.js         # Character select, mode toggle, game start
│   │   ├── GameScene.js         # Match loop, physics world, entity management
│   │   ├── UIScene.js           # HUD overlay (scores, timer, ability bars)
│   │   └── ResultScene.js       # Post-match winner display, navigation
│   ├── entities/                # Plain JS game object classes
│   │   ├── Ball.js              # Ball physics body, velocity capping, stuck recovery
│   │   └── Player.js            # Player physics body, input, abilities, freeze
│   ├── ai/                      # CPU controller layer
│   │   └── CPUPlayer.js         # 3-state machine (CHASE/DEFEND/SHOOT)
│   ├── config/                  # Pure data — no Phaser imports
│   │   ├── constants.js         # All numeric tuning values (physics, match, ball, player)
│   │   └── characters.js        # Character roster with stats and ability metadata
│   └── assets/                  # Assets imported at src/ level (served by Vite)
│       └── images/              # Character head PNGs loaded by BootScene
│           ├── head_blaze.png
│           ├── head_bolt.png
│           ├── head_frost.png
│           ├── head_shadow.png
│           └── head_tiny.png
├── assets/                      # Root-level assets directory (currently empty / unused)
├── heads/                       # Raw head art originals (Gemini-generated PNGs, source files)
├── design/                      # Game design documents
│   ├── game-design-document/    # GDD markdown files
│   └── registry/                # Design registry
├── docs/                        # Technical documentation
│   ├── architecture/            # Architecture decision records
│   ├── engine-reference/        # Phaser 3 API snapshots (version-pinned)
│   ├── examples/                # Code examples
│   └── registry/                # Doc registry
├── production/                  # Project management state
│   ├── session-state/           # active.md — current session checkpoint (gitignored)
│   └── session-logs/            # Session audit trail (gitignored)
├── tests/                       # Test suites (currently empty)
├── .claude/                     # Agent definitions, skills, hooks, rules, docs
│   ├── agents/                  # Subagent role definitions
│   ├── skills/                  # Slash command skill files
│   ├── rules/                   # Coding rules (ai-code.md, etc.)
│   ├── docs/                    # Internal agent documentation
│   ├── hooks/                   # Git/session hook scripts
│   └── agent-memory/            # Persistent agent memory files
├── .planning/                   # Planning and analysis documents
│   └── codebase/                # Codebase map docs (ARCHITECTURE.md, STRUCTURE.md, etc.)
├── dist/                        # Vite build output (gitignored)
├── node_modules/                # npm dependencies (gitignored)
├── package.json                 # npm manifest — phaser + vite only
├── vite.config.js               # Vite build configuration
├── CLAUDE.md                    # Master agent configuration
└── README.md                    # Project readme
```

## Key File Responsibilities

### Entry Points
- `src/index.html` — Browser entry; loads `src/main.js` as `type="module"`. Minimal CSS: black background, centered canvas.
- `src/main.js` — Constructs `Phaser.Game` with renderer config (`Phaser.AUTO`, 1280×720, FIT scaling), Matter.js physics config (`gravity.y = 2`), and the ordered scene array `[BootScene, MenuScene, GameScene, UIScene, ResultScene]`.

### Configuration (no Phaser dependency)
- `src/config/constants.js` — All game tuning values exported as named const objects: `GAME_WIDTH`, `GAME_HEIGHT`, `PHYSICS`, `PLAYER`, `BALL`, `GOAL`, `MATCH`, `ABILITY_COOLDOWN`, `ABILITIES`. Import what you need — no barrel export.
- `src/config/characters.js` — `CHARACTERS` array (5 entries) and `getCharacter(id)` lookup function. Each character has `id`, `name`, `headImage` (texture key), `color`, `accentColor`, `emoji`, `stats` (`speed`, `jump`, `power`), and `ability` metadata.

### Scenes
- `src/scenes/BootScene.js` — Loads 5 head textures; generates `'__DEFAULT'` particle texture; starts `MenuScene`. No update loop.
- `src/scenes/MenuScene.js` — Builds all UI using Phaser Graphics and Text primitives. Instance properties `p1CharIndex`, `p2CharIndex`, `vsMode` drive character selection state.
- `src/scenes/GameScene.js` — Owns the full match: arena drawing, Matter.js static body construction, `Ball` and `Player` instantiation, collision sensor setup, match timer, goal logic, and `_endMatch`. Central coordinator — all other systems report to or are driven by this scene.
- `src/scenes/UIScene.js` — Overlay scene. Holds a reference to `GameScene` instance to poll `score`, `matchTime`, and player cooldown ratios each frame. Contains no game logic.
- `src/scenes/ResultScene.js` — Display-only scene. Reads init data, renders static result UI. Two navigation actions: rematch (→ `GameScene`) and menu (→ `MenuScene`).

### Entities
- `src/entities/Ball.js` — Self-contained: creates its own texture and Matter.js body in the constructor. Key behavior: velocity cap, angular velocity cap, stuck-ball auto-reset. Public interface: `x`, `y`, `velocity` getters; `applyImpulse(forceObj)`; `reset()`.
- `src/entities/Player.js` — Injected dependencies: `scene`, spawn `x`, `side` ('left'/'right'), `characterData`, `controlScheme`. Manages jump edge detection (`_jumpPressed` flag), ability cooldown, freeze state. Public interface: `x`, `y` getters; `update(time, delta, ball)`; `freeze(duration)`; `getAbilityCooldownRatio(time)`; `reset(x)`.

### AI
- `src/ai/CPUPlayer.js` — Wraps an existing `Player` instance. Does NOT create its own entity. Bypasses the `controls` object; directly calls `p.sprite.setVelocityX()` and `p.sprite.setVelocityY()`. Also directly calls `p._useAbility()` (private method access). State machine: `CHASE | DEFEND | SHOOT`.

## Module Boundaries and Dependencies

```
src/index.html
    └── src/main.js
            ├── src/config/constants.js        (GAME_WIDTH, GAME_HEIGHT)
            └── src/scenes/*.js
                    ├── BootScene.js           (no local imports)
                    ├── MenuScene.js           ← config/characters, config/constants
                    ├── GameScene.js           ← entities/Ball, entities/Player,
                    │                             ai/CPUPlayer, config/characters,
                    │                             config/constants
                    ├── UIScene.js             ← config/constants
                    └── ResultScene.js         ← config/characters, config/constants

src/entities/Ball.js       ← config/constants
src/entities/Player.js     ← config/constants
src/ai/CPUPlayer.js        ← config/constants
```

**Rules inferred from code:**
- `config/` has zero imports — pure data, safe to import anywhere
- Entities import only from `config/` — no scene imports, no cross-entity imports
- `CPUPlayer` imports only from `config/` — but holds a runtime reference to a `Player` instance passed at construction
- Scenes import from `config/`, `entities/`, and `ai/`; scenes do NOT import other scenes
- No circular dependencies exist

## Naming Conventions

**Files:**
- Scenes: `PascalCase` with `Scene` suffix — `GameScene.js`, `UIScene.js`
- Entities: `PascalCase` noun — `Ball.js`, `Player.js`
- AI: `PascalCase` with `Player` suffix — `CPUPlayer.js`
- Config: lowercase noun — `constants.js`, `characters.js`

**Classes:**
- All exported as named exports (`export class Foo`), not default exports

**Private methods:**
- Prefixed with underscore: `_create()`, `_drawArena()`, `_useAbility()`, `_emitParticles()`

**Constants:**
- Top-level exported objects: `SCREAMING_SNAKE_CASE` (`GAME_WIDTH`, `PHYSICS`, `MATCH`)
- Properties inside objects: `camelCase` (`ballRestitution`, `runSpeed`, `goalCooldown`)

## Where to Add New Code

**New character:**
- Add entry to `CHARACTERS` array in `src/config/characters.js`
- Add ability parameters to `ABILITIES` object in `src/config/constants.js`
- Add ability branch in `Player._useAbility()` in `src/entities/Player.js`
- Add head PNG to `src/assets/images/` and load in `BootScene.preload()`

**New ability type:**
- Define parameters in `ABILITIES` in `src/config/constants.js`
- Implement logic in `Player._useAbility()` branch
- For cross-player effects: emit via `scene.events.emit('player-ability', ...)` and handle in `GameScene.create()`

**New scene:**
- Create `src/scenes/MyScene.js` extending `Phaser.Scene`
- Register key in `main.js` scene array
- Navigate using `this.scene.start('MyScene', data)`

**New game mode:**
- Extend `vsMode` string enum in `MenuScene` and `GameScene.init()`
- Add conditional in `GameScene.update()` alongside existing `'cpu'` branch

**New physics body (arena element):**
- Add to `GameScene._createWalls()` using `this.matter.add.rectangle(...)`
- Assign a unique `label` string for collision identification

**New tuning value:**
- Add to appropriate object in `src/config/constants.js`
- Import the object (not individual values) at the usage site

**Tests:**
- Place in `tests/` — directory exists but is empty
- Naming convention per `coding-standards.md`: `[system]_[feature]_test.[ext]`

## Special Directories

**`heads/`:**
- Purpose: Source art files (Gemini-generated PNGs) for character heads
- Generated: Yes (AI-generated images)
- Committed: Yes (source assets)
- Not imported by build — manually copied to `src/assets/images/` when ready

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (`npm run build`)
- Committed: No (gitignored)

**`.planning/codebase/`:**
- Purpose: Codebase map documents consumed by GSD planning commands
- Generated: Yes (by `map-codebase` skill)
- Committed: Yes

**`production/session-state/`:**
- Purpose: Active session checkpoint (`active.md`) for crash recovery
- Generated: Yes (per session)
- Committed: No (gitignored)

---

*Structure analysis: 2026-04-14*
