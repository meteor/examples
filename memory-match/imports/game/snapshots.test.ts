import { expect, test } from '@rstest/core';

import { createDeck } from './shuffle';

test('captures stable deck metadata inline', () => {
  const deck = createDeck('snapshot');
  expect({ cards: deck.length, pairs: new Set(deck.map(({ symbol }) => symbol)).size })
    .toMatchInlineSnapshot(`
      {
        "cards": 16,
        "pairs": 8,
      }
    `);
});

test('captures deterministic board order externally', () => {
  expect(createDeck('snapshot').map(({ symbol }) => symbol)).toMatchSnapshot();
});

test('captures completed game summary as standalone file', async () => {
  await expect('Player: Ada\nMoves: 8\nScore: 7800\nStatus: completed\n')
    .toMatchFileSnapshot('./__snapshots__/completed-game.txt');
});
