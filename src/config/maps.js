import { GAME_WIDTH, GAME_HEIGHT, GOAL, PLAYER } from './constants.js';

export const MAPS = [
  {
    id: 'stadium',
    name: 'Stadium',
    floorRestitution: 0.2,
    floorFriction: 0.3,
    background: {
      type: 'gradient',
      skyColors: [0x0d1b2a, 0x1b3a6b],   // top-left, bottom-right for fillGradientStyle
      pitchColor: 0x2d7a3a,
      pitchStripeAlt: 0x347a42,
      crowdColor: 0x0a1520,
      netBgColor: 0x001a33,
      netLineColor: 0xaaccff,
      floorLineColor: 0x3a9a4a,
      markingColor: 0x3a9a4a,
    },
    obstacles: [],
    windForce: null,
    specialZones: [],
  },
  {
    id: 'rabat',
    name: 'Rabat',
    floorRestitution: 0.2,
    floorFriction: 0.05,
    background: {
      type: 'gradient',
      skyColors: [0x1a0a00, 0x3d1a00],
      pitchColor: 0x8b4513,
      pitchStripeAlt: 0x7a3a10,
      crowdColor: 0x150800,
      netBgColor: 0x200800,
      netLineColor: 0xffaa66,
      floorLineColor: 0xaa6633,
      markingColor: 0xaa6633,
    },
    decoration: (scene, g) => {
      // Minaret silhouettes in crowd zone — PLAYER.groundY is the floor Y (GAME_HEIGHT - 80)
      // Two minarets: left side and right side
      g.fillStyle(0x0d0500, 1);
      // Left minaret: tall rectangle with small rectangular cap
      g.fillRect(180, PLAYER.groundY - 120, 20, 120);   // shaft
      g.fillRect(175, PLAYER.groundY - 130, 30, 14);    // top band
      g.fillRect(185, PLAYER.groundY - 145, 10, 20);    // spire

      // Right minaret: mirror
      g.fillRect(GAME_WIDTH - 200, PLAYER.groundY - 120, 20, 120);
      g.fillRect(GAME_WIDTH - 205, PLAYER.groundY - 130, 30, 14);
      g.fillRect(GAME_WIDTH - 195, PLAYER.groundY - 145, 10, 20);

      // Rooftop wall: crenellated low wall across bottom of crowd zone
      // 28 = floor((GAME_WIDTH - 80) / 40) steps of 40px starting at x=80
      const wallY = PLAYER.groundY - 12;
      for (let i = 0; i < 28; i++) {
        const bx = 80 + i * 40;
        const bh = i % 2 === 0 ? 20 : 12;
        g.fillRect(bx, wallY - bh, 32, bh);
      }
    },
    obstacles: [
      // Center divider wall — low brick wall at midfield
      {
        type: 'box',
        x: 640,
        y: 590,           // center y=590, h=60 → bottom=620 (20px above floor at y=640)
        w: 80,
        h: 60,
        restitution: 0.4,
        friction: 0.05,
        label: 'obstacle',
        visual: { color: 0x6b3010, alpha: 1 },
      },
      // Left flank ramp — thin angled platform near left goal
      {
        type: 'ramp',
        x: 220,
        y: 590,
        w: 140,
        h: 18,
        angle: -0.18,     // ~10 degrees, slopes upward toward center
        restitution: 0.3,
        friction: 0.04,
        label: 'obstacle',
        visual: { color: 0x5a2808, alpha: 1 },
      },
      // Right flank ramp — mirror of left
      {
        type: 'ramp',
        x: 1060,
        y: 590,
        w: 140,
        h: 18,
        angle: 0.18,      // slopes upward toward center (mirrored)
        restitution: 0.3,
        friction: 0.04,
        label: 'obstacle',
        visual: { color: 0x5a2808, alpha: 1 },
      },
    ],
    windForce: null,
    specialZones: [],
  },
  {
    id: 'bouskoura',
    name: 'Bouskoura Forest',
    floorRestitution: 0.2,
    floorFriction: 0.01,    // slippery leaves — 0.001 caused degenerate CPU physics
    background: {
      type: 'gradient',
      skyColors: [0x0a1a05, 0x1a3a0a],
      pitchColor: 0x2a5a1a,
      pitchStripeAlt: 0x235215,
      crowdColor: 0x071204,
      netBgColor: 0x081505,
      netLineColor: 0x88cc66,
      floorLineColor: 0x44aa22,
      markingColor: 0x44aa22,
    },
    decoration: (scene, g) => {
      g.fillStyle(0x050e02, 1);
      // Tree silhouettes: trunk (rectangle) + canopy (circle)
      // PLAYER.groundY is the floor Y (GAME_HEIGHT - 80)
      const trees = [
        { tx: 320, ty: PLAYER.groundY, trunkH: 200, trunkW: 18, canopyR: 55 },
        { tx: 390, ty: PLAYER.groundY, trunkH: 160, trunkW: 14, canopyR: 42 },
        { tx: 950, ty: PLAYER.groundY, trunkH: 200, trunkW: 18, canopyR: 55 },
        { tx: 1020, ty: PLAYER.groundY, trunkH: 160, trunkW: 14, canopyR: 42 },
      ];
      for (const t of trees) {
        // Trunk
        g.fillRect(t.tx - t.trunkW / 2, t.ty - t.trunkH, t.trunkW, t.trunkH);
        // Canopy circle
        g.fillCircle(t.tx, t.ty - t.trunkH, t.canopyR);
      }
    },
    obstacles: [
      // Left tree trunk pillar (playable obstacle, not purely decorative)
      {
        type: 'box',
        x: 360,
        y: 520,           // center y=520, h=80 → top=480, bottom=560 (80px above floor at y=640)
        w: 28,
        h: 80,
        restitution: 0.3,
        friction: 0.05,
        label: 'obstacle',
        visual: { color: 0x3a1f08, alpha: 1 },
      },
      // Right tree trunk pillar — mirror
      {
        type: 'box',
        x: 920,
        y: 520,
        w: 28,
        h: 80,
        restitution: 0.3,
        friction: 0.05,
        label: 'obstacle',
        visual: { color: 0x3a1f08, alpha: 1 },
      },
      // Fallen log center — wide low bouncy platform
      {
        type: 'box',
        x: 640,
        y: 615,           // center y=615, h=30 → top=600, bottom=630 (10px above floor at y=640)
        w: 180,
        h: 30,
        restitution: 0.5, // bouncy
        friction: 0.02,
        label: 'obstacle',
        visual: { color: 0x5c3317, alpha: 1 },
      },
    ],
    windForce: null,
    specialZones: [],
  },
  {
    id: 'shanghai',
    name: 'Shanghai \u2014 Skyscraper Rooftop',
    floorRestitution: 0.2,
    floorFriction: 0.3,
    windForce: null,
    background: (scene) => {
      const bg = scene.add.graphics();

      // Sky: deep purple to magenta sunset gradient
      bg.fillGradientStyle(0x1a0033, 0x1a0033, 0x4a0066, 0x4a0066, 1);
      bg.fillRect(0, 0, 1280, 720);

      // Horizon glow: warm orange band near floor line
      bg.fillGradientStyle(0xff6600, 0xff6600, 0x4a0066, 0x4a0066, 0.55);
      bg.fillRect(0, 460, 1280, 200);

      // Shanghai skyline silhouettes in crowd zone (y 560–640)
      bg.fillStyle(0x0d0022, 1);
      const buildings = [
        [40, 38, 90], [100, 28, 70], [150, 45, 110], [220, 30, 80],
        [270, 52, 130], [345, 28, 65], [400, 35, 95],
        [820, 35, 95], [875, 52, 130], [950, 30, 80],
        [1000, 45, 110], [1070, 28, 70], [1120, 38, 90], [1180, 32, 75],
      ];
      buildings.forEach(([bx, bw, bh]) => {
        bg.fillRect(bx, 640 - bh, bw, bh);
        bg.fillRect(bx + bw / 2 - 2, 640 - bh - 20, 4, 20);
      });

      // Concrete rooftop pitch
      bg.fillStyle(0x555566, 1);
      bg.fillRect(0, 640, 1280, 80);

      // Subtle pitch line markings
      bg.lineStyle(1, 0x7777aa, 0.4);
      bg.lineBetween(640, 640, 640, 720);
      bg.strokeCircle(640, 640, 55);

      // Goal net backgrounds
      bg.fillStyle(0x0a0020, 0.6);
      bg.fillRect(0, 450, 60, 190);
      bg.fillRect(1220, 450, 60, 190);

      // Net grid
      bg.lineStyle(1, 0xcc88ff, 0.25);
      for (let r = 0; r < 190; r += 18) {
        bg.lineBetween(0, 450 + r, 60, 450 + r);
        bg.lineBetween(1220, 450 + r, 1280, 450 + r);
      }
      for (let c = 0; c < 60; c += 18) {
        bg.lineBetween(c, 450, c, 640);
        bg.lineBetween(1220 + c, 450, 1220 + c, 640);
      }

      // Goal posts
      bg.lineStyle(6, 0xdddddd, 1);
      bg.lineBetween(60, 450, 60, 640);
      bg.lineBetween(1220, 450, 1220, 640);
      bg.lineBetween(0, 450, 60, 450);
      bg.lineBetween(1220, 450, 1280, 450);

      // Bamboo scaffold visuals
      bg.fillStyle(0x99cc22, 0.85);
      bg.fillRect(420, 504, 130, 14);
      bg.fillRect(418, 500, 8, 22);
      bg.fillRect(544, 500, 8, 22);
      bg.lineStyle(1, 0x668800, 0.7);
      bg.lineBetween(420, 510, 550, 506);

      bg.fillStyle(0x99cc22, 0.85);
      bg.fillRect(730, 504, 130, 14);
      bg.fillRect(728, 500, 8, 22);
      bg.fillRect(854, 500, 8, 22);
      bg.lineStyle(1, 0x668800, 0.7);
      bg.lineBetween(730, 506, 860, 510);

      // Edge bumper visuals
      bg.fillStyle(0xcc4400, 0.9);
      bg.fillCircle(200, 600, 20);
      bg.fillStyle(0xff6622, 0.6);
      bg.fillCircle(200, 600, 13);

      bg.fillStyle(0xcc4400, 0.9);
      bg.fillCircle(1080, 600, 20);
      bg.fillStyle(0xff6622, 0.6);
      bg.fillCircle(1080, 600, 13);
    },
    obstacles: [
      // Left bamboo scaffold platform — angled box (~5 deg tilt = 0.0873 rad)
      {
        type: 'box',
        x: 485, y: 510,
        w: 130, h: 12,
        angle: 0.0873,
        restitution: 0.3,
        friction: 0.4,
        label: 'scaffold_left',
        visual: { color: 0x99cc22, alpha: 0 },
      },
      // Right bamboo scaffold platform — mirrored (~-5 deg = -0.0873 rad)
      {
        type: 'box',
        x: 795, y: 510,
        w: 130, h: 12,
        angle: -0.0873,
        restitution: 0.3,
        friction: 0.4,
        label: 'scaffold_right',
        visual: { color: 0x99cc22, alpha: 0 },
      },
      // Left rooftop edge bumper — bouncy circle
      {
        type: 'circle',
        x: 200, y: 600,
        r: 20,
        restitution: 0.7,
        friction: 0.1,
        label: 'bumper_left',
        visual: { color: 0xcc4400, alpha: 0 },
      },
      // Right rooftop edge bumper — mirrored
      {
        type: 'circle',
        x: 1080, y: 600,
        r: 20,
        restitution: 0.7,
        friction: 0.1,
        label: 'bumper_right',
        visual: { color: 0xcc4400, alpha: 0 },
      },
    ],
    specialZones: [],
  },
  {
    id: 'nyc',
    name: 'New York City \u2014 Street Court',
    floorRestitution: 0.2,
    floorFriction: 0.35,
    windForce: null,
    background: (scene) => {
      const bg = scene.add.graphics();

      // Sky: deep blue twilight gradient
      bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
      bg.fillRect(0, 0, 1280, 720);

      // NYC building silhouettes in crowd zone
      bg.fillStyle(0x0a0a1a, 1);
      const nycBuildings = [
        [30, 55, 100], [95, 30, 75], [140, 60, 120], [215, 25, 60],
        [255, 40, 85], [310, 65, 140], [390, 28, 70], [435, 35, 90],
        [800, 35, 90], [850, 28, 70], [895, 65, 140], [975, 40, 85],
        [1030, 25, 60], [1075, 60, 120], [1150, 30, 75], [1195, 55, 100],
      ];
      nycBuildings.forEach(([bx, bw, bh]) => {
        bg.fillRect(bx, 640 - bh, bw, bh);
        if (bh > 90) {
          bg.fillStyle(0xffee88, 0.5);
          for (let wy = 640 - bh + 10; wy < 635; wy += 18) {
            for (let wx = bx + 6; wx < bx + bw - 6; wx += 12) {
              if (Math.abs((wx + wy) % 7) > 2) bg.fillRect(wx, wy, 5, 7);
            }
          }
          bg.fillStyle(0x0a0a1a, 1);
        }
      });

      // Yellow taxis in crowd zone
      bg.fillStyle(0xffcc00, 1);
      bg.fillRect(510, 610, 60, 24);
      bg.fillRect(515, 604, 40, 10);
      bg.fillStyle(0x222222, 1);
      bg.fillCircle(518, 634, 6);
      bg.fillCircle(562, 634, 6);
      bg.fillStyle(0xffcc00, 1);
      bg.fillRect(710, 610, 60, 24);
      bg.fillRect(715, 604, 40, 10);
      bg.fillStyle(0x222222, 1);
      bg.fillCircle(718, 634, 6);
      bg.fillCircle(762, 634, 6);

      // Asphalt pitch
      bg.fillStyle(0x2a2a2a, 1);
      bg.fillRect(0, 640, 1280, 80);

      // Faded basketball court lines
      bg.lineStyle(2, 0xff6600, 0.35);
      bg.strokeRect(120, 640, 380, 78);
      bg.strokeRect(780, 640, 380, 78);
      bg.strokeCircle(640, 640, 70);

      // Goal net backgrounds
      bg.fillStyle(0x050510, 0.7);
      bg.fillRect(0, 450, 60, 190);
      bg.fillRect(1220, 450, 60, 190);

      // Net grid
      bg.lineStyle(1, 0x8899ff, 0.2);
      for (let r = 0; r < 190; r += 18) {
        bg.lineBetween(0, 450 + r, 60, 450 + r);
        bg.lineBetween(1220, 450 + r, 1280, 450 + r);
      }
      for (let c = 0; c < 60; c += 18) {
        bg.lineBetween(c, 450, c, 640);
        bg.lineBetween(1220 + c, 450, 1220 + c, 640);
      }

      // Goal posts
      bg.lineStyle(6, 0xdddddd, 1);
      bg.lineBetween(60, 450, 60, 640);
      bg.lineBetween(1220, 450, 1220, 640);
      bg.lineBetween(0, 450, 60, 450);
      bg.lineBetween(1220, 450, 1280, 450);

      // Fire hydrant visual
      bg.fillStyle(0xcc1111, 1);
      bg.fillCircle(400, 620, 18);
      bg.fillStyle(0xff3333, 0.6);
      bg.fillCircle(400, 615, 10);

      // Yellow taxi barrier
      bg.fillStyle(0xffcc00, 1);
      bg.fillRect(750, 580, 170, 40);
      bg.fillStyle(0x222222, 1);
      bg.fillCircle(770, 622, 9);
      bg.fillCircle(900, 622, 9);
      bg.fillStyle(0xffee44, 0.8);
      bg.fillRect(755, 585, 160, 10);

      // Street lamp post
      bg.fillStyle(0x888899, 1);
      bg.fillRect(635, 480, 10, 160);
      bg.fillRect(625, 476, 30, 8);
      bg.fillStyle(0xffffaa, 0.7);
      bg.fillRect(628, 480, 24, 5);

      // Subway grate visual
      bg.fillStyle(0x333344, 1);
      bg.fillRect(560, 630, 160, 10);
      bg.lineStyle(1, 0x555566, 0.9);
      for (let gx = 560; gx < 720; gx += 16) {
        bg.lineBetween(gx, 630, gx, 640);
      }
      bg.lineStyle(1, 0x555566, 0.6);
      bg.lineBetween(560, 635, 720, 635);
    },
    obstacles: [
      // Fire hydrant — bouncy circle deflector
      {
        type: 'circle',
        x: 400, y: 620,
        r: 18,
        restitution: 0.6,
        friction: 0.2,
        label: 'hydrant',
        visual: { color: 0xcc1111, alpha: 0 },
      },
      // Yellow taxi barrier — wide low box
      {
        type: 'box',
        x: 835, y: 600,
        w: 170, h: 40,
        angle: 0,
        restitution: 0.3,
        friction: 0.4,
        label: 'taxi',
        visual: { color: 0xffcc00, alpha: 0 },
      },
      // Street lamp post — thin tall box (dead center)
      {
        type: 'box',
        x: 640, y: 560,
        w: 10, h: 160,
        angle: 0,
        restitution: 0.2,
        friction: 0.5,
        label: 'lamppost',
        visual: { color: 0x888899, alpha: 0 },
      },
    ],
    specialZones: [
      // Subway grate trampoline — center pitch, impulse ball upward
      {
        type: 'trampoline',
        x: 560, y: 630,
        w: 160, h: 10,
        impulseY: -18,
      },
    ],
  },
];

export function getMap(id) {
  const m = MAPS.find(m => m.id === id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export function getMaps() {
  return MAPS;
}
