import Phaser from 'phaser';
import { Ball } from '../entities/Ball.js';
import { Player } from '../entities/Player.js';
import { CPUPlayer } from '../ai/CPUPlayer.js';
import { getCharacter } from '../config/characters.js';
import {
  GAME_WIDTH, GAME_HEIGHT, MATCH, PLAYER, GOAL, PHYSICS,
} from '../config/constants.js';
import { getMap, MAPS } from '../config/maps.js';
import { drawBackground, createObstacles } from '../systems/MapLoader.js';

const Matter = Phaser.Physics.Matter.Matter;

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
    this.mapId = data.mapId ?? 'stadium';
    this._currentMap = MAPS.find(m => m.id === this.mapId) ?? null;
    this._windActive = false;
    this._windTimer = null;
  }

  create() {
    const mapConfig = getMap(this.mapId);
    drawBackground(this, mapConfig);
    createObstacles(this, mapConfig);
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

    // Wind mechanic (map-specific)
    this._setupWind(this._currentMap);

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
    if (this._windTimer) {
      this._windTimer.remove(false);
      this._windTimer = null;
    }
    this._windActive = false;
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

  _setupWind(mapConfig) {
    if (!mapConfig || !mapConfig.windForce) return;
    const wf = mapConfig.windForce;
    this._windTimer = this.time.addEvent({
      delay: wf.intervalMs,
      loop: true,
      callback: () => {
        this._windActive = true;
        this.time.delayedCall(500, () => {
          this._windActive = false;
        });
      },
    });
  }

  update(time, delta) {
    if (this.matchOver) return;
    if (this.paused) return;

    // Wind force application (Chicago map mechanic)
    if (this._windActive && this._currentMap?.windForce && this.ball?.body) {
      const wf = this._currentMap.windForce;
      Matter.Body.applyForce(
        this.ball.body,
        this.ball.body.position,
        { x: wf.x * 0.0001, y: 0 }
      );
    }

    this.ball.update(delta);

    this.p1.update(time, delta, this.ball);

    if (this.vsMode === 'cpu') {
      this.cpu.update(time, delta, this.ball);
    } else {
      this.p2.update(time, delta, this.ball);
    }
  }
}
