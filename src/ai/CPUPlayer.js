import { PLAYER, GAME_WIDTH, GAME_HEIGHT, CPU_AI } from '../config/constants.js';

// Simple state-machine AI: DEFEND | CHASE | SHOOT
export class CPUPlayer {
  constructor(player, opponentSide) {
    this.player = player;       // Player entity
    this.opponentSide = opponentSide; // 'left' or 'right'
    this.state = 'CHASE';
    this._lastDecision = 0;
    this._abilityTimer = 0;
    this._contactCooldownUntil = 0; // pause re-targeting after touching ball
    this._nearBallLastFrame = false; // edge-detection: only trigger cooldown on first contact
  }

  update(time, delta, ball) {
    if (time - this._lastDecision < CPU_AI.reactionDelay) return;
    this._lastDecision = time;

    const p = this.player;
    const goalX = p.side === 'left' ? 60 : GAME_WIDTH - 60;

    // State transitions
    const ballNearOwnGoal = p.side === 'left'
      ? ball.x < 300
      : ball.x > GAME_WIDTH - 300;

    if (ballNearOwnGoal) {
      this.state = 'DEFEND';
    } else if (Math.abs(ball.x - p.x) < 200 && ball.y > GAME_HEIGHT - 300) {
      this.state = 'SHOOT';
    } else {
      this.state = 'CHASE';
    }

    // Contact detection: only trigger cooldown on the leading edge (first frame of contact)
    const nearBall = Math.abs(ball.x - p.x) < PLAYER.headRadius + 30;
    if (nearBall && !this._nearBallLastFrame) {
      this._contactCooldownUntil = time + CPU_AI.contactCooldown;
    }
    this._nearBallLastFrame = nearBall;

    // Compute target X
    let targetX;
    if (this.state === 'DEFEND') {
      targetX = goalX + (p.side === 'left' ? 80 : -80);
    } else if (time < this._contactCooldownUntil) {
      // Just touched the ball — hold position briefly so ball can escape
      targetX = p.x;
    } else {
      // Approach ball from behind so contact results in a shot, not a pin
      const strikeDir = p.side === 'left' ? -1 : 1;
      targetX = ball.x + strikeDir * CPU_AI.strikeOffset;
    }

    // Force-based horizontal movement — accelerate toward target, decelerate near it
    const dx = targetX - p.x;
    const maxSpeed = PLAYER.runSpeed * p.char.stats.speed;
    const currentVX = p.sprite.body.velocity.x;

    if (Math.abs(dx) > CPU_AI.deadZone) {
      const dir = Math.sign(dx);
      const newVX = Math.max(-maxSpeed, Math.min(maxSpeed, currentVX + dir * CPU_AI.accel));
      p.sprite.setVelocityX(newVX);
    } else {
      // Dead zone: mirror the player damping epsilon so stopping feels identical
      const newVX = currentVX * 0.75;
      p.sprite.setVelocityX(Math.abs(newVX) < 0.5 ? 0 : newVX);
    }

    // Jump when ball is above player and close horizontally
    if (Math.abs(ball.x - p.x) < 150 && ball.y < p.y - 20 && p.isOnGround) {
      p.sprite.setVelocityY(PLAYER.jumpForce * p.char.stats.jump);
    }

    // Random ability use
    if (time > this._abilityTimer + CPU_AI.abilityInterval) {
      this._abilityTimer = time;
      if (Math.random() < CPU_AI.abilityChance) {
        p.abilityCooldown = 0;
        p._useAbility(time, ball);
      }
    }

    // Clamp to arena bounds
    const minX = 60 + PLAYER.headRadius;
    const maxX = GAME_WIDTH - 60 - PLAYER.headRadius;
    if (p.sprite.x < minX) { p.sprite.setX(minX); p.sprite.setVelocityX(0); }
    if (p.sprite.x > maxX) { p.sprite.setX(maxX); p.sprite.setVelocityX(0); }
  }
}
