import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.js';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';
import { getMaps } from '../config/maps.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.p1CharIndex = 0;
    this.p2CharIndex = 1;
    this.vsMode = '2p'; // '2p' or 'cpu'
    this.mapIndex = 0;
  }

  create() {
    // Restore state across scene.restart() (e.g. after mode toggle)
    const data = this.scene.settings.data || {};
    if (data.p1CharIndex !== undefined) this.p1CharIndex = data.p1CharIndex;
    if (data.p2CharIndex !== undefined) this.p2CharIndex = data.p2CharIndex;
    if (data.vsMode      !== undefined) this.vsMode      = data.vsMode;
    if (data.mapIndex    !== undefined) this.mapIndex    = data.mapIndex;

    this._drawBackground();
    this._drawTitle();
    this._drawModeToggle();
    this._drawCharacterSelect();
    this._drawMapSelector();
    this._drawStartButton();
    this._drawControls();
  }

  _drawBackground() {
    // Sky gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1b3a6b, 0x1b3a6b, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ground
    bg.fillStyle(0x3a7d44);
    bg.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);
    bg.fillStyle(0x2d6235);
    bg.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 8);

    // Stars
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT - 200);
      bg.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      bg.fillRect(x, y, 2, 2);
    }
  }

  _drawTitle() {
    this.add.text(GAME_WIDTH / 2, 70, 'HEAD SOCCER', {
      fontSize: '72px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      stroke: '#ff4400',
      strokeThickness: 8,
      shadow: { x: 4, y: 4, color: '#000', blur: 6, fill: true },
    }).setOrigin(0.5);
  }

  _drawModeToggle() {
    const y = 155;
    const tw = this.add.text(GAME_WIDTH / 2, y, '[ 2 PLAYER ]     VS CPU', {
      fontSize: '22px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffee00',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this._modeText = tw;
    this._updateModeText();

    tw.on('pointerdown', () => {
      this.vsMode = this.vsMode === '2p' ? 'cpu' : '2p';
      this._updateModeText();
      this._updateCharLabels();
    });
  }

  _updateModeText() {
    if (this.vsMode === '2p') {
      this._modeText.setText('[ 2 PLAYER ]     VS CPU');
    } else {
      this._modeText.setText('  2 PLAYER   [ VS CPU ]');
    }
  }

  _drawCharacterSelect() {
    this._charCards = [];
    const positions = [
      { x: GAME_WIDTH * 0.25, label: 'PLAYER 1', side: 'left' },
      { x: GAME_WIDTH * 0.75, label: 'PLAYER 2', side: 'right' },
    ];

    positions.forEach((pos, pIndex) => {
      const card = this.add.container(pos.x, 320);

      // Background card
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.4);
      bg.fillRoundedRect(-110, -90, 220, 260, 16);
      bg.lineStyle(3, pIndex === 0 ? 0x4488ff : 0xff4400);
      bg.strokeRoundedRect(-110, -90, 220, 260, 16);
      card.add(bg);

      // Player label
      const lbl = this.add.text(0, -70, pos.label, {
        fontSize: '18px', fontFamily: 'Arial Black, sans-serif',
        color: pIndex === 0 ? '#4488ff' : '#ff4400',
      }).setOrigin(0.5);
      card.add(lbl);

      // Character head image
      const charData = CHARACTERS[pIndex === 0 ? this.p1CharIndex : this.p2CharIndex];
      const headImg = this.add.image(0, 10, charData.headImage).setDisplaySize(120, 120).setOrigin(0.5);
      // P2 card faces left (mirror)
      if (pIndex === 1) headImg.setFlipX(true);
      card.add(headImg);

      // Character name
      const nameText = this.add.text(0, 75, charData.name, {
        fontSize: '24px', fontFamily: 'Arial Black, sans-serif',
        color: `#${charData.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      card.add(nameText);

      // Ability name
      const abilText = this.add.text(0, 105, charData.ability.name, {
        fontSize: '14px', fontFamily: 'Arial, sans-serif',
        color: '#aaaaaa',
      }).setOrigin(0.5);
      card.add(abilText);

      // Arrow buttons
      const leftBtn = this.add.text(-90, 10, '◄', {
        fontSize: '28px', color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      leftBtn.on('pointerdown', () => this._changeChar(pIndex, -1));
      leftBtn.on('pointerover', () => leftBtn.setColor('#ffee00'));
      leftBtn.on('pointerout', () => leftBtn.setColor('#ffffff'));
      card.add(leftBtn);

      const rightBtn = this.add.text(90, 10, '►', {
        fontSize: '28px', color: '#ffffff',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      rightBtn.on('pointerdown', () => this._changeChar(pIndex, 1));
      rightBtn.on('pointerover', () => rightBtn.setColor('#ffee00'));
      rightBtn.on('pointerout', () => rightBtn.setColor('#ffffff'));
      card.add(rightBtn);

      this._charCards.push({ headImg, nameText, abilText, pIndex, pos });
    });

    // P2 label reference for CPU mode toggle
    this._p2Label = this._charCards[1].pos;
  }

  _drawMapSelector() {
    const maps = getMaps();
    const cx = GAME_WIDTH / 2;
    const cy = 490;

    // Background strip
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(cx - 200, cy - 28, 400, 56, 10);
    bg.lineStyle(2, 0x888888, 0.6);
    bg.strokeRoundedRect(cx - 200, cy - 28, 400, 56, 10);

    // Label above
    this.add.text(cx, cy - 42, 'MAP', {
      fontSize: '14px', fontFamily: 'Arial Black, sans-serif',
      color: '#888888',
    }).setOrigin(0.5);

    // Map name text
    this._mapNameText = this.add.text(cx, cy, maps[this.mapIndex].name, {
      fontSize: '26px', fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Left arrow
    const leftArrow = this.add.text(cx - 170, cy, '◄', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    leftArrow.on('pointerdown', () => {
      this.mapIndex = (this.mapIndex - 1 + maps.length) % maps.length;
      this._mapNameText.setText(maps[this.mapIndex].name);
    });
    leftArrow.on('pointerover', () => leftArrow.setColor('#ffee00'));
    leftArrow.on('pointerout', () => leftArrow.setColor('#ffffff'));

    // Right arrow
    const rightArrow = this.add.text(cx + 170, cy, '►', {
      fontSize: '28px', color: '#ffffff',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    rightArrow.on('pointerdown', () => {
      this.mapIndex = (this.mapIndex + 1) % maps.length;
      this._mapNameText.setText(maps[this.mapIndex].name);
    });
    rightArrow.on('pointerover', () => rightArrow.setColor('#ffee00'));
    rightArrow.on('pointerout', () => rightArrow.setColor('#ffffff'));
  }

  _updateCharLabels() {
    // Redraw labels based on vsMode — rebuild scene, preserving selection state
    this.scene.restart({
      p1CharIndex: this.p1CharIndex,
      p2CharIndex: this.p2CharIndex,
      vsMode: this.vsMode,
      mapIndex: this.mapIndex,
    });
  }

  _changeChar(pIndex, dir) {
    if (pIndex === 0) {
      this.p1CharIndex = (this.p1CharIndex + dir + CHARACTERS.length) % CHARACTERS.length;
    } else {
      this.p2CharIndex = (this.p2CharIndex + dir + CHARACTERS.length) % CHARACTERS.length;
    }

    const card = this._charCards[pIndex];
    const charData = CHARACTERS[pIndex === 0 ? this.p1CharIndex : this.p2CharIndex];
    card.headImg.setTexture(charData.headImage);
    card.nameText.setText(charData.name);
    card.nameText.setColor(`#${charData.color.toString(16).padStart(6, '0')}`);
    card.abilText.setText(charData.ability.name);
  }

  _drawStartButton() {
    const btn = this.add.text(GAME_WIDTH / 2, 590, 'KICK OFF!', {
      fontSize: '42px',
      fontFamily: 'Arial Black, sans-serif',
      color: '#ffffff',
      backgroundColor: '#ff4400',
      padding: { x: 32, y: 14 },
      shadow: { x: 3, y: 3, color: '#000', blur: 4, fill: true },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#ff6600' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#ff4400' }));
    btn.on('pointerdown', () => this._startGame());

    // Also start with Enter / Space
    this.input.keyboard.on('keydown-ENTER', () => this._startGame());
    this.input.keyboard.on('keydown-SPACE', () => this._startGame());
  }

  _drawControls() {
    this.add.text(GAME_WIDTH / 2, 650, 'P1: A/D + W (jump) + Q (ability)        P2: ←/→ + ↑ (jump) + SHIFT (ability)', {
      fontSize: '13px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5);
  }

  _startGame() {
    const maps = getMaps();
    this.scene.start('GameScene', {
      p1CharId: CHARACTERS[this.p1CharIndex].id,
      p2CharId: CHARACTERS[this.p2CharIndex].id,
      vsMode: this.vsMode,
      mapId: maps[this.mapIndex].id,
    });
  }
}
