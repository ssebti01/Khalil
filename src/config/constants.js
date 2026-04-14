export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

// Matter.js velocities are in pixels per frame (at 60fps).
// px/frame = px/sec / 60
export const PHYSICS = {
  // Gravity is set in main.js config as { y: 2 } (px/frame²)
  ballRestitution: 0.7,   // bounciness 0-1
  ballFriction: 0.005,
  ballAirFriction: 0.001,
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
};

export const BALL = {
  radius: 26,
  startX: GAME_WIDTH / 2,
  startY: 280,
  maxVelocity: 25,          // px/frame — clamp prevents physics instability after chained kicks
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

export const ABILITY_COOLDOWN = 8000;

export const CPU_AI = {
  accel: 0.8,          // px/frame² — horizontal acceleration toward target
  deadZone: 24,        // px — stop accelerating within this distance of target
  contactCooldown: 350,// ms — hold position after touching ball so it can escape
  strikeOffset: 40,    // px — approach from behind ball for cleaner contact
  reactionDelay: 120,  // ms — minimum time between AI decisions
  abilityInterval: 10000, // ms — minimum time between ability uses
  abilityChance: 0.4,  // 0-1 — probability of using ability each interval
};

export const ABILITIES = {
  fire:    { impulseX: 0.06, impulseY: -0.04 },
  ice:     { freezeDuration: 2000 },
  thunder: { dashSpeed: 15 },
  ninja:   { teleportOffsetY: -60 },
  tiny:    { ballLiftDelay: 350, ballLiftImpulse: 0.08 },
};
