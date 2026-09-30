import { beforeEach, describe, expect, rs, test } from '@rstest/core';

import {
  createInitialState,
  hideUnmatched,
  flipCard,
} from './rules';
import type { CardDefinition } from './types';

const deck: CardDefinition[] = [
  { id: 'moon-a', symbol: '🌙' },
  { id: 'star-a', symbol: '⭐' },
  { id: 'moon-b', symbol: '🌙' },
  { id: 'star-b', symbol: '⭐' },
];

describe('Memory Match rules', () => {
  beforeEach(() => {
    rs.useFakeTimers();
    rs.setSystemTime(new Date('2026-08-08T10:00:00.000Z'));
  });

  test('starts with every card hidden', () => {
    const state = createInitialState(deck);
    expect(state.cards.every((card) => !card.isRevealed && !card.isMatched)).toBe(true);
    expect(state.startedAt).toBe(Date.now());
    expect(state.moves).toBe(0);
  });

  test('resolves a matching pair immutably', () => {
    const initial = createInitialState(deck);
    const first = flipCard(initial, 0, Date.now());
    const matched = flipCard(first, 2, Date.now() + 100);

    expect(initial.cards[0].isRevealed).toBe(false);
    expect(matched.cards[0].isMatched).toBe(true);
    expect(matched.cards[2].isMatched).toBe(true);
    expect(matched.moves).toBe(1);
    expect(matched.firstSelection).toBeNull();
  });

  test('holds a mismatch until hideUnmatched runs', () => {
    const first = flipCard(createInitialState(deck), 0, 1_000);
    const mismatch = flipCard(first, 1, 1_100);
    expect(mismatch.status).toBe('resolving');
    expect(mismatch.cards[0].isRevealed).toBe(true);
    expect(mismatch.cards[1].isRevealed).toBe(true);

    const hidden = hideUnmatched(mismatch);
    expect(hidden.status).toBe('playing');
    expect(hidden.cards[0].isRevealed).toBe(false);
    expect(hidden.cards[1].isRevealed).toBe(false);
  });

  test.each([
    ['negative index', -1, 'invalid-index'],
    ['past-end index', 4, 'invalid-index'],
  ] as const)('rejects %s', (_label, index, code) => {
    expect(() => flipCard(createInitialState(deck), index, 0)).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  test('rejects same-card double flip and flips while resolving', () => {
    const first = flipCard(createInitialState(deck), 0, 0);
    expect(() => flipCard(first, 0, 1)).toThrowError(/already revealed/);
    const mismatch = flipCard(first, 1, 2);
    expect(() => flipCard(mismatch, 2, 3)).toThrowError(/resolve mismatch/);
  });

  test('marks game complete after final pair', () => {
    let state = createInitialState(deck);
    state = flipCard(state, 0, 100);
    state = flipCard(state, 2, 200);
    state = flipCard(state, 1, 300);
    state = flipCard(state, 3, 400);
    expect(state.status).toBe('completed');
    expect(state.completedAt).toBe(400);
    expect(state.cards.every((card) => card.isMatched)).toBe(true);
  });
});
