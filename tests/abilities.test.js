import { describe, it, expect } from 'vitest';
import { ABILITIES, ABILITY_COOLDOWN, GAME_WIDTH, BALL } from '../src/config/constants.js';
import { CHARACTERS } from '../src/config/characters.js';

// Pure helpers mirroring the logic inside Player._useAbility — tested in isolation.
const fireDirection = (side) => (side === 'left' ? 1 : -1);
const ninjaClampX = (ballX) => Math.min(Math.max(ballX, 80), GAME_WIDTH - 80);
const tinyNearCenter = (ballX, ballY) =>
  Math.abs(ballX - BALL.startX) < 80 && Math.abs(ballY - BALL.startY) < 80;
const cooldownSeconds = (ratio) => Math.ceil((1 - ratio) * ABILITY_COOLDOWN / 1000);

describe('ability logic', () => {
  it('test_constants_ice_freeze_duration_equals_2000', () => {
    expect(ABILITIES.ice.freezeDuration).toBe(2000);
  });

  it('test_constants_fire_impulse_values_preserved', () => {
    expect(ABILITIES.fire.impulseX).toBe(0.06);
    expect(ABILITIES.fire.impulseY).toBe(-0.04);
  });

  it('test_fire_direction_left_player_kicks_right', () => {
    expect(fireDirection('left')).toBe(1);
    expect(fireDirection('right')).toBe(-1);
  });

  it('test_ninja_teleport_clamps_ball_x_to_arena_bounds', () => {
    expect(ninjaClampX(0)).toBe(80);
    expect(ninjaClampX(GAME_WIDTH)).toBe(GAME_WIDTH - 80);
    expect(ninjaClampX(640)).toBe(640);
  });

  it('test_tiny_near_center_guard_skips_freshly_reset_ball', () => {
    expect(tinyNearCenter(BALL.startX, BALL.startY)).toBe(true);
    expect(tinyNearCenter(200, BALL.startY)).toBe(false);
    expect(tinyNearCenter(BALL.startX, 500)).toBe(false);
  });

  it('test_cooldown_seconds_conversion_from_ratio', () => {
    expect(cooldownSeconds(1)).toBe(0);
    expect(cooldownSeconds(0)).toBe(8);
    expect(cooldownSeconds(0.5)).toBe(4);
  });

  it('test_roster_character_ids_match_expected_set', () => {
    const expected = new Set(['khalil', 'beboush', 'lilya', 'fafa', 'sara']);
    const actual = new Set(CHARACTERS.map(c => c.id));
    expect(actual).toEqual(expected);
  });
});
