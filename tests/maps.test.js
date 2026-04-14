import { describe, it, expect } from 'vitest';
import { MAPS, getMap, getMaps } from '../src/config/maps.js';

describe('maps config', () => {
  it('MAPS array has exactly 3 entries in the correct order', () => {
    expect(MAPS).toHaveLength(3);
    expect(MAPS[0].id).toBe('stadium');
    expect(MAPS[1].id).toBe('rabat');
    expect(MAPS[2].id).toBe('bouskoura');
  });

  it('getMaps() returns all 3 maps', () => {
    expect(getMaps()).toHaveLength(3);
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

    it('all obstacles have label "obstacle"', () => {
      rabat.obstacles.forEach(obs => expect(obs.label).toBe('obstacle'));
    });

    it('has a decoration function', () => {
      expect(typeof rabat.decoration).toBe('function');
    });

    it('decoration function calls fillStyle and fillRect on graphics object', () => {
      const calls = [];
      const g = {
        fillStyle: (...args) => calls.push(['fillStyle', ...args]),
        fillRect: (...args) => calls.push(['fillRect', ...args]),
      };
      rabat.decoration(null, g);
      expect(calls.some(c => c[0] === 'fillStyle')).toBe(true);
      expect(calls.filter(c => c[0] === 'fillRect').length).toBeGreaterThan(0);
    });
  });

  describe('Bouskoura Forest map', () => {
    const bouskoura = getMap('bouskoura');

    it('has exactly 3 obstacles', () => {
      expect(bouskoura.obstacles).toHaveLength(3);
    });

    it('has slippery floor (floorFriction 0.001)', () => {
      expect(bouskoura.floorFriction).toBe(0.001);
    });

    it('fallen log has restitution 0.5 (bouncy)', () => {
      const log = bouskoura.obstacles.find(o => o.w === 180);
      expect(log).toBeDefined();
      expect(log.restitution).toBe(0.5);
    });

    it('has a decoration function that draws tree trunks and canopies', () => {
      const calls = [];
      const g = {
        fillStyle: (...args) => calls.push(['fillStyle', ...args]),
        fillRect: (...args) => calls.push(['fillRect', ...args]),
        fillCircle: (...args) => calls.push(['fillCircle', ...args]),
      };
      bouskoura.decoration(null, g);
      expect(calls.filter(c => c[0] === 'fillRect').length).toBeGreaterThanOrEqual(4);
      expect(calls.filter(c => c[0] === 'fillCircle').length).toBeGreaterThanOrEqual(4);
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
});
