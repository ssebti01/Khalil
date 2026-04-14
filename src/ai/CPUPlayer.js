import { PLAYER, GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

// CPU acceleration: px/frame² applied each tick. Lower = smoother, less "magnetic".
const CPU_ACCEL = 0.8;
// How close to target before stopping (dead zone)
const CPU_DEAD_ZONE = 24;
// After touching the ball, wait this many ms before re-targeting it
const CPU_CONTACT_COOLDOWN = 350;
// Lateral offset from ball center so CPU hits the ball rather than centering on it
const CPU_STRIKE_OFFSET = 40;

// Simple state-machine AI: DEFEND | CHASE | SHOOT
export class CPUPlayer {
  constructor(player, opponentSide) {
    this.player = player;       // Player entity
    this.opponentSide = opponentSide; // 'left' or 'right'
    this.state = 'CHASE';
    this.reactionDelay = 120;   // ms between state decisions
    this._lastDecision = 0;
    this._abilityTimer = 0;
    this._contactCooldownUntil = 0; // pause re-targeting after touching ball
  }

  update(time, delta, ball) {
    if (time - this._lastDecision < this.reactionDelay) return;
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

    // Detect contact: ball very close to player → start cooldown
    const distToBall = Math.abs(ball.x - p.x);
    if (distToBall < PLAYER.headRadius + 30) {
      this._contactCooldownUntil = time + CPU_CONTACT_COOLDOWN;
    }

    // Compute target X
    let targetX;
    if (this.state === 'DEFEND') {
      targetX = goalX + (p.side === 'left' ? 80 : -80);
    } else if (time < this._contactCooldownUntil) {
      // Just touched the ball — hold position briefly so ball can escape
      targetX = p.x;
    } else {
      // Approach ball from the side that allows a shot on opponent goal
      const strikeDir = p.side === 'left' ? -1 : 1; // approach from behind ball
      targetX = ball.x + strikeDir * CPU_STRIKE_OFFSET;
    }

    // Force-based horizontal movement — accelerate toward target, decelerate near it
    const dx = targetX - p.x;
    const maxSpeed = PLAYER.runSpeed * p.char.stats.speed;
    const body = p.sprite.body;
    const currentVX = body.velocity.x;

    if (Math.abs(dx) > CPU_DEAD_ZONE) {
      const dir = Math.sign(dx);
      // Apply acceleration in target direction, capped at maxSpeed
      const newVX = Math.max(-maxSpeed, Math.min(maxSpeed, currentVX + dir * CPU_ACCEL));
      p.sprite.setVelocityX(newVX);
    } else {
      // Dead zone: decelerate to stop
      const newVX = currentVX * 0.7;
      p.sprite.setVelocityX(Math.abs(newVX) < 0.5 ? 0 : newVX);
    }

    // Jump when ball is above player and close horizontally
    if (Math.abs(ball.x - p.x) < 150 && ball.y < p.y - 20 && p.isOnGround) {
      p.sprite.setVelocityY(PLAYER.jumpForce * p.char.stats.jump);
    }

    // Random ability use
    if (time > this._abilityTimer + 10000) {
      this._abilityTimer = time;
      if (Math.random() < 0.4) {
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
