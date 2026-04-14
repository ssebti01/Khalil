import { BALL, PHYSICS } from '../config/constants.js';

export class Ball {
  constructor(scene) {
    this.scene = scene;
    this._stuckTimer = 0;
    this._lastPos = { x: BALL.startX, y: BALL.startY };
    this._create();
  }

  _create() {
    const { startX, startY, radius } = BALL;

    if (!this.scene.textures.exists('ball')) {
      const d = radius * 2;
      const gfx = this.scene.make.graphics({ x: 0, y: 0, add: false });

      // White ball base
      gfx.fillStyle(0xffffff);
      gfx.fillCircle(radius, radius, radius);

      // Black panel patches (classic soccer ball look)
      gfx.fillStyle(0x111111);
      // Centre pentagon
      gfx.fillCircle(radius, radius, radius * 0.28);
      // 5 surrounding patches
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const px = radius + Math.cos(angle) * radius * 0.55;
        const py = radius + Math.sin(angle) * radius * 0.55;
        gfx.fillCircle(px, py, radius * 0.22);
      }

      // Outer border
      gfx.lineStyle(2, 0x222222);
      gfx.strokeCircle(radius, radius, radius - 1);

      gfx.generateTexture('ball', d, d);
      gfx.destroy();
    }

    this.sprite = this.scene.matter.add.image(startX, startY, 'ball');
    this.sprite.setCircle(radius, {
      restitution: PHYSICS.ballRestitution,
      friction: PHYSICS.ballFriction,
      frictionAir: PHYSICS.ballAirFriction,
      mass: PHYSICS.ballMass,
      label: 'ball',
    });
    this.sprite.setDepth(10);
  }

  reset() {
    this.sprite.setPosition(BALL.startX, BALL.startY);
    this.sprite.setVelocity(0, 0);
    this.sprite.setAngularVelocity(0);
    this._stuckTimer = 0;
    this._lastPos = { x: BALL.startX, y: BALL.startY };
  }

  update(delta) {
    const body = this.sprite.body;

    // Velocity cap — prevents physics instability after chained ability kicks
    const vel = body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    if (speed > BALL.maxVelocity) {
      const scale = BALL.maxVelocity / speed;
      this.scene.matter.body.setVelocity(body, { x: vel.x * scale, y: vel.y * scale });
    }

    // Angular velocity cap — prevents visual blurring at high spin rates
    const av = body.angularVelocity;
    if (Math.abs(av) > BALL.maxAngularVelocity) {
      this.scene.matter.body.setAngularVelocity(body, Math.sign(av) * BALL.maxAngularVelocity);
    }

    // Stuck-ball recovery — reset to center if ball hasn't moved in stuckTimeout ms
    const dx = Math.abs(this.sprite.x - this._lastPos.x);
    const dy = Math.abs(this.sprite.y - this._lastPos.y);
    if (dx < BALL.stuckThreshold && dy < BALL.stuckThreshold) {
      this._stuckTimer += delta;
      if (this._stuckTimer >= BALL.stuckTimeout) {
        this.reset();
      }
    } else {
      this._stuckTimer = 0;
      this._lastPos = { x: this.sprite.x, y: this.sprite.y };
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
  get velocity() { return this.sprite.body.velocity; }

  applyImpulse(forceObj) {
    this.sprite.applyForce(forceObj);
  }
}
