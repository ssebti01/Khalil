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
];

export function getMap(id) {
  const m = MAPS.find(m => m.id === id);
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export function getMaps() {
  return MAPS;
}
