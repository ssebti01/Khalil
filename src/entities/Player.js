import Phaser from 'phaser';
import { PLAYER, PHYSICS, GAME_WIDTH, GAME_HEIGHT, ABILITY_COOLDOWN, ABILITIES, BALL } from '../config/constants.js';

const HEAD_DISPLAY_SIZE = 128;

export class Player {
  constructor(scene, x, side, characterData, controlScheme) {
    this.scene = scene;
    this.side = side;
    this.char = characterData;
    this.controls = controlScheme;
    this.isOnGround = false;
    this.abilityCooldown = 0;
    this.frozenUntil = 0;
    this._jumpPressed = false;
    this._abilityPressed = false;
    this._create(x);
  }

  _create(x) {
    const startY = GAME_HEIGHT - 80 - PLAYER.headRadius - 2;

    this.sprite = this.scene.matter.add.image(x, startY, this.char.headImage);

    // Scale head image to display size
    const frame = this.scene.textures.getFrame(this.char.headImage);
    const scale = HEAD_DISPLAY_SIZE / Math.max(frame.realWidth, frame.realHeight);
    this.sprite.setScale(scale);

    if (this.side === 'right') {
      this.sprite.setFlipX(true);
    }

    this.sprite.setCircle(PLAYER.headRadius, {
      restitution: PHYSICS.playerRestitution,
      friction: PHYSICS.playerFriction,
      frictionAir: PHYSICS.playerAirFriction,
      mass: PHYSICS.playerMass,
      label: `player_${this.side}`,
    });
    this.sprite.setFixedRotation();
    this.sprite.setDepth(20);

    this.scene.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const bodies = [bodyA, bodyB];
        const isSelf  = bodies.some(b => b === this.sprite.body);
        const isBall  = bodies.some(b => b.label === 'ball');
        if (isSelf && isBall) this._wobble();
      });
    });

    // Zero X velocity if window loses focus — prevents held-key drift on alt-tab
    // Only X is zeroed so mid-air jump arcs are not interrupted by focus changes
    this.scene.game.events.on('blur', () => {
      this.sprite.setVelocityX(0);
    });
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  checkGround() {
    // On ground when within a few pixels of the floor surface
    const floorY = GAME_HEIGHT - 80 - PLAYER.headRadius;
    this.isOnGround = this.sprite.y >= floorY - 4;
  }

  update(time, delta, ball) {
    if (time < this.frozenUntil) return;

    const wasOnGround = this.isOnGround;
    this.checkGround();
    if (!wasOnGround && this.isOnGround) {
      this._wobble();
    }

    const speed = PLAYER.runSpeed * this.char.stats.speed;
    const body = this.sprite.body;
    const currentVY = body.velocity.y;

    if (this.controls.left.isDown) {
      // Set horizontal velocity directly, preserve vertical
      this.sprite.setVelocity(-speed, currentVY);
    } else if (this.controls.right.isDown) {
      this.sprite.setVelocity(speed, currentVY);
    } else {
      // Damp toward zero; hard-stop below epsilon to prevent infinite drift
      const dampedVX = body.velocity.x * 0.75;
      this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY);
    }

    // Jump — fresh keypress only, must be on ground
    if (this.controls.up.isDown) {
      if (!this._jumpPressed && this.isOnGround) {
        this.sprite.setVelocityY(PLAYER.jumpForce * this.char.stats.jump);
      }
      this._jumpPressed = true;
    } else {
      this._jumpPressed = false;
    }

    // Ability
    if (this.controls.ability && this.controls.ability.isDown) {
      if (!this._abilityPressed && time > this.abilityCooldown) {
        this._useAbility(time, ball);
      }
      this._abilityPressed = true;
    } else {
      this._abilityPressed = false;
    }

    // Hard clamp to arena so player can't escape past goal posts
    const minX = 62 + PLAYER.headRadius;
    const maxX = GAME_WIDTH - 62 - PLAYER.headRadius;
    if (this.sprite.x < minX) {
      this.sprite.setX(minX);
      this.sprite.setVelocityX(0);
    }
    if (this.sprite.x > maxX) {
      this.sprite.setX(maxX);
      this.sprite.setVelocityX(0);
    }
  }

  _useAbility(time, ball) {
    this._wobble();
    this.abilityCooldown = time + ABILITY_COOLDOWN;
    const id = this.char.id;

    if (id === 'khalil') {
      // fire — horizontal+upward impulse toward opponent's goal
      const dx = this.side === 'left' ? 1 : -1;
      ball.applyImpulse({ x: dx * ABILITIES.fire.impulseX, y: ABILITIES.fire.impulseY });
      this._emitParticles(0xff6600);
    } else if (id === 'beboush') {
      // ice — freeze opponent (resolved by GameScene handler)
      this.scene.events.emit('player-ability', { type: 'freeze', source: this });
      this._emitParticles(0x88ddff);
    } else if (id === 'lilya') {
      // thunder — horizontal dash toward ball
      const dx = ball.x - this.x;
      this.sprite.setVelocityX(Math.sign(dx) * ABILITIES.thunder.dashSpeed);
      this._emitParticles(0xffff44);
    } else if (id === 'fafa') {
      // ninja — teleport to ball, head-above (offsetY = -60), velocity zeroed
      this.sprite.setPosition(
        Phaser.Math.Clamp(ball.x, 80, GAME_WIDTH - 80),
        ball.y + ABILITIES.ninja.teleportOffsetY
      );
      this.sprite.setVelocity(0, 0);
      this._emitParticles(0xcc44ff);
    } else if (id === 'sara') {
      // tiny — super-jump up, then delayed ball slam-down (guard against mid-flight reset)
      this.sprite.setVelocityY(PLAYER.jumpForce * 1.8);
      this.scene.time.delayedCall(ABILITIES.tiny.ballLiftDelay, () => {
        // Guard: if ball was reset to center during the 350ms window, skip impulse
        const nearCenter =
          Math.abs(ball.x - BALL.startX) < 80 &&
          Math.abs(ball.y - BALL.startY) < 80;
        if (nearCenter) return;
        this.sprite.setVelocityY(12);
        ball.applyImpulse({ x: 0, y: ABILITIES.tiny.ballLiftImpulse });
      });
      this._emitParticles(0xffcc44);
    }
  }

  _emitParticles(color) {
    const particles = this.scene.add.particles(this.x, this.y, '__DEFAULT', {
      speed: { min: 40, max: 140 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.5, end: 0 },
      lifespan: 450,
      quantity: 14,
      tint: color,
    });
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  _wobble() {
    // Prevent stacking tweens — if one is already running, skip
    if (this._wobbling) return;
    this._wobbling = true;

    // Capture the sprite's current base scale (set during _create)
    const base = this.sprite.scaleX; // scaleX === scaleY when no flip involved

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: base * 1.15,   // stretch horizontally
      scaleY: base * 0.85,   // squash vertically
      duration: 60,
      ease: 'Sine.easeOut',
      yoyo: true,            // bounce back to base automatically
      onComplete: () => {
        // Restore exact base scale (yoyo lands close but pin precisely)
        this.sprite.setScale(base);
        this._wobbling = false;
      },
    });
  }

  freeze(duration) {
    this.frozenUntil = this.scene.time.now + duration;
    this.sprite.setTint(0x88ddff);
    this.scene.time.delayedCall(duration, () => this.sprite.clearTint());
  }

  getAbilityCooldownRatio(time) {
    if (this.abilityCooldown === 0) return 1;
    const elapsed = time - (this.abilityCooldown - ABILITY_COOLDOWN);
    return Math.min(elapsed / ABILITY_COOLDOWN, 1);
  }

  reset(x) {
    const startY = GAME_HEIGHT - 80 - PLAYER.headRadius - 2;
    this.sprite.setPosition(x, startY);
    this.sprite.setVelocity(0, 0);
    this.frozenUntil = 0;
    this._jumpPressed = false;
    this._abilityPressed = false;
    this.sprite.clearTint();
  }
}
