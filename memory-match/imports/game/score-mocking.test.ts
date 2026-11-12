import { expect, rs, test } from '@rstest/core';

import { calculateScore } from './score';

rs.mock('./score', () => ({
  calculateScore: rs.fn(() => 1_337),
}));

test('hoists an app-module mock before its static import', () => {
  const input = { moves: 8, durationMs: 9_000 };

  expect(calculateScore(input)).toBe(1_337);
  expect(calculateScore).toHaveBeenCalledWith(input);
});
