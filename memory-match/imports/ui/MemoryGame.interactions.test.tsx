import { page } from '@rstest/browser';
import { render } from '@rstest/browser-react';
import userEvent from '@testing-library/user-event';
import { expect, test } from '@rstest/core';
import React, { useState } from 'react';

import '../../client/main.css';
import { createInitialState, flipCard } from '../game/rules';
import { createDeck } from '../game/shuffle';
import type { GameState } from '../game/types';
import { MemoryGame } from './MemoryGame';

function BrowserHarness() {
  const [state, setState] = useState<GameState>(() =>
    createInitialState(createDeck('browser-mode')));
  return (
    <MemoryGame
      leaderboard={[]}
      onFlip={(index) => setState((current) => flipCard(current, index))}
      playerName="Browser"
      state={state}
    />
  );
}

test('runs memory-game behavior, focus, and CSS in real Chromium', async () => {
  const { container } = await render(<BrowserHarness />);
  const user = userEvent.setup();
  expect(navigator.userAgent).toMatch(/Chrome|Chromium/);

  await expect.element(page.getByRole('heading', { name: "Browser's board" })).toBeVisible();
  await expect.element(page.getByRole('button', { name: /Hidden card/ })).toHaveCount(16);

  const deck = createDeck('browser-mode');
  const first = 0;
  const second = deck.findIndex((card, index) =>
    index !== first && card.symbol === deck[first].symbol);
  const firstCard = page.locator('.memory-card').nth(first);
  const cardElements = container.querySelectorAll<HTMLButtonElement>('.memory-card');
  cardElements[first].focus();
  await expect.element(firstCard).toBeFocused();
  await user.click(cardElements[first]);
  await user.click(cardElements[second]);

  await expect.element(page.getByRole('button', { name: `Matched ${deck[first].symbol}` }))
    .toHaveCount(2);
  await expect.element(firstCard).toBeDisabled();
  await expect.element(page.getByRole('grid', { name: 'Memory cards' }))
    .toHaveCSS('background-color', 'rgb(8, 15, 36)');
});
