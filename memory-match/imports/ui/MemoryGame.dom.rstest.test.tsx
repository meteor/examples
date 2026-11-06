import { render, screen } from '@testing-library/react';
import { expect, test } from '@rstest/core';
import React from 'react';

import { createInitialState } from '../game/rules';
import { createDeck } from '../game/shuffle';
import { MemoryGame } from './MemoryGame';

test('shows move status and ordered leaderboard', () => {
  const state = { ...createInitialState(createDeck('screen')), moves: 3 };
  render(
    <MemoryGame
      playerName="Ada"
      state={state}
      leaderboard={[
        { playerName: 'Ada', score: 8_000, moves: 8, completedAt: 1 },
        { playerName: 'Grace', score: 7_500, moves: 10, completedAt: 2 },
      ]}
      onFlip={() => undefined}
    />,
  );
  expect(screen.getByText('Moves: 3')).toBeDefined();
  expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
    '1. Ada — 8000',
    '2. Grace — 7500',
  ]);
});

test('announces completed result', () => {
  const initial = createInitialState(createDeck('complete'));
  const state = {
    ...initial,
    cards: initial.cards.map((card) => ({ ...card, isMatched: true, isRevealed: true })),
    moves: 8,
    status: 'completed' as const,
    completedAt: initial.startedAt + 20_000,
  };
  render(
    <MemoryGame
      playerName="Ada"
      state={state}
      score={7_800}
      leaderboard={[]}
      onFlip={() => undefined}
    />,
  );
  expect(screen.getByRole('status').textContent).toMatch(/completed.*7800/i);
});
