import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, rs, test } from '@rstest/core';
import React from 'react';

import { createInitialState } from '../game/rules';
import { createDeck } from '../game/shuffle';
import { CardGrid } from './CardGrid';

test('renders sixteen accessible cards and reports clicked index', async () => {
  const state = createInitialState(createDeck('component'));
  const onFlip = rs.fn();
  const user = userEvent.setup();
  render(<CardGrid cards={state.cards} onFlip={onFlip} disabled={false} />);

  const cards = screen.getAllByRole('button', { name: /Hidden card/ });
  expect(cards).toHaveLength(16);
  await user.click(cards[3]);
  expect(onFlip).toHaveBeenCalledWith(3);
});

test('matched cards expose symbol and remain disabled', () => {
  const state = createInitialState(createDeck('matched'));
  const matched = state.cards.map((card, index) => index === 0
    ? { ...card, isMatched: true, isRevealed: true }
    : card);
  render(<CardGrid cards={matched} onFlip={() => undefined} disabled={false} />);
  const card = screen.getByRole('button', {
    name: `Matched ${matched[0].symbol}`,
  }) as HTMLButtonElement;
  expect(card.disabled).toBe(true);
});
