import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    // Character head images
    this.load.image('head_khalil',  './images/heads/Gemini_Generated_Image_64vc0b64vc0b64vc.png');
    this.load.image('head_beboush', './images/heads/Gemini_Generated_Image_adax3hadax3hadax.png');
    this.load.image('head_lilya',   './images/heads/Gemini_Generated_Image_awr8l7awr8l7awr8.png');
    this.load.image('head_fafa',    './images/heads/Gemini_Generated_Image_jldm69jldm69jldm.png');
    this.load.image('head_sara',    './images/heads/Gemini_Generated_Image_v0pmspv0pmspv0pm.png');
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
