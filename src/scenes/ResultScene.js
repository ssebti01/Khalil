import Phaser from 'phaser';
import { getCharacter } from '../config/characters.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export class ResultScene extends Phaser.Scene {
  constructor() { super({ key: 'ResultScene' }); }

  init(data) {
    this.score = data.score;
    this.winner = data.winner; // 0, 1, or -1 (draw)
    this.p1CharId = data.p1CharId;
    this.p2CharId = data.p2CharId;
    this.vsMode = data.vsMode;
  }

  create() {
    // Dim background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75);

    const p1 = getCharacter(this.p1CharId);
    const p2 = getCharacter(this.p2CharId);

    // Winner announcement
    let headline, color;
    if (this.winner === -1) {
      headline = "IT'S A DRAW!";
      color = '#ffee00';
    } else {
      const winChar = this.winner === 0 ? p1 : p2;
      headline = `${winChar.name.toUpperCase()} WINS!`;
      color = `#${winChar.color.toString(16).padStart(6, '0')}`;
    }

    this.add.text(GAME_WIDTH / 2, 180, headline, {
      fontSize: '80px',
      fontFamily: 'Arial Black, sans-serif',
      color,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Final score
    this.add.text(GAME_WIDTH / 2, 300, `${this.score[0]}  :  ${this.score[1]}`, {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Character head images
    this.add.image(GAME_WIDTH * 0.3, 300, p1.headImage).setDisplaySize(130, 130).setOrigin(0.5);
    this.add.image(GAME_WIDTH * 0.7, 300, p2.headImage).setDisplaySize(130, 130).setFlipX(true).setOrigin(0.5);

    // Rematch button
    const rematch = this.add.text(GAME_WIDTH / 2 - 130, 430, 'REMATCH', {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      backgroundColor: '#ff4400',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    rematch.on('pointerover', () => rematch.setStyle({ backgroundColor: '#ff6600' }));
    rematch.on('pointerout', () => rematch.setStyle({ backgroundColor: '#ff4400' }));
    rematch.on('pointerdown', () => {
      this.scene.start('GameScene', {
        p1CharId: this.p1CharId,
        p2CharId: this.p2CharId,
        vsMode: this.vsMode,
      });
    });

    // Main menu button
    const menu = this.add.text(GAME_WIDTH / 2 + 130, 430, 'MENU', {
      fontSize: '32px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      backgroundColor: '#222266',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menu.on('pointerover', () => menu.setStyle({ backgroundColor: '#3333aa' }));
    menu.on('pointerout', () => menu.setStyle({ backgroundColor: '#222266' }));
    menu.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('GameScene', {
        p1CharId: this.p1CharId, p2CharId: this.p2CharId, vsMode: this.vsMode,
      });
    });
    this.input.keyboard.once('keydown-ESC', () => this.scene.start('MenuScene'));
  }
}
