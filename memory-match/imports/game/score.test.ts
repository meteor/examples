import { describe, expect, rs, test } from '@rstest/core';

import { calculateScore, compareLeaderboard } from './score';

describe('scoring', () => {
  test.each([
    [{ moves: 8, durationMs: 20_000 }, 7_800],
    [{ moves: 20, durationMs: 300_000 }, 2_000],
    [{ moves: 100, durationMs: 9_000_000 }, 100],
  ])('calculates score for %o', (input, expected) => {
    expect(calculateScore(input)).toBe(expected);
  });

  test('sorts by score, moves, completion time, then player', () => {
    const rows = [
      { playerName: 'Zoe', score: 500, moves: 9, completedAt: 30 },
      { playerName: 'Ada', score: 700, moves: 10, completedAt: 20 },
      { playerName: 'Bea', score: 700, moves: 9, completedAt: 30 },
      { playerName: 'Cal', score: 700, moves: 9, completedAt: 10 },
    ];
    const spy = rs.spyOn(String.prototype, 'localeCompare');
    expect(rows.toSorted(compareLeaderboard).map(({ playerName }) => playerName)).toEqual([
      'Cal',
      'Bea',
      'Ada',
      'Zoe',
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  test('uses player name as final stable tie-breaker', () => {
    const compare = rs.fn(compareLeaderboard);
    const tied = [
      { playerName: 'Zoe', score: 700, moves: 9, completedAt: 10 },
      { playerName: 'Ada', score: 700, moves: 9, completedAt: 10 },
    ];
    expect(tied.toSorted(compare).map(({ playerName }) => playerName)).toEqual(['Ada', 'Zoe']);
    expect(compare).toHaveBeenCalled();
  });
});
