import { afterEach, expect, test } from '@rstest/core';

import { Games } from './games';
import { leaderboardDocuments } from './publications';

const prefix = `leaderboard-${process.env.METEOR_TEST_WORKER_ID ?? 'single'}-`;

afterEach(async () => {
  await Games.removeAsync({ playerName: { $regex: `^${prefix}` } });
});

test('leaderboard uses score, moves, and completion ordering with limit ten', async () => {
  await Promise.all(Array.from({ length: 12 }, (_, index) => Games.insertAsync({
    playerName: `${prefix}${String(index).padStart(2, '0')}`,
    seed: `seed-${index}`,
    state: {
      cards: [],
      firstSelection: null,
      secondSelection: null,
      moves: index + 8,
      status: 'completed',
      startedAt: 1,
      completedAt: 100 + index,
    },
    score: 1_000 - index,
    createdAt: 1,
    updatedAt: 100 + index,
  })));

  const rows = await leaderboardDocuments({ playerPrefix: prefix });
  expect(rows.length).toBe(10);
  expect(rows[0].score).toBe(1_000);
  expect(rows[9].score).toBe(991);
});
