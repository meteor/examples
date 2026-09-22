import { describe, expect, test } from '@rstest/core';

let active = 0;
let started = 0;
let release: () => void;
const firstPairStarted = new Promise<void>((resolve) => {
  release = resolve;
});

describe.concurrent('native Rstest concurrency', () => {
  for (const name of ['shuffle', 'rules', 'score']) {
    test(name, async () => {
      active += 1;
      started += 1;
      expect(active <= 2).toBe(true);
      if (started === 2) release();
      await firstPairStarted;
      active -= 1;
    });
  }

  test.sequential('waits before checking shared state', () => {
    expect(active).toBe(0);
    expect(started).toBe(3);
  });
});
