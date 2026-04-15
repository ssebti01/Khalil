// Character roster — add new characters here
// headImage: key loaded in BootScene, displayed as the player sprite
export const CHARACTERS = [
  {
    id: 'khalil',
    name: 'Khalil',
    headImage: 'head_khalil',
    color: 0xff4400,
    accentColor: 0xffaa00,
    emoji: '🔥',
    stats: { speed: 1.0, jump: 1.0, power: 1.3 },
    ability: {
      name: 'Fireball',
      description: 'Launches a flaming shot that blasts the ball toward the goal',
      color: 0xff6600,
    },
  },
  {
    id: 'beboush',
    name: 'Beboush',
    headImage: 'head_beboush',
    color: 0x00aaff,
    accentColor: 0xaaeeff,
    emoji: '❄️',
    stats: { speed: 0.85, jump: 1.15, power: 1.1 },
    ability: {
      name: 'Freeze',
      description: 'Freezes the opponent in place for 1.2 seconds',
      color: 0x88ddff,
    },
  },
  {
    id: 'lilya',
    name: 'Lilya',
    headImage: 'head_lilya',
    color: 0xffee00,
    accentColor: 0xffffff,
    emoji: '⚡',
    stats: { speed: 1.3, jump: 0.9, power: 0.8 },
    ability: {
      name: 'Thunder Rush',
      description: 'Lightning dash — crosses the field in a flash',
      color: 0xffff44,
    },
  },
  {
    id: 'fafa',
    name: 'Fafa',
    headImage: 'head_fafa',
    color: 0x8800cc,
    accentColor: 0xaa00ff,
    emoji: '🥷',
    stats: { speed: 1.25, jump: 1.1, power: 0.7 },
    ability: {
      name: 'Teleport',
      description: 'Teleports to the ball instantly — but needs a moment to strike',
      color: 0xcc44ff,
    },
  },
  {
    id: 'sara',
    name: 'Sara',
    headImage: 'head_sara',
    color: 0xcc6600,
    accentColor: 0xffaa44,
    emoji: '👶',
    stats: { speed: 1.0, jump: 1.5, power: 0.9 },
    ability: {
      name: 'Super Bounce',
      description: 'Rockets straight up and launches the ball skyward at the apex',
      color: 0xffcc44,
    },
  },
];

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}
