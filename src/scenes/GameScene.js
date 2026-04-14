import Phaser from 'phaser';
import { Ball } from '../entities/Ball.js';
import { Player } from '../entities/Player.js';
import { CPUPlayer } from '../ai/CPUPlayer.js';
import { getCharacter } from '../config/characters.js';
import {
  GAME_WIDTH, GAME_HEIGHT, MATCH, PLAYER, GOAL, PHYSICS,
} from '../config/constants.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.p1CharId = data.p1CharId ?? 'fire';
    this.p2CharId = data.p2CharId ?? 'ice';
    this.vsMode = data.vsMode ?? '2p';
    this.score = [0, 0];
    this.matchTime = MATCH.duration;
    this.goalCooldownUntil = 0;
    this.matchOver = false;
    this.paused = false;
  }

  create() {
    this._drawArena();
    this._createWalls();
    this._createGoals();

    this.ball = new Ball(this);

    // Controls
    const keys = this.input.keyboard.addKeys({
      p1Left: Phaser.Input.Keyboard.KeyCodes.A,
      p1Right: Phaser.Input.Keyboard.KeyCodes.D,
      p1Up: Phaser.Input.Keyboard.KeyCodes.W,
      p1Ability: Phaser.Input.Keyboard.KeyCodes.Q,
      p2Left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      p2Right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p2Up: Phaser.Input.Keyboard.KeyCodes.UP,
      p2Ability: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    const p1Controls = { left: keys.p1Left, right: keys.p1Right, up: keys.p1Up, ability: keys.p1Ability };
    const p2Controls = { left: keys.p2Left, right: keys.p2Right, up: keys.p2Up, ability: keys.p2Ability };

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

    this.p1 = new Player(this, GAME_WIDTH * 0.25, 'left', getCharacter(this.p1CharId), p1Controls);
    this.p2 = new Player(this, GAME_WIDTH * 0.75, 'right', getCharacter(this.p2CharId), p2Controls);

    if (this.vsMode === 'cpu') {
      this.cpu = new CPUPlayer(this.p2, 'left');
    }

    // Ability cross-player events
    this.events.on('player-ability', ({ type, source }) => {
      if (type === 'freeze') {
        const target = source === this.p1 ? this.p2 : this.p1;
        target.freeze(2000);
      }
    });

    // Goal collision sensors
    this._setupGoalSensors();

    // UI scene on top
    this.scene.launch('UIScene', { gameScene: this });
    this.uiScene = this.scene.get('UIScene');

    // Timer
    this.time.addEvent({
      delay: 1000,
      repeat: MATCH.duration - 1,
      callback: () => {
        if (!this.matchOver) {
          this.matchTime -= 1;
          if (this.matchTime <= 0) this._endMatch();
        }
      },
    });
  }

  _drawArena() {
    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1b3a6b, 0x1b3a6b, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Crowd silhouettes
    bg.fillStyle(0x0a1520, 0.8);
    for (let i = 0; i < 60; i++) {
      const x = i * 22 + 5;
      const h = Phaser.Math.Between(30, 60);
      bg.fillRect(x, GAME_HEIGHT - 80 - h - 8, 16, h);
    }

    // Pitch
    bg.fillStyle(0x2d7a3a);
    bg.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);

    // Pitch markings
    bg.lineStyle(2, 0x3a9a4a, 0.6);
    bg.strokeRect(80, GAME_HEIGHT - 80, GAME_WIDTH - 160, 80);
    bg.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH / 2, GAME_HEIGHT);
    bg.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT - 80, 60);

    // Grass stripes
    for (let i = 0; i < 10; i++) {
      bg.fillStyle(i % 2 === 0 ? 0x2d7a3a : 0x347a42, 0.5);
      bg.fillRect(80 + i * ((GAME_WIDTH - 160) / 10), GAME_HEIGHT - 80, (GAME_WIDTH - 160) / 10, 80);
    }

    // Floor highlight
    bg.lineStyle(3, 0x3a9a4a);
    bg.lineBetween(0, GAME_HEIGHT - 80, GAME_WIDTH, GAME_HEIGHT - 80);

    // Net backgrounds
    bg.fillStyle(0x001a33, 0.5);
    bg.fillRect(0, GAME_HEIGHT - 80 - GOAL.height, 60, GOAL.height);
    bg.fillRect(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, 60, GOAL.height);

    // Net grid
    bg.lineStyle(1, 0xaaccff, 0.3);
    for (let r = 0; r < GOAL.height; r += 18) {
      bg.lineBetween(0, GAME_HEIGHT - 80 - GOAL.height + r, 60, GAME_HEIGHT - 80 - GOAL.height + r);
      bg.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height + r, GAME_WIDTH, GAME_HEIGHT - 80 - GOAL.height + r);
    }
    for (let c = 0; c < 60; c += 18) {
      bg.lineBetween(c, GAME_HEIGHT - 80 - GOAL.height, c, GAME_HEIGHT - 80);
      bg.lineBetween(GAME_WIDTH - 60 + c, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH - 60 + c, GAME_HEIGHT - 80);
    }

    // Goal posts
    bg.lineStyle(6, 0xdddddd);
    bg.lineBetween(60, GAME_HEIGHT - 80 - GOAL.height, 60, GAME_HEIGHT - 80);  // left post
    bg.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH - 60, GAME_HEIGHT - 80);  // right post
    bg.lineBetween(60, GAME_HEIGHT - 80 - GOAL.height, 0, GAME_HEIGHT - 80 - GOAL.height);  // left crossbar
    bg.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH, GAME_HEIGHT - 80 - GOAL.height);  // right crossbar
  }

  _createWalls() {
    const w = GAME_WIDTH, h = GAME_HEIGHT;
    const thick = 40;
    const crossbarY = h - 80 - GOAL.height; // y of the top of the goal opening

    // Floor
    this.matter.add.rectangle(w / 2, h - 80 + thick / 2, w, thick, { isStatic: true, friction: 0.3, restitution: 0.2, label: 'floor' });
    // Ceiling
    this.matter.add.rectangle(w / 2, -thick / 2, w, thick, { isStatic: true, restitution: 0.5, label: 'ceiling' });

    // Left outer wall — only ABOVE the goal opening (so ball can enter goal below)
    const leftWallH = crossbarY;  // from top (y=0) down to crossbar
    this.matter.add.rectangle(-thick / 2, leftWallH / 2, thick, leftWallH, { isStatic: true, restitution: 0.3, label: 'wall' });
    // Left goal back wall (ball bounces off back of net)
    this.matter.add.rectangle(-thick, h - 80 - GOAL.height / 2, thick, GOAL.height, { isStatic: true, restitution: 0.4, label: 'goalback' });

    // Right outer wall — only above the goal opening
    this.matter.add.rectangle(w + thick / 2, leftWallH / 2, thick, leftWallH, { isStatic: true, restitution: 0.3, label: 'wall' });
    // Right goal back wall
    this.matter.add.rectangle(w + thick, h - 80 - GOAL.height / 2, thick, GOAL.height, { isStatic: true, restitution: 0.4, label: 'goalback' });

    // Vertical goal posts are visual only — no physics bodies here.
    // A solid post body would block the ball from entering the goal entirely.
    // The crossbars block shots that come in from above.
    // Left crossbar
    this.matter.add.rectangle(31, crossbarY, 62, 10, { isStatic: true, restitution: 0.5, label: 'goalpost' });
    // Right crossbar
    this.matter.add.rectangle(w - 31, crossbarY, 62, 10, { isStatic: true, restitution: 0.5, label: 'goalpost' });
  }

  _createGoals() {
    const h = GAME_HEIGHT;
    // Sensors sit just inside the goal mouth — ball passes through post, hits sensor
    this.leftGoalZone = this.matter.add.rectangle(
      0, h - 80 - GOAL.height / 2, 40, GOAL.height,
      { isStatic: true, isSensor: true, label: 'goalLeft' }
    );
    this.rightGoalZone = this.matter.add.rectangle(
      GAME_WIDTH, h - 80 - GOAL.height / 2, 40, GOAL.height,
      { isStatic: true, isSensor: true, label: 'goalRight' }
    );
  }

  _setupGoalSensors() {
    this.matter.world.on('collisionstart', (event) => {
      if (this.matchOver || this.time.now < this.goalCooldownUntil) return;

      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const labels = [bodyA.label, bodyB.label];
        const hasBall = labels.includes('ball');

        if (hasBall && labels.includes('goalLeft')) {
          this._registerGoal(1); // right player scored into left goal
        } else if (hasBall && labels.includes('goalRight')) {
          this._registerGoal(0); // left player scored into right goal
        }
      });
    });
  }

  _registerGoal(scoringPlayer) {
    if (this.matchOver) return;
    this.goalCooldownUntil = this.time.now + MATCH.goalCooldown;
    this.score[scoringPlayer]++;

    this._showGoalEffect(scoringPlayer);

    this.time.delayedCall(MATCH.goalCooldown, () => {
      if (!this.matchOver) {
        this.ball.reset();
        this.p1.reset(GAME_WIDTH * 0.25);
        this.p2.reset(GAME_WIDTH * 0.75);
      }
    });

    if (this.score[scoringPlayer] >= MATCH.maxScore) {
      this.time.delayedCall(500, () => this._endMatch());
    }
  }

  _showGoalEffect(scoringPlayer) {
    const color = scoringPlayer === 0 ? 0x4488ff : 0xff4400;
    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, 'GOAL!', {
      fontSize: '120px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: `#${color.toString(16).padStart(6, '0')}`,
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: text,
      scaleX: 1.3, scaleY: 1.3,
      alpha: 0,
      duration: 1500,
      ease: 'Back.easeOut',
      onComplete: () => text.destroy(),
    });

    // Screen flash
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.4).setDepth(99);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });
  }

  _endMatch() {
    this.matchOver = true;
    let winner;
    if (this.score[0] > this.score[1]) winner = 0;
    else if (this.score[1] > this.score[0]) winner = 1;
    else winner = -1; // draw

    this.scene.stop('UIScene');
    this.scene.start('ResultScene', {
      score: this.score,
      winner,
      p1CharId: this.p1CharId,
      p2CharId: this.p2CharId,
      vsMode: this.vsMode,
    });
  }

  update(time, delta) {
    if (this.matchOver) return;
    if (this.paused) return;

    this.ball.update(delta);

    this.p1.update(time, delta, this.ball);

    if (this.vsMode === 'cpu') {
      this.cpu.update(time, delta, this.ball);
    } else {
      this.p2.update(time, delta, this.ball);
    }
  }
}
