---
phase: 03-pause-menu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/scenes/PauseScene.js
  - src/scenes/GameScene.js
  - src/scenes/UIScene.js
  - src/main.js
autonomous: true
requirements: [PAUSE-01]

must_haves:
  truths:
    - "ESC during a live match freezes physics and shows the pause overlay"
    - "Timer and cooldown bars stop advancing while paused"
    - "Resume (button or ESC) restores game state exactly as it was"
    - "Restart Match resets the match with same characters and vs mode"
    - "Return to Menu navigates to MenuScene cleanly with no ghost scenes"
    - "ESC after matchOver does nothing"
  artifacts:
    - path: "src/scenes/PauseScene.js"
      provides: "Pause overlay scene with Resume / Restart / Home buttons"
      exports: ["PauseScene"]
    - path: "src/scenes/GameScene.js"
      provides: "ESC listener, paused flag, paused guard in update()"
      contains: "this.paused"
    - path: "src/scenes/UIScene.js"
      provides: "Paused guard in update()"
      contains: "gs.paused"
    - path: "src/main.js"
      provides: "PauseScene registered in Phaser scene array"
      contains: "PauseScene"
  key_links:
    - from: "src/scenes/GameScene.js (ESC down handler)"
      to: "src/scenes/PauseScene.js"
      via: "this.scene.launch('PauseScene', { p1CharId, p2CharId, vsMode })"
      pattern: "scene\\.launch\\('PauseScene'"
    - from: "src/scenes/PauseScene.js (_resume)"
      to: "src/scenes/GameScene.js"
      via: "this.scene.get('GameScene').matter.world.resume()"
      pattern: "scene\\.get\\('GameScene'\\)"
    - from: "src/scenes/UIScene.js (update guard)"
      to: "src/scenes/GameScene.js (paused flag)"
      via: "gs.paused check"
      pattern: "gs\\.paused"
---

<objective>
Implement the ESC pause menu: pressing ESC during a live match freezes Matter.js
physics, shows a PauseScene overlay, and offers Resume / Restart Match / Return to
Menu. A second ESC press also resumes. Timer and cooldown bars freeze during pause.

Purpose: Players need a safe way to pause, check score, or navigate away mid-match
without losing progress or causing scene corruption.
Output: PauseScene.js (new), plus targeted edits to GameScene.js, UIScene.js, and
main.js.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/STATE.md

<!-- Key interfaces the executor needs — no codebase exploration required -->
<interfaces>
From src/main.js (current scene array, line 22):
```js
scene: [BootScene, MenuScene, GameScene, UIScene, ResultScene],
```
PauseScene must be inserted before ResultScene.

From src/scenes/GameScene.js — relevant method signatures:

init(data):
  - Stores: this.p1CharId, this.p2CharId, this.vsMode, this.score, this.matchTime,
    this.goalCooldownUntil, this.matchOver
  - Must also set: this.paused = false  (add here so restart resets it cleanly)

create():
  - addKeys() block ends at line 40 — ESC listener goes after this block
  - scene.launch('UIScene', { gameScene: this }) is at line 64

update(time, delta):
  - Line 261: if (this.matchOver) return;  — paused guard goes on the next line

From src/scenes/UIScene.js — update() guard (line 74):
```js
if (!gs || gs.matchOver) return;
```
Extend to:
```js
if (!gs || gs.matchOver || gs.paused) return;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create PauseScene</name>
  <files>src/scenes/PauseScene.js</files>
  <action>
Create `src/scenes/PauseScene.js` as a new file. The scene launches as an overlay
on top of GameScene and UIScene. It does NOT replace them.

Exact implementation (copy verbatim from the spec in 03-01-PLAN.md):

```js
import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseScene' }); }

  init(data) {
    this.initData = data; // { p1CharId, p2CharId, vsMode }
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Dim overlay
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setDepth(0);

    // Title
    this.add.text(W / 2, H / 2 - 120, 'PAUSED', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(1);

    // Button helper
    const makeButton = (y, label, callback) => {
      const btn = this.add.text(W / 2, y, label, {
        fontSize: '32px',
        fontFamily: 'Arial Black, sans-serif',
        color: '#ffffff',
        backgroundColor: '#1a4a8a',
        padding: { x: 32, y: 12 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(1);

      btn.on('pointerover', () => btn.setStyle({ color: '#ffdd44' }));
      btn.on('pointerout',  () => btn.setStyle({ color: '#ffffff' }));
      btn.on('pointerdown', callback);
      return btn;
    };

    makeButton(H / 2 - 20,  'Resume',          () => this._resume());
    makeButton(H / 2 + 70,  'Restart Match',   () => this._restart());
    makeButton(H / 2 + 150, 'Return to Menu',  () => this._menu());

    // ESC also resumes
    this.input.keyboard.on('keydown-ESC', () => this._resume());
  }

  _resume() {
    const gs = this.scene.get('GameScene');
    gs.matter.world.resume();
    gs.paused = false;
    this.scene.stop('PauseScene');
  }

  _restart() {
    const data = this.initData;
    this.scene.stop('PauseScene');
    this.scene.stop('UIScene');
    this.scene.get('GameScene').scene.restart(data);
  }

  _menu() {
    this.scene.stop('PauseScene');
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    this.scene.start('MenuScene');
  }
}
```

Notes:
- `this.scene.get('GameScene')` always resolves the live instance — no closure needed.
- `scene.restart(data)` triggers GameScene.init(data) which resets score/timer/flags.
- UIScene is stopped before restart because GameScene.create() re-launches it.
  </action>
  <verify>
File src/scenes/PauseScene.js exists and exports `PauseScene`. No syntax errors:
`node --input-type=module --eval "import './src/scenes/PauseScene.js'" 2>&1 || true`
  </verify>
  <done>PauseScene.js exists with overlay rect, PAUSED title, three buttons, ESC listener, and _resume/_restart/_menu methods.</done>
</task>

<task type="auto">
  <name>Task 2: Wire ESC pause into GameScene, guard UIScene, register in main.js</name>
  <files>src/scenes/GameScene.js, src/scenes/UIScene.js, src/main.js</files>
  <action>
Three targeted edits across three files. Make each change exactly as described.

--- src/main.js ---

1. Add import after the existing UIScene import line (line 5):
```js
import { PauseScene } from './scenes/PauseScene.js';
```

2. Insert PauseScene into the scene array (line 22), before ResultScene:
```js
scene: [BootScene, MenuScene, GameScene, UIScene, PauseScene, ResultScene],
```

--- src/scenes/GameScene.js ---

3. In `init(data)`, add after `this.matchOver = false;` (currently the last line of init):
```js
this.paused = false;
```

4. In `create()`, after the addKeys() block and the p2Controls assignment (after line 43,
   before `this.p1 = new Player...`), insert the ESC listener:
```js
this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
this.escKey.on('down', () => {
  if (this.matchOver) return;
  if (this.paused) {
    this.matter.world.resume();
    this.paused = false;
    this.scene.stop('PauseScene');
  } else {
    this.matter.world.pause();
    this.paused = true;
    this.scene.launch('PauseScene', {
      p1CharId: this.p1CharId,
      p2CharId: this.p2CharId,
      vsMode: this.vsMode,
    });
  }
});
```

5. In `update(time, delta)`, add a paused guard immediately after the existing
   `if (this.matchOver) return;` line (line 261):
```js
if (this.paused) return;
```

--- src/scenes/UIScene.js ---

6. In `update()`, change the guard at line 74 from:
```js
if (!gs || gs.matchOver) return;
```
to:
```js
if (!gs || gs.matchOver || gs.paused) return;
```

That is the only change needed in UIScene — one condition added.
  </action>
  <verify>
`npm run build` exits 0 (no import errors, no syntax errors).
  </verify>
  <done>
- main.js imports and registers PauseScene.
- GameScene.init sets this.paused = false.
- GameScene.create adds ESC listener that launches/stops PauseScene and toggles matter world.
- GameScene.update returns early when paused.
- UIScene.update returns early when gs.paused is true.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Full pause menu: ESC overlay with Resume / Restart Match / Return to Menu, physics freeze, and UI guard.</what-built>
  <how-to-verify>
1. Run `npm run dev` and open http://localhost:5173. Start a match.
2. Press ESC — ball and players should freeze. Overlay appears: "PAUSED" title + 3 buttons. Timer on HUD does not advance.
3. Press ESC again (or click Resume) — physics resumes, players can move, timer continues.
4. Pause again, click "Restart Match" — score resets to 0:0, timer resets to 1:30, same two characters. No ghost UIScene or duplicate overlays.
5. Pause again, click "Return to Menu" — main menu is shown cleanly. No lingering scenes.
6. Let a match finish (score or timer). After match-over screen, confirm ESC does nothing (no pause overlay appears).
7. Activate an ability just before pausing — the cooldown bar should not change while paused.
  </how-to-verify>
  <resume-signal>Type "approved" or describe any issues observed.</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` passes (no import or syntax errors across all modified files)
- PauseScene is importable and registered in the Phaser scene array
- All five Must Haves from 03-01-PLAN.md are manually verified via the checkpoint above
</verification>

<success_criteria>
- ESC freezes physics and shows overlay during a live match
- Resume (button and ESC key) restores game state exactly
- Restart Match resets to same config with no scene corruption
- Return to Menu cleanly stops all game scenes
- Timer and cooldown bars do not advance while paused
- ESC is inert after matchOver
</success_criteria>

<output>
After completion, create `.planning/quick/260414-tuv-phase-3/260414-tuv-SUMMARY.md`
</output>
