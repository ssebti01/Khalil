export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Matter.js velocities are in pixels per frame (at 60fps).
// px/frame = px/sec / 60
export const PHYSICS = {
  // Gravity is set in main.js config as { y: 2 } (px/frame²)
  ballRestitution: 0.85,  // bounciness 0-1
  ballFriction: 0.02,
  ballAirFriction: 0.008,
  ballMass: 0.8,
  playerFriction: 0.05,
  playerAirFriction: 0.01,
  playerRestitution: 0.1,
  playerMass: 5,
};

export const PLAYER = {
  // px/frame (÷60 converts from px/sec to px/frame for Matter)
  runSpeed: 5.5,
  jumpForce: -12,
  headRadius: 40,
  groundY: GAME_HEIGHT - 80,
  pushContactDist: 84,    // px — two headRadii (40+40) + 4px overlap tolerance
  pushLockThreshold: 0.5, // px/frame — net below this snaps to full cancel (prevents jitter)
};

export const BALL = {
  radius: 20,
  startX: GAME_WIDTH / 2,
  startY: 280,
  maxVelocity: 22,          // px/frame — clamp prevents physics instability after chained kicks
  maxAngularVelocity: 0.3,  // rad/frame — prevents visual blurring at high spin rates
  stuckTimeout: 5000,       // ms — reset if ball hasn't moved stuckThreshold px in this window
  stuckThreshold: 2,        // px — minimum displacement per stuckTimeout to count as "moving"
};

export const GOAL = {
  width: 20,
  height: 190,
  poleRadius: 10,
};

export const MATCH = {
  duration: 90,
  maxScore: 7,
  goalCooldown: 2500,
};

// Fallback cooldown — each ability now defines its own via ABILITIES[x].cooldown
export const ABILITY_COOLDOWN = 8000;

export const ABILITIES = {
  // Khalil — Fireball: visible directional shot; cooldown short (weak ability)
  fire:    { impulseX: 0.35, impulseY: -0.25, cooldown: 5000 },
  // Beboush — Freeze: 1.2s freeze (down from 2s); long cooldown reflects high impact
  ice:     { freezeDuration: 1200, cooldown: 11000 },
  // Lilya — Thunder Rush: fast dash + contact impulse on ball; medium cooldown
  thunder: { dashSpeed: 22, cooldown: 6000 },
  // Fafa — Teleport: X clamped away from goal mouth; post-teleport movement lockout
  ninja:   { teleportOffsetY: -60, teleportXMin: 200, teleportXMax: 1080, postLockout: 300, cooldown: 14000 },
  // Sara — Super Bounce: upward ball impulse at apex (not downward); shorter delay
  tiny:    { ballLiftDelay: 200, ballLiftImpulseY: -0.55, ballLiftImpulseX: 0.15, cooldown: 5000 },
};

export const LEG = {
  thighLength:         14,       // px, vertical drop from head bottom to knee
  thighAngleIdle:      15,       // degrees outward tilt of thigh from vertical (at rest)
  shinLength:          12,       // px, knee to ankle
  footLength:          13,       // px, horizontal foot extension from ankle
  footHeight:          5,        // px, foot rectangle thickness
  strokeWidth:         4,        // px, leg line stroke width
  strokeColor:         0x222222,
  fillColor:           0x444444,
  kickAngleDelta:      35,       // degrees thigh rotates forward on kick (idle 15° + delta 35° = 50° total)
  kickForwardDuration: 80,       // ms, swing-out phase
  kickReturnDuration:  120,      // ms, return phase
  liftImpulseY:       -0.025,    // upward impulse on ball per collision
  liftMinSpeed:        2,        // px/frame — minimum ball speed to trigger lift (avoids ground-crawl pop)
  kickImpulseX:        0.18,     // horizontal impulse for manual kick (E/L keys)
  kickImpulseY:       -0.12,     // upward component for manual kick
  depth:               15,       // behind head (20), in front of ball (10)
};
