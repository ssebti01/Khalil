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
    // Forward all init data including mapId so the correct map reloads
    const data = { ...this.initData };
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
