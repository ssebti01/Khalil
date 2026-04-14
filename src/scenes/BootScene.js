import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Character head images
    this.load.image('head_blaze',  './assets/images/head_blaze.png');
    this.load.image('head_frost',  './assets/images/head_frost.png');
    this.load.image('head_bolt',   './assets/images/head_bolt.png');
    this.load.image('head_shadow', './assets/images/head_shadow.png');
    this.load.image('head_tiny',   './assets/images/head_tiny.png');
  }

  create() {
    // Generate a white pixel texture used by the particle emitter
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 4, 4);
    gfx.generateTexture('__DEFAULT', 4, 4);
    gfx.destroy();

    this.scene.start('MenuScene');
  }
}
