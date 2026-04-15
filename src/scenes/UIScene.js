import Phaser from 'phaser';
import { GAME_WIDTH, ABILITY_COOLDOWN, ABILITIES } from '../config/constants.js';

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

    // Ability HUD (top-center, below score bar)
    this._buildAbilityHUD(0, GAME_WIDTH / 2 - 140, '[Q]');    // P1 keybind: Q
    this._buildAbilityHUD(1, GAME_WIDTH / 2 + 140, '[SHIFT]'); // P2 keybind: SHIFT
  }

  _buildAbilityHUD(playerIndex, centerX, keybind) {
    const y = 97; // just below timer at y=80

    // Glow background (redrawn each frame; initially empty)
    const glowBg = this.add.graphics().setDepth(9);

    // Emoji icon — fontFamily omitted so OS handles emoji rendering
    const icon = this.add.text(centerX, y, '', {
      fontSize: '36px',
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5).setDepth(10);

    // Countdown number (shown when on cooldown, hidden when ready)
    const countdown = this.add.text(centerX, y + 26, '', {
      fontSize: '16px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(10);

    // Keybind label — always visible, dim below the HUD cluster
    this.add.text(centerX, y + 44, keybind, {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5).setDepth(10);

    const store = {
      icon,
      countdown,
      glowBg,
      pulseTween: null,  // tween ref (null when not pulsing)
      wasReady: false,   // edge-trigger flag for pulse lifecycle
    };
    if (playerIndex === 0) this._p1AbilHud = store;
    else                    this._p2AbilHud = store;
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

    // Ability cooldown HUDs
    const now = this.scene.get('GameScene').time.now;
    const p1Ratio = gs.p1 ? gs.p1.getAbilityCooldownRatio(now) : 1;
    const p2Ratio = gs.p2 ? gs.p2.getAbilityCooldownRatio(now) : 1;

    if (this._p1AbilHud && gs.p1) this._updateAbilityHUD(this._p1AbilHud, p1Ratio, gs.p1);
    if (this._p2AbilHud && gs.p2) this._updateAbilityHUD(this._p2AbilHud, p2Ratio, gs.p2);
  }

  _updateAbilityHUD(hud, ratio, player) {
    const char = player.char;
    const ready = ratio >= 1;
    // Use per-ability cooldown for accurate countdown (fallback to global ABILITY_COOLDOWN)
    const abilityKey = { khalil: 'fire', beboush: 'ice', lilya: 'thunder', fafa: 'ninja', sara: 'tiny' }[char.id];
    const cd = (abilityKey && ABILITIES[abilityKey]?.cooldown) ?? ABILITY_COOLDOWN;
    const secsRemaining = ready ? 0 : Math.ceil((1 - ratio) * cd / 1000);

    // Lazy-init emoji on first frame where char is available
    if (hud.icon.text !== char.emoji) hud.icon.setText(char.emoji);

    // Countdown: show seconds if on cooldown, hide if ready (D-02)
    hud.countdown.setText(ready ? '' : String(secsRemaining));

    // Pulse-tween lifecycle — edge-triggered to prevent stacking (RESEARCH Pitfall 2)
    if (ready && !hud.wasReady) {
      hud.pulseTween = this.tweens.add({
        targets: hud.icon,
        alpha: { from: 1, to: 0.45 },
        scaleX: { from: 1, to: 1.12 },
        scaleY: { from: 1, to: 1.12 },
        duration: 500,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
      hud.wasReady = true;
    } else if (!ready && hud.wasReady) {
      if (hud.pulseTween) {
        hud.pulseTween.stop();
        hud.pulseTween = null;
      }
      hud.icon.setAlpha(1).setScale(1);
      hud.wasReady = false;
    }

    // Glow background — tinted with char.accentColor when ready (D-03)
    hud.glowBg.clear();
    if (ready) {
      hud.glowBg.fillStyle(char.accentColor, 0.25);
      hud.glowBg.fillCircle(hud.icon.x, hud.icon.y, 28);
    }
  }
}
