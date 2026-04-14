// Character roster — add new characters here
// headImage: key loaded in BootScene, displayed as the player sprite
export const CHARACTERS = [
  {
    id: 'fire',
    name: 'Blaze',
    headImage: 'head_blaze',
    color: 0xff4400,
    accentColor: 0xffaa00,
    emoji: '🔥',
    stats: { speed: 1.0, jump: 1.0, power: 1.2 },
    ability: {
      name: 'Fireball',
      description: 'Launches a flaming ball that burns through defenses',
      color: 0xff6600,
    },
  },
  {
    id: 'ice',
    name: 'Frost',
    headImage: 'head_frost',
    color: 0x00aaff,
    accentColor: 0xaaeeff,
    emoji: '❄️',
    stats: { speed: 0.9, jump: 1.1, power: 0.9 },
    ability: {
      name: 'Freeze',
      description: 'Freezes the opponent in place for 2 seconds',
      color: 0x88ddff,
    },
  },
  {
    id: 'thunder',
    name: 'Bolt',
    headImage: 'head_bolt',
    color: 0xffee00,
    accentColor: 0xffffff,
    emoji: '⚡',
    stats: { speed: 1.2, jump: 0.9, power: 1.0 },
    ability: {
      name: 'Thunder Rush',
      description: 'Dashes across the field at lightning speed',
      color: 0xffff44,
    },
  },
  {
    id: 'ninja',
    name: 'Shadow',
    headImage: 'head_shadow',
    color: 0x8800cc,
    accentColor: 0xaa00ff,
    emoji: '🥷',
    stats: { speed: 1.3, jump: 1.2, power: 0.8 },
    ability: {
      name: 'Teleport',
      description: 'Teleports to the ball instantly',
      color: 0xcc44ff,
    },
  },
  {
    id: 'tiny',
    name: 'Tiny',
    headImage: 'head_tiny',
    color: 0xcc6600,
    accentColor: 0xffaa44,
    emoji: '👶',
    stats: { speed: 1.1, jump: 1.4, power: 0.7 },
    ability: {
      name: 'Super Bounce',
      description: 'Launches straight up and slams the ball down hard',
      color: 0xffcc44,
    },
  },
];

export function getCharacter(id) {
  return CHARACTERS.find(c => c.id === id) ?? CHARACTERS[0];
}
