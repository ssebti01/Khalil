import Phaser from 'phaser';
import { GAME_WIDTH, ABILITY_COOLDOWN } from '../config/constants.js';

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene' }); }

  init(data) {
    this.gameScene = data.gameScene;
  }

  create() {
    // Score bar background
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.6);
    bar.fillRoundedRect(GAME_WIDTH / 2 - 180, 10, 360, 60, 12);

    // Scores
    this.p1ScoreText = this.add.text(GAME_WIDTH / 2 - 70, 40, '0', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#4488ff',
    }).setOrigin(0.5);

    this.p2ScoreText = this.add.text(GAME_WIDTH / 2 + 70, 40, '0', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ff4400',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 40, ':', {
      fontSize: '36px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 80, '1:30', {
      fontSize: '18px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#cccccc',
    }).setOrigin(0.5);

    // Ability cooldown bars
    this._buildAbilityBar(0, 30); // P1 bottom-left
    this._buildAbilityBar(1, GAME_WIDTH - 30); // P2 bottom-right
  }

  _buildAbilityBar(playerIndex, x) {
    const y = 670;
    const barW = 120;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(x - barW / 2, y - 8, barW, 16, 6);

    const fill = this.add.graphics();
    if (playerIndex === 0) {
      this._p1AbilBar = { fill, x: x - barW / 2, y: y - 8, w: barW };
    } else {
      this._p2AbilBar = { fill, x: x - barW / 2, y: y - 8, w: barW };
    }

    const label = playerIndex === 0 ? 'Q' : 'SHIFT';
    this.add.text(x, y + 12, `[${label}] Ability`, {
      fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#999999',
    }).setOrigin(0.5);
  }

  _drawAbilBar(bar, ratio, color) {
    bar.fill.clear();
    bar.fill.fillStyle(color, 0.85);
    bar.fill.fillRoundedRect(bar.x, bar.y, bar.w * ratio, 16, 6);
  }

  update() {
    const gs = this.gameScene;
    if (!gs || gs.matchOver || gs.paused) return;

    // Update score
    this.p1ScoreText.setText(gs.score[0]);
    this.p2ScoreText.setText(gs.score[1]);

    // Update timer
    const t = Math.max(0, gs.matchTime);
    const mins = Math.floor(t / 60);
    const secs = t % 60;
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    if (t <= 15) this.timerText.setColor('#ff4400');

    // Ability cooldown bars
    const now = this.scene.get('GameScene').time.now;
    const p1Ratio = gs.p1 ? gs.p1.getAbilityCooldownRatio(now) : 1;
    const p2Ratio = gs.p2 ? gs.p2.getAbilityCooldownRatio(now) : 1;
    const p1Color = gs.p1 ? gs.p1.char.accentColor : 0x4488ff;
    const p2Color = gs.p2 ? gs.p2.char.accentColor : 0xff4400;

    if (this._p1AbilBar) this._drawAbilBar(this._p1AbilBar, p1Ratio, p1Color);
    if (this._p2AbilBar) this._drawAbilBar(this._p2AbilBar, p2Ratio, p2Color);
  }
}
