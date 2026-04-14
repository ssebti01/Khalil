import { GAME_WIDTH, GAME_HEIGHT, GOAL } from '../config/constants.js';

/**
 * Draws the background visuals for a map (sky, crowd, pitch, markings, nets, goal posts).
 * @param {Phaser.Scene} scene
 * @param {object} mapConfig - map config object from MAPS array
 */
export function drawBackground(scene, mapConfig) {
  const { background: bg_cfg } = mapConfig;
  const g = scene.add.graphics();

  // Sky gradient
  const [tl, br] = bg_cfg.skyColors;
  g.fillGradientStyle(tl, tl, br, br, 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Crowd silhouettes
  g.fillStyle(bg_cfg.crowdColor, 0.8);
  for (let i = 0; i < 60; i++) {
    const x = i * 22 + 5;
    const h = Phaser.Math.Between(30, 60);
    g.fillRect(x, GAME_HEIGHT - 80 - h - 8, 16, h);
  }

  // Pitch
  g.fillStyle(bg_cfg.pitchColor);
  g.fillRect(0, GAME_HEIGHT - 80, GAME_WIDTH, 80);

  // Pitch markings
  g.lineStyle(2, bg_cfg.markingColor, 0.6);
  g.strokeRect(80, GAME_HEIGHT - 80, GAME_WIDTH - 160, 80);
  g.lineBetween(GAME_WIDTH / 2, GAME_HEIGHT - 80, GAME_WIDTH / 2, GAME_HEIGHT);
  g.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT - 80, 60);

  // Grass stripes
  for (let i = 0; i < 10; i++) {
    g.fillStyle(i % 2 === 0 ? bg_cfg.pitchColor : bg_cfg.pitchStripeAlt, 0.5);
    g.fillRect(80 + i * ((GAME_WIDTH - 160) / 10), GAME_HEIGHT - 80, (GAME_WIDTH - 160) / 10, 80);
  }

  // Floor highlight line
  g.lineStyle(3, bg_cfg.floorLineColor);
  g.lineBetween(0, GAME_HEIGHT - 80, GAME_WIDTH, GAME_HEIGHT - 80);

  // Net backgrounds
  g.fillStyle(bg_cfg.netBgColor, 0.5);
  g.fillRect(0, GAME_HEIGHT - 80 - GOAL.height, 60, GOAL.height);
  g.fillRect(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, 60, GOAL.height);

  // Net grid
  g.lineStyle(1, bg_cfg.netLineColor, 0.3);
  for (let r = 0; r < GOAL.height; r += 18) {
    g.lineBetween(0, GAME_HEIGHT - 80 - GOAL.height + r, 60, GAME_HEIGHT - 80 - GOAL.height + r);
    g.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height + r, GAME_WIDTH, GAME_HEIGHT - 80 - GOAL.height + r);
  }
  for (let c = 0; c < 60; c += 18) {
    g.lineBetween(c, GAME_HEIGHT - 80 - GOAL.height, c, GAME_HEIGHT - 80);
    g.lineBetween(GAME_WIDTH - 60 + c, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH - 60 + c, GAME_HEIGHT - 80);
  }

  // Decorative goal posts (visual only — physics posts are in GameScene)
  g.lineStyle(6, 0xdddddd);
  g.lineBetween(60, GAME_HEIGHT - 80 - GOAL.height, 60, GAME_HEIGHT - 80);                         // left post
  g.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH - 60, GAME_HEIGHT - 80); // right post
  g.lineBetween(60, GAME_HEIGHT - 80 - GOAL.height, 0, GAME_HEIGHT - 80 - GOAL.height);              // left crossbar
  g.lineBetween(GAME_WIDTH - 60, GAME_HEIGHT - 80 - GOAL.height, GAME_WIDTH, GAME_HEIGHT - 80 - GOAL.height); // right crossbar
}

/**
 * Creates the static Matter.js physics bodies for arena walls and map obstacles.
 * Includes floor, ceiling, outer walls, goal-back walls, crossbars, and any
 * map-defined obstacles from mapConfig.obstacles.
 * @param {Phaser.Scene} scene
 * @param {object} mapConfig - map config object from MAPS array
 */
export function createObstacles(scene, mapConfig) {
  const w = GAME_WIDTH, h = GAME_HEIGHT;
  const thick = 40;
  const crossbarY = h - 80 - GOAL.height; // y of the top of the goal opening

  // --- Base walls (always created, physics values read from config) ---

  // Floor
  scene.matter.add.rectangle(w / 2, h - 80 + thick / 2, w, thick, {
    isStatic: true, friction: mapConfig.floorFriction,
    restitution: mapConfig.floorRestitution, label: 'floor',
  });

  // Ceiling
  scene.matter.add.rectangle(w / 2, -thick / 2, w, thick, {
    isStatic: true, restitution: 0.5, label: 'ceiling',
  });

  // Left outer wall — only ABOVE the goal opening (so ball can enter goal below)
  const leftWallH = crossbarY; // from top (y=0) down to crossbar
  scene.matter.add.rectangle(-thick / 2, leftWallH / 2, thick, leftWallH, {
    isStatic: true, restitution: 0.3, label: 'wall',
  });

  // Left goal back wall (ball bounces off back of net)
  scene.matter.add.rectangle(-thick, h - 80 - GOAL.height / 2, thick, GOAL.height, {
    isStatic: true, restitution: 0.4, label: 'goalback',
  });

  // Right outer wall — only above the goal opening
  scene.matter.add.rectangle(w + thick / 2, leftWallH / 2, thick, leftWallH, {
    isStatic: true, restitution: 0.3, label: 'wall',
  });

  // Right goal back wall
  scene.matter.add.rectangle(w + thick, h - 80 - GOAL.height / 2, thick, GOAL.height, {
    isStatic: true, restitution: 0.4, label: 'goalback',
  });

  // Left crossbar (physics — blocks shots from above)
  scene.matter.add.rectangle(31, crossbarY, 62, 10, {
    isStatic: true, restitution: 0.5, label: 'goalpost',
  });

  // Right crossbar (physics — blocks shots from above)
  scene.matter.add.rectangle(w - 31, crossbarY, 62, 10, {
    isStatic: true, restitution: 0.5, label: 'goalpost',
  });

  // --- Map-defined obstacles ---
  const g = scene.add.graphics();

  for (const obs of mapConfig.obstacles) {
    // Draw visual
    if (obs.visual) {
      g.fillStyle(obs.visual.color, obs.visual.alpha ?? 1);
      if (obs.type === 'circle') {
        g.fillCircle(obs.x, obs.y, obs.r);
      } else {
        // box / ramp / platform — all rectangular visuals
        g.fillRect(obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
      }
    }

    // Spawn physics body
    const bodyOpts = {
      isStatic: true,
      friction: obs.friction ?? 0.05,
      restitution: obs.restitution ?? 0.3,
      label: obs.label ?? 'obstacle',
    };
    if (obs.angle) bodyOpts.angle = obs.angle;

    if (obs.type === 'circle') {
      scene.matter.add.circle(obs.x, obs.y, obs.r, bodyOpts);
    } else {
      scene.matter.add.rectangle(obs.x, obs.y, obs.w, obs.h, bodyOpts);
    }
  }
}
