import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { expect, test } from '@rstest/core';

import { Games } from './games';
import { createDeck } from '../game/shuffle';

function subscribe(name: string, ...args: unknown[]): Promise<Meteor.SubscriptionHandle> {
  return new Promise((resolve, reject) => {
    const handle = Meteor.subscribe(name, ...args, {
      onReady: () => resolve(handle),
      onStop: (error?: Error) => error && reject(error),
    });
  });
}

function waitFor<T>(read: () => T | undefined): Promise<T> {
  return new Promise((resolve) => {
    Tracker.autorun((computation) => {
      const value = read();
      if (value !== undefined) {
        computation.stop();
        resolve(value);
      }
    });
  });
}

test('real DDP subscription fills Minimongo and reacts to method update', async () => {
  expect(Meteor.isClient).toBe(true);
  const gameId = await Meteor.callAsync('memory.start', {
    playerName: 'Client Ada',
    seed: 'client-ddp',
  }) as string;
  const subscription = await subscribe('memory.game', gameId);
  const inserted = await waitFor(() => Games.findOne(gameId));
  expect(inserted.seed).toBeUndefined();
  expect(inserted.state.cards.length).toBe(16);

  await Meteor.callAsync('memory.flip', { gameId, cardIndex: 0, now: Date.now() });
  const revealed = await waitFor(() => {
    const game = Games.findOne(gameId);
    return game?.state.cards[0].isRevealed ? game : undefined;
  });
  expect(revealed.state.cards[0].isRevealed).toBe(true);
  subscription.stop();
});

test('completed score arrives through reactive leaderboard publication', async () => {
  const seed = 'client-leaderboard';
  const gameId = await Meteor.callAsync('memory.start', {
    playerName: 'Client Grace',
    seed,
  }) as string;
  const deck = createDeck(seed);
  const grouped = new Map<string, number[]>();
  deck.forEach((card, index) => grouped.set(card.symbol, [
    ...(grouped.get(card.symbol) ?? []),
    index,
  ]));
  let now = Date.now();
  for (const [first, second] of grouped.values()) {
    await Meteor.callAsync('memory.flip', { gameId, cardIndex: first, now: ++now });
    await Meteor.callAsync('memory.flip', { gameId, cardIndex: second, now: ++now });
  }

  const subscription = await subscribe('memory.leaderboard');
  const completed = await waitFor(() => Games.findOne({
    _id: gameId,
    'state.status': 'completed',
  }));
  expect(completed.score).toBeDefined();
  subscription.stop();
});
