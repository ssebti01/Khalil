import Phaser from 'phaser';
import { PLAYER, PHYSICS, GAME_WIDTH, GAME_HEIGHT, ABILITY_COOLDOWN, ABILITIES, BALL, LEG } from '../config/constants.js';

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
    this._kickPressed = false;
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
      collisionFilter: {
        // Players are in category 0x0002. They collide with everything EXCEPT each other.
        // Ball is category 0x0001 (default). Walls/floor have no filter set so they use default mask 0xFFFFFFFF.
        category: 0x0002,
        mask: 0x0001,  // only collide with ball (category 0x0001)
      },
    });
    this.sprite.setFixedRotation();
    this._pushOverride = null; // set by GameScene when players are in contact; null = not in contact
    this.sprite.setDepth(20);

    // Leg visual state
    this._legGfx    = this.scene.add.graphics();
    this._legGfx.setDepth(LEG.depth);
    this._facingDir = this.side === 'right' ? -1 : 1; // default: face inward toward field
    this._legState  = { angle: 0 };  // wrapped in object so Phaser tweens can target it
    this._legAngle  = 0;      // degrees offset from idle thigh angle during kick tween (mirror of _legState.angle)
    this._kicking   = false;  // guard against stacking kick tweens
    this._ballRef   = null;   // written each frame in update(); read by collision handler
    this._liftFired = false;  // one-per-contact guard for lift impulse

    this.scene.matter.world.on('collisionstart', (event) => {
      event.pairs.forEach(pair => {
        const bodies = [pair.bodyA, pair.bodyB];
        const isSelf = bodies.some(b => b === this.sprite.body);
        const isBall = bodies.some(b => b.label === 'ball');
        if (isSelf && isBall) {
          this._wobble();
          this._kickAnimate();
          if (!this._liftFired && this._ballRef) {
            this._liftFired = true;
            // Only lift if ball is moving fast enough — avoids pop on slow ground contact
            const bv = this._ballRef.sprite.body.velocity;
            const speed = Math.sqrt(bv.x * bv.x + bv.y * bv.y);
            if (speed >= LEG.liftMinSpeed) {
              this._ballRef.applyImpulse({ x: 0, y: LEG.liftImpulseY });
            }
          }
        }
      });
    });

    this.scene.matter.world.on('collisionend', (event) => {
      event.pairs.forEach(pair => {
        const bodies = [pair.bodyA, pair.bodyB];
        const isSelf = bodies.some(b => b === this.sprite.body);
        const isBall = bodies.some(b => b.label === 'ball');
        if (isSelf && isBall) this._liftFired = false;
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

  // Signed push strength for this frame. Positive = right, negative = left, 0 = idle.
  get pushIntent() {
    const speed = PLAYER.runSpeed * this.char.stats.speed;
    if (this.controls.left.isDown)  return -speed;
    if (this.controls.right.isDown) return  speed;
    return 0;
  }

  checkGround() {
    // On ground when within a few pixels of the floor surface
    const floorY = GAME_HEIGHT - 80 - PLAYER.headRadius;
    this.isOnGround = this.sprite.y >= floorY - 4;
  }

  update(time, delta, ball) {
    // Store ball reference for use by collision handler (fires during physics step)
    this._ballRef = ball;

    if (time < this.frozenUntil) return;

    const wasOnGround = this.isOnGround;
    this.checkGround();
    if (!wasOnGround && this.isOnGround) {
      this._wobble();
    }

    const speed = PLAYER.runSpeed * this.char.stats.speed;
    const body = this.sprite.body;
    const currentVY = body.velocity.y;

    if (this._pushOverride !== null) {
      // Push resolution from GameScene — apply net velocity for this frame
      this.sprite.setVelocity(this._pushOverride, currentVY);
      this._pushOverride = null; // consumed; re-set every contact frame by GameScene
    } else if (this.controls.left.isDown) {
      // Set horizontal velocity directly, preserve vertical
      this.sprite.setVelocity(-speed, currentVY);
    } else if (this.controls.right.isDown) {
      this.sprite.setVelocity(speed, currentVY);
    } else {
      // Damp toward zero; hard-stop below epsilon to prevent infinite drift
      const dampedVX = body.velocity.x * 0.75;
      this.sprite.setVelocity(Math.abs(dampedVX) < 0.5 ? 0 : dampedVX, currentVY);
    }

    // Update facing direction from input; CPU: infer from velocity when no key held
    if (this.controls.left.isDown) {
      this._facingDir = -1;
    } else if (this.controls.right.isDown) {
      this._facingDir = 1;
    } else {
      const vx = body.velocity.x;
      if (Math.abs(vx) > 0.5) this._facingDir = Math.sign(vx);
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

    // Manual kick
    if (this.controls.kick && this.controls.kick.isDown) {
      if (!this._kickPressed) {
        this._manualKick(ball);
      }
      this._kickPressed = true;
    } else {
      this._kickPressed = false;
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

    this._drawLeg();
  }

  _useAbility(time, ball) {
    this._wobble();
    const id = this.char.id;

    // Use per-ability cooldown if defined, fall back to global ABILITY_COOLDOWN
    const abilityKey = { khalil: 'fire', beboush: 'ice', lilya: 'thunder', fafa: 'ninja', sara: 'tiny' }[id];
    const cd = (abilityKey && ABILITIES[abilityKey]?.cooldown) ?? ABILITY_COOLDOWN;
    this.abilityCooldown = time + cd;

    if (id === 'khalil') {
      // fire — visible directional blast toward opponent's goal
      const dx = this.side === 'left' ? 1 : -1;
      ball.applyImpulse({ x: dx * ABILITIES.fire.impulseX, y: ABILITIES.fire.impulseY });
      this._emitParticles(0xff6600);
    } else if (id === 'beboush') {
      // ice — freeze opponent (resolved by GameScene handler)
      this.scene.events.emit('player-ability', { type: 'freeze', source: this });
      this._emitParticles(0x88ddff);
    } else if (id === 'lilya') {
      // thunder — fast dash toward ball
      const dx = ball.x - this.x;
      this.sprite.setVelocityX(Math.sign(dx) * ABILITIES.thunder.dashSpeed);
      this._emitParticles(0xffff44);
    } else if (id === 'fafa') {
      // ninja — teleport to ball (X clamped away from goal mouth), then 300ms move lockout
      this.sprite.setPosition(
        Phaser.Math.Clamp(ball.x, ABILITIES.ninja.teleportXMin, ABILITIES.ninja.teleportXMax),
        ball.y + ABILITIES.ninja.teleportOffsetY
      );
      this.sprite.setVelocity(0, 0);
      this._emitParticles(0xcc44ff);
      // Post-teleport lockout — prevents instant teleport-to-header exploit
      this.frozenUntil = time + ABILITIES.ninja.postLockout;
    } else if (id === 'sara') {
      // tiny — rocket upward; at apex launch ball skyward (not downward)
      this.sprite.setVelocityY(PLAYER.jumpForce * 1.8);
      this.scene.time.delayedCall(ABILITIES.tiny.ballLiftDelay, () => {
        // Guard: if ball was reset to center during the delay window, skip impulse
        const nearCenter =
          Math.abs(ball.x - BALL.startX) < 80 &&
          Math.abs(ball.y - BALL.startY) < 80;
        if (nearCenter) return;
        const dx = this.side === 'left' ? 1 : -1;
        ball.applyImpulse({ x: dx * ABILITIES.tiny.ballLiftImpulseX, y: ABILITIES.tiny.ballLiftImpulseY });
      });
      this._emitParticles(0xffcc44);
    }
  }

  _manualKick(ball) {
    // Kill any in-flight leg tween so the manual kick always restarts cleanly
    this.scene.tweens.killTweensOf(this._legState);
    this._kicking = false;
    this._legState.angle = 0;
    this._legAngle = 0;
    this._kickAnimate();
    this._wobble();
    // Only apply impulse if ball is close enough (within 2.5× head radius)
    const dist = Phaser.Math.Distance.Between(this.x, this.y, ball.x, ball.y);
    if (dist <= PLAYER.headRadius * 2.5) {
      const dx = this.side === 'left' ? 1 : -1;
      ball.applyImpulse({ x: dx * LEG.kickImpulseX, y: LEG.kickImpulseY });
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

  _drawLeg() {
    const gfx = this._legGfx;
    gfx.clear();

    const hx = this.sprite.x;
    const hy = this.sprite.y;

    // Thigh root: bottom of head circle
    const attachX = hx;
    const attachY = hy + PLAYER.headRadius;

    // Thigh angle: idle lean + kick offset in degrees, signed by facing direction
    const thighRad = Phaser.Math.DegToRad(
      (LEG.thighAngleIdle + this._legAngle) * this._facingDir
    );

    const kneeX = attachX + Math.sin(thighRad) * LEG.thighLength;
    const kneeY = attachY + Math.cos(thighRad) * LEG.thighLength;

    // Shin hangs straight down from knee (vertical — more legible at small scale)
    const ankleX = kneeX;
    const ankleY = kneeY + LEG.shinLength;

    // Draw thigh
    gfx.lineStyle(LEG.strokeWidth, LEG.strokeColor, 1);
    gfx.beginPath();
    gfx.moveTo(attachX, attachY);
    gfx.lineTo(kneeX, kneeY);
    gfx.strokePath();

    // Draw shin
    gfx.beginPath();
    gfx.moveTo(kneeX, kneeY);
    gfx.lineTo(ankleX, ankleY);
    gfx.strokePath();

    // Draw foot rectangle extending outward in facing direction from ankle
    const footX = this._facingDir > 0 ? ankleX : ankleX - LEG.footLength;
    const footY = ankleY - LEG.footHeight / 2;
    gfx.fillStyle(LEG.fillColor, 1);
    gfx.fillRect(footX, footY, LEG.footLength, LEG.footHeight);
    gfx.lineStyle(2, LEG.strokeColor, 1);
    gfx.strokeRect(footX, footY, LEG.footLength, LEG.footHeight);
  }

  _kickAnimate() {
    if (this._kicking) return;
    this._kicking = true;

    // Phase 1: swing thigh forward
    this.scene.tweens.add({
      targets: this._legState,
      angle: LEG.kickAngleDelta,
      duration: LEG.kickForwardDuration,
      ease: 'Sine.easeOut',
      onUpdate: () => { this._legAngle = this._legState.angle; },
      onComplete: () => {
        // Phase 2: return to idle
        this.scene.tweens.add({
          targets: this._legState,
          angle: 0,
          duration: LEG.kickReturnDuration,
          ease: 'Quad.easeIn',
          onUpdate: () => { this._legAngle = this._legState.angle; },
          onComplete: () => { this._kicking = false; },
        });
      },
    });
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
    const abilityKey = { khalil: 'fire', beboush: 'ice', lilya: 'thunder', fafa: 'ninja', sara: 'tiny' }[this.char.id];
    const cd = (abilityKey && ABILITIES[abilityKey]?.cooldown) ?? ABILITY_COOLDOWN;
    const elapsed = time - (this.abilityCooldown - cd);
    return Math.min(elapsed / cd, 1);
  }

  reset(x) {
    const startY = GAME_HEIGHT - 80 - PLAYER.headRadius - 2;
    this.sprite.setPosition(x, startY);
    this.sprite.setVelocity(0, 0);
    this.frozenUntil = 0;
    this._jumpPressed = false;
    this._abilityPressed = false;
    this.sprite.clearTint();
    this._legAngle  = 0;
    this._kicking   = false;
    this._liftFired = false;
    this._ballRef   = null;
    this._facingDir = this.side === 'right' ? -1 : 1;
  }
}
