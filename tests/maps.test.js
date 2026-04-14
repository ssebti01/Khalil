import { describe, it, expect } from 'vitest';
import { MAPS, getMap, getMaps } from '../src/config/maps.js';

describe('maps config', () => {
  it('MAPS array has exactly 7 entries in the correct order', () => {
    expect(MAPS).toHaveLength(7);
    expect(MAPS[0].id).toBe('stadium');
    expect(MAPS[1].id).toBe('rabat');
    expect(MAPS[2].id).toBe('bouskoura');
    expect(MAPS[3].id).toBe('shanghai');
    expect(MAPS[4].id).toBe('chicago');
    expect(MAPS[5].id).toBe('houston');
    expect(MAPS[6].id).toBe('nyc');
  });

  it('getMaps() returns all 7 maps', () => {
    expect(getMaps()).toHaveLength(7);
  });

  it('getMap() retrieves by id', () => {
    expect(getMap('stadium').name).toBe('Stadium');
    expect(getMap('rabat').name).toBe('Rabat');
    expect(getMap('bouskoura').name).toBe('Bouskoura Forest');
  });

  it('getMap() throws for unknown id', () => {
    expect(() => getMap('atlantis')).toThrow('Unknown map: atlantis');
  });

  describe('Rabat map', () => {
    const rabat = getMap('rabat');

    it('has exactly 3 obstacles', () => {
      expect(rabat.obstacles).toHaveLength(3);
    });

    it('has terracotta background colors', () => {
      expect(rabat.background.pitchColor).toBe(0x8b4513);
    });

    it('has expected floor physics', () => {
      expect(rabat.floorFriction).toBe(0.05);
      expect(rabat.floorRestitution).toBe(0.2);
    });

    it('windForce is null and specialZones is empty', () => {
      expect(rabat.windForce).toBeNull();
      expect(rabat.specialZones).toEqual([]);
    });

    it('all obstacles have label "obstacle" and a visual object', () => {
      rabat.obstacles.forEach(obs => {
        expect(obs.label).toBe('obstacle');
        expect(obs.visual).toBeDefined();
        expect(typeof obs.visual.color).toBe('number');
      });
    });

    it('has a decoration function', () => {
      expect(typeof rabat.decoration).toBe('function');
    });

    it('decoration draws exactly 34 fillRects: 6 minaret + 28 crenellations', () => {
      const calls = [];
      const g = {
        fillStyle: (...args) => calls.push(['fillStyle', ...args]),
        fillRect: (...args) => calls.push(['fillRect', ...args]),
      };
      rabat.decoration(null, g);
      expect(calls.some(c => c[0] === 'fillStyle')).toBe(true);
      // 3 rects per minaret × 2 minarets = 6, plus 28 crenellation rects
      expect(calls.filter(c => c[0] === 'fillRect').length).toBe(34);
    });
  });

  describe('Bouskoura Forest map', () => {
    const bouskoura = getMap('bouskoura');

    it('has exactly 3 obstacles', () => {
      expect(bouskoura.obstacles).toHaveLength(3);
    });

    it('has slippery floor (floorFriction 0.01)', () => {
      expect(bouskoura.floorFriction).toBe(0.01);
    });

    it('windForce is null and specialZones is empty', () => {
      expect(bouskoura.windForce).toBeNull();
      expect(bouskoura.specialZones).toEqual([]);
    });

    it('fallen log has restitution 0.5 (bouncy)', () => {
      const log = bouskoura.obstacles.find(o => o.w === 180);
      expect(log).toBeDefined();
      expect(log.restitution).toBe(0.5);
    });

    it('all obstacles have label "obstacle" and a visual object', () => {
      bouskoura.obstacles.forEach(obs => {
        expect(obs.label).toBe('obstacle');
        expect(obs.visual).toBeDefined();
        expect(typeof obs.visual.color).toBe('number');
      });
    });

    it('decoration draws exactly 4 tree trunks (fillRect) and 4 canopies (fillCircle)', () => {
      const calls = [];
      const g = {
        fillStyle: (...args) => calls.push(['fillStyle', ...args]),
        fillRect: (...args) => calls.push(['fillRect', ...args]),
        fillCircle: (...args) => calls.push(['fillCircle', ...args]),
      };
      bouskoura.decoration(null, g);
      expect(calls.filter(c => c[0] === 'fillRect').length).toBe(4);
      expect(calls.filter(c => c[0] === 'fillCircle').length).toBe(4);
    });
  });

  describe('Stadium map (regression)', () => {
    const stadium = getMap('stadium');

    it('has no obstacles (existing behavior unaffected)', () => {
      expect(stadium.obstacles).toHaveLength(0);
    });

    it('has no decoration function', () => {
      expect(stadium.decoration).toBeUndefined();
    });
  });

  describe('Shanghai map', () => {
    const shanghai = getMap('shanghai');

    it('has exactly 4 obstacles', () => {
      expect(shanghai.obstacles).toHaveLength(4);
    });

    it('has function-based background', () => {
      expect(typeof shanghai.background).toBe('function');
    });

    it('has empty specialZones', () => {
      expect(shanghai.specialZones).toEqual([]);
    });

    it('has expected floor physics', () => {
      expect(shanghai.floorFriction).toBe(0.3);
      expect(shanghai.floorRestitution).toBe(0.2);
    });

    it('windForce is null', () => {
      expect(shanghai.windForce).toBeNull();
    });

    it('has two scaffold platforms and two bumper circles', () => {
      const scaffolds = shanghai.obstacles.filter(o => o.label.startsWith('scaffold'));
      const bumpers = shanghai.obstacles.filter(o => o.label.startsWith('bumper'));
      expect(scaffolds).toHaveLength(2);
      expect(bumpers).toHaveLength(2);
    });

    it('scaffold platforms are angled box type', () => {
      const scaffolds = shanghai.obstacles.filter(o => o.label.startsWith('scaffold'));
      scaffolds.forEach(s => {
        expect(s.type).toBe('box');
        expect(Math.abs(s.angle)).toBeGreaterThan(0);
      });
    });

    it('bumpers are circle type with high restitution', () => {
      const bumpers = shanghai.obstacles.filter(o => o.label.startsWith('bumper'));
      bumpers.forEach(b => {
        expect(b.type).toBe('circle');
        expect(b.restitution).toBeGreaterThanOrEqual(0.7);
      });
    });
  });

  describe('NYC map', () => {
    const nyc = getMap('nyc');

    it('has exactly 3 obstacles', () => {
      expect(nyc.obstacles).toHaveLength(3);
    });

    it('has function-based background', () => {
      expect(typeof nyc.background).toBe('function');
    });

    it('has exactly 1 trampoline special zone', () => {
      expect(nyc.specialZones).toHaveLength(1);
      expect(nyc.specialZones[0].type).toBe('trampoline');
    });

    it('subway grate trampoline has correct impulse and position', () => {
      const grate = nyc.specialZones[0];
      expect(grate.impulseY).toBe(-18);
      expect(grate.x).toBe(560);
      expect(grate.y).toBe(630);
      expect(grate.w).toBe(160);
    });

    it('has expected floor physics', () => {
      expect(nyc.floorFriction).toBe(0.35);
      expect(nyc.floorRestitution).toBe(0.2);
    });

    it('windForce is null', () => {
      expect(nyc.windForce).toBeNull();
    });

    it('has hydrant, taxi, and lamppost obstacles', () => {
      const labels = nyc.obstacles.map(o => o.label);
      expect(labels).toContain('hydrant');
      expect(labels).toContain('taxi');
      expect(labels).toContain('lamppost');
    });

    it('hydrant is a circle with restitution 0.6', () => {
      const hydrant = nyc.obstacles.find(o => o.label === 'hydrant');
      expect(hydrant.type).toBe('circle');
      expect(hydrant.restitution).toBe(0.6);
    });

    it('lamppost is a narrow tall box at center', () => {
      const lamp = nyc.obstacles.find(o => o.label === 'lamppost');
      expect(lamp.type).toBe('box');
      expect(lamp.x).toBe(640);
      expect(lamp.w).toBeLessThanOrEqual(10);
    });
  });
});
