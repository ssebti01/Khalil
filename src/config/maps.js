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
    floorFriction: 0.10,  // was 0.05 — raised for perceptible distinction from Bouskoura (0.01)
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
        restitution: 0.35, // was 0.3 — more energy returned to redirect ball toward center
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
        restitution: 0.35, // was 0.3 — matches left ramp
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
      // Left tree trunk pillar — moved inward to enter play on corner shots
      {
        type: 'box',
        x: 300,           // was 360 — closer to goal, engages more during corner plays
        y: 530,           // center y=530, h=60 → top=500, bottom=560 (80px above floor at y=640)
        w: 40,
        h: 60,
        restitution: 0.45, // was 0.3 — crisper caroms on slippery surface = strategic billiard redirects
        friction: 0.05,
        label: 'obstacle',
        visual: { color: 0x3a1f08, alpha: 1 },
      },
      // Right tree trunk pillar — mirror
      {
        type: 'box',
        x: 980,           // was 920 — symmetric inward shift
        y: 530,
        w: 40,
        h: 60,
        restitution: 0.45, // was 0.3 — matches left trunk
        friction: 0.05,
        label: 'obstacle',
        visual: { color: 0x3a1f08, alpha: 1 },
      },
      // Fallen log center — wide low bouncy platform
      {
        type: 'box',
        x: 640,
        y: 610,           // was 615 — raised 5px so ball rolls onto it more naturally
        w: 180,
        h: 30,
        restitution: 0.55, // was 0.5 — slightly more pop on slippery floor = exciting mid-field redirect
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
      // Left rooftop edge bumper — raised off floor so only aerial balls interact
      {
        type: 'circle',
        x: 220, y: 570,  // was x=200,y=600 — inset 20px, raised 30px off floor plane
        r: 20,
        restitution: 0.50, // was 0.7 — reduces accidental goal deflections
        friction: 0.1,
        label: 'bumper_left',
        visual: { color: 0xcc4400, alpha: 0 },
      },
      // Right rooftop edge bumper — mirrored
      {
        type: 'circle',
        x: 1060, y: 570, // was x=1080,y=600 — symmetric inset + raise
        r: 20,
        restitution: 0.50, // was 0.7
        friction: 0.1,
        label: 'bumper_right',
        visual: { color: 0xcc4400, alpha: 0 },
      },
    ],
    specialZones: [],
  },
  // ── CHICAGO ──────────────────────────────────────────────────────────────────
  {
    id: 'chicago',
    name: 'Chicago \u2014 Lakefront Park',
    floorRestitution: 0.2,
    floorFriction: 0.3,
    // x=350 → adds ~1.3 px/frame per 500ms gust (was x=3 → 0.01 px/frame, imperceptible)
    // reverses:true → direction alternates each interval, preventing permanent P1-goal bias
    windForce: { x: 350, y: 0, intervalMs: 5000, reverses: true },
    background: (scene) => {
      const bg = scene.add.graphics();

      // Sky: teal to deep blue lake gradient
      bg.fillGradientStyle(0x001a33, 0x001a33, 0x003366, 0x003366, 1);
      bg.fillRect(0, 0, 1280, 720);

      // Lake shimmer band near horizon
      bg.fillStyle(0x004488, 0.35);
      bg.fillRect(0, 480, 1280, 160);

      // Chicago skyline silhouettes in crowd zone
      bg.fillStyle(0x001122, 1);
      const chiBuildings = [
        [30, 45, 80], [88, 30, 60], [130, 55, 100], [200, 28, 55],
        [240, 40, 75],
        // Willis Tower
        [490, 60, 160],
        [490, 20, 190],
        // Right skyline
        [1000, 40, 75], [1055, 28, 55], [1100, 55, 100],
        [1170, 30, 60], [1215, 45, 80],
      ];
      chiBuildings.forEach(([bx, bw, bh]) => {
        bg.fillRect(bx, 640 - bh, bw, bh);
      });
      // Willis Tower twin antennas
      bg.fillRect(500, 640 - 190 - 30, 4, 30);
      bg.fillRect(536, 640 - 190 - 22, 4, 22);

      // Sailboats in crowd zone (simple triangle sails)
      bg.fillStyle(0xeeeeff, 0.7);
      // Boat 1 (left)
      bg.fillTriangle(170, 638, 185, 590, 200, 638);
      bg.fillRect(178, 630, 26, 4);
      // Boat 2 (right)
      bg.fillTriangle(1080, 638, 1095, 595, 1110, 638);
      bg.fillRect(1088, 630, 26, 4);

      // Green park grass pitch
      bg.fillStyle(0x2d6a2d, 1);
      bg.fillRect(0, 640, 1280, 80);

      // Pitch markings (park style — lighter green)
      bg.lineStyle(1, 0x44aa44, 0.5);
      bg.lineBetween(640, 640, 640, 720);
      bg.strokeCircle(640, 640, 55);

      // Goal net backgrounds
      bg.fillStyle(0x00080f, 0.65);
      bg.fillRect(0, 450, 60, 190);
      bg.fillRect(1220, 450, 60, 190);

      // Net grid
      bg.lineStyle(1, 0x44bbcc, 0.25);
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

      // Park bench visual (x 530–750, y 590–615)
      bg.fillStyle(0x8b5e3c, 1);
      bg.fillRect(530, 595, 220, 12);
      bg.fillRect(535, 590, 12, 22);
      bg.fillRect(703, 590, 12, 22);
      bg.fillRect(530, 590, 220, 6);

      // Lamp post left visual (x=300, y 490–620, thin)
      bg.fillStyle(0x7a8899, 1);
      bg.fillRect(296, 490, 8, 130);
      bg.fillRect(286, 486, 28, 8);
      bg.fillStyle(0xffffaa, 0.6);
      bg.fillRect(289, 490, 20, 5);

      // Lamp post right visual (x=980)
      bg.fillStyle(0x7a8899, 1);
      bg.fillRect(976, 490, 8, 130);
      bg.fillRect(966, 486, 28, 8);
      bg.fillStyle(0xffffaa, 0.6);
      bg.fillRect(969, 490, 20, 5);
    },
    obstacles: [
      // Park bench — wide low platform
      {
        type: 'box',
        x: 640, y: 598,  // was y=602 — raised 4px so ball rolls onto surface cleanly
        w: 220, h: 18,
        angle: 0,
        restitution: 0.3, // was 0.2 — slight kick off bench rather than dead stop
        friction: 0.5,
        label: 'bench',
        visual: { color: 0x8b5e3c, alpha: 0 },
      },
      // Lamp posts are purely decorative — no physics bodies to avoid invisible trapping
    ],
    specialZones: [],
  },

  // ── HOUSTON ───────────────────────────────────────────────────────────────────
  {
    id: 'houston',
    name: 'Houston \u2014 Rodeo Arena',
    floorRestitution: 0.32,  // was 0.45 — reduced 2.25× bounce to 1.6× vs standard; still distinctly bouncy
    floorFriction: 0.25,
    windForce: null,
    background: (scene) => {
      const bg = scene.add.graphics();

      // Sky: deep burnt orange Texas sunset
      bg.fillGradientStyle(0x3d1a00, 0x3d1a00, 0xff6600, 0xff6600, 1);
      bg.fillRect(0, 0, 1280, 560);
      bg.fillGradientStyle(0xff6600, 0xff6600, 0xffaa00, 0xffaa00, 1);
      bg.fillRect(0, 440, 1280, 200);

      // Silhouettes in crowd zone
      bg.fillStyle(0x1a0800, 1);

      // Oil pump jack (left side, x~160)
      bg.fillRect(130, 625, 60, 15);
      bg.fillRect(155, 560, 10, 65);
      bg.fillRect(145, 558, 40, 6);
      bg.fillRect(183, 558, 6, 30);
      bg.fillRect(130, 555, 28, 8);

      // Cactus (center-left, x~380)
      bg.fillRect(373, 580, 14, 55);
      bg.fillRect(355, 598, 20, 8);
      bg.fillRect(340, 592, 8, 20);
      bg.fillRect(393, 603, 20, 8);
      bg.fillRect(405, 597, 8, 16);

      // Barn shape (right edge, x~1080)
      bg.fillRect(1070, 590, 120, 50);
      bg.fillTriangle(1060, 590, 1130, 555, 1200, 590);

      // Cactus right (x~900)
      bg.fillRect(893, 585, 14, 50);
      bg.fillRect(877, 600, 18, 8);
      bg.fillRect(863, 594, 8, 18);
      bg.fillRect(911, 605, 18, 8);
      bg.fillRect(921, 599, 8, 14);

      // Dirt/sand pitch
      bg.fillStyle(0xc8a060, 1);
      bg.fillRect(0, 640, 1280, 80);

      // Subtle dirt texture lines
      bg.lineStyle(1, 0xaa8840, 0.4);
      bg.lineBetween(640, 640, 640, 720);
      bg.strokeCircle(640, 640, 55);

      // Goal net backgrounds
      bg.fillStyle(0x1a0800, 0.6);
      bg.fillRect(0, 450, 60, 190);
      bg.fillRect(1220, 450, 60, 190);

      // Net grid
      bg.lineStyle(1, 0xdd8833, 0.25);
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

      // Barrel bumper visuals (circles with wood grain rings)
      bg.fillStyle(0x8b5e20, 1);
      bg.fillCircle(420, 595, 22);
      bg.lineStyle(2, 0x6b3e10, 0.8);
      bg.strokeCircle(420, 595, 16);
      bg.strokeCircle(420, 595, 8);

      bg.fillStyle(0x8b5e20, 1);
      bg.fillCircle(860, 595, 22);
      bg.lineStyle(2, 0x6b3e10, 0.8);
      bg.strokeCircle(860, 595, 16);
      bg.strokeCircle(860, 595, 8);

      // Launch ramp visual
      bg.fillStyle(0x997744, 0.9);
      bg.fillTriangle(560, 620, 720, 620, 720, 575);
      bg.fillTriangle(560, 620, 560, 610, 720, 575);
      bg.lineStyle(2, 0x775522, 0.9);
      bg.lineBetween(560, 620, 720, 575);
    },
    obstacles: [
      // Barrel bumper left — bouncy circle (primary "wow" element)
      {
        type: 'circle',
        x: 420, y: 595,
        r: 22,
        restitution: 0.70, // was 0.8 — reduced to prevent stacked chaos with bouncier floor
        friction: 0.1,
        label: 'barrel_left',
        visual: { color: 0x8b5e20, alpha: 0 },
      },
      // Barrel bumper right — mirrored
      {
        type: 'circle',
        x: 860, y: 595,
        r: 22,
        restitution: 0.70, // was 0.8
        friction: 0.1,
        label: 'barrel_right',
        visual: { color: 0x8b5e20, alpha: 0 },
      },
      // Launch ramp — sits flush on the floor so ball can't wedge underneath
      // center y = floor(640) - h/2(10) = 630; bottom edge = 640, top edge = 620
      // Ball (r=20) rolls over the 20px-tall bump cleanly with no trapping gap
      {
        type: 'box',
        x: 640, y: 630,
        w: 160, h: 20,
        angle: 0,
        restitution: 0.4,
        friction: 0.2,
        label: 'ramp',
        visual: { color: 0x997744, alpha: 0 },
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
      // Fire hydrant left — bouncy circle deflector (P1 side)
      {
        type: 'circle',
        x: 400, y: 620,
        r: 18,
        restitution: 0.6,
        friction: 0.2,
        label: 'hydrant_left',
        visual: { color: 0xcc1111, alpha: 0 },
      },
      // Yellow taxi barrier left — wide low box (was right-only, now mirrored for fairness)
      // x=445 mirrors x=835: 1280-835=445
      {
        type: 'box',
        x: 445, y: 600,
        w: 170, h: 40,
        angle: 0,
        restitution: 0.3,
        friction: 0.4,
        label: 'taxi_left',
        visual: { color: 0xffcc00, alpha: 0 },
      },
      // Yellow taxi barrier right — original position kept
      {
        type: 'box',
        x: 835, y: 600,
        w: 170, h: 40,
        angle: 0,
        restitution: 0.3,
        friction: 0.4,
        label: 'taxi_right',
        visual: { color: 0xffcc00, alpha: 0 },
      },
      // Fire hydrant right — mirror of left (x=1280-400=880)
      {
        type: 'circle',
        x: 880, y: 620,
        r: 18,
        restitution: 0.6,
        friction: 0.2,
        label: 'hydrant_right',
        visual: { color: 0xcc1111, alpha: 0 },
      },
      // Street lamp post is purely decorative — no physics body to avoid invisible center trapping
    ],
    specialZones: [
      // Subway grate trampoline — center pitch, launches ball upward
      // impulseY=-14 (was -18): peak height 49px, still clears players, less deterministic
      {
        type: 'trampoline',
        x: 560, y: 630,
        w: 160, h: 10,
        impulseY: -14,
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
