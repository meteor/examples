import { describe, expect, test } from '@rstest/core';

import { createDeck } from './shuffle';

describe('createDeck', () => {
  test('creates eight exact pairs deterministically', () => {
    const first = createDeck('apollo');
    const second = createDeck('apollo');
    const counts = new Map<string, number>();
    for (const card of first) counts.set(card.symbol, (counts.get(card.symbol) ?? 0) + 1);

    expect(first).toEqual(second);
    expect(first).toHaveLength(16);
    expect([...counts.values()].sort()).toEqual(Array(8).fill(2));
    expect(new Set(first.map((card) => card.id)).size).toBe(16);
  });

  test('different seeds produce different order', () => {
    expect(createDeck('apollo').map(({ symbol }) => symbol)).not.toEqual(
      createDeck('gemini').map(({ symbol }) => symbol),
    );
  });
});
