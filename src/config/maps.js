import { GAME_WIDTH, GAME_HEIGHT, GOAL, PHYSICS } from './constants.js';

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
      // Minaret silhouettes in crowd zone (y range: GAME_HEIGHT-80-h to GAME_HEIGHT-80)
      // Two minarets: left side and right side
      g.fillStyle(0x0d0500, 1);
      // Left minaret: tall rectangle with small rectangular cap
      g.fillRect(180, GAME_HEIGHT - 80 - 120, 20, 120);   // shaft
      g.fillRect(175, GAME_HEIGHT - 80 - 130, 30, 14);    // top band
      g.fillRect(185, GAME_HEIGHT - 80 - 145, 10, 20);    // spire

      // Right minaret: mirror
      g.fillRect(GAME_WIDTH - 200, GAME_HEIGHT - 80 - 120, 20, 120);
      g.fillRect(GAME_WIDTH - 205, GAME_HEIGHT - 80 - 130, 30, 14);
      g.fillRect(GAME_WIDTH - 195, GAME_HEIGHT - 80 - 145, 10, 20);

      // Rooftop wall silhouettes (crenellated low wall across bottom of crowd zone)
      const wallY = GAME_HEIGHT - 80 - 12;
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
        y: 590,           // center y: floor is 640, this sits with top at y=560
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
    floorFriction: 0.001,   // slippery leaves
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
      // Left tree cluster
      const trees = [
        { tx: 320, ty: GAME_HEIGHT - 80, trunkH: 200, trunkW: 18, canopyR: 55 },
        { tx: 390, ty: GAME_HEIGHT - 80, trunkH: 160, trunkW: 14, canopyR: 42 },
        { tx: 950, ty: GAME_HEIGHT - 80, trunkH: 200, trunkW: 18, canopyR: 55 },
        { tx: 1020, ty: GAME_HEIGHT - 80, trunkH: 160, trunkW: 14, canopyR: 42 },
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
        y: 520,           // tall narrow pillar: top at y=480, bottom at y=560
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
        y: 615,           // sits on floor, top at y=600
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
];

export function getMap(id) {
  const m = MAPS.find(m => m.id === id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export function getMaps() {
  return MAPS;
}
