import { Meteor } from 'meteor/meteor';
import { afterEach, beforeEach, describe, expect, test } from '@rstest/core';

import { Games } from './games';
import { flipGameCard, startGame } from './methods';

const prefix = `methods-${process.env.METEOR_TEST_WORKER_ID ?? 'single'}-`;

describe('memory methods in real Meteor runtime', () => {
  beforeEach(async () => {
    await Games.removeAsync({ playerName: { $regex: `^${prefix}` } });
  });

  afterEach(async () => {
    await Games.removeAsync({ playerName: { $regex: `^${prefix}` } });
  });

  test('rejects invalid player names with Meteor error code', async () => {
    let error: Meteor.Error | undefined;
    try {
      await startGame({ playerName: ' ' });
    } catch (caught) {
      error = caught as Meteor.Error;
    }
    expect(error?.error).toBe('invalid-player-name');
  });

  test('registered method inserts deterministic test game', async () => {
    const gameId = await Meteor.callAsync('memory.start', {
      playerName: `${prefix}Ada`,
      seed: 'server-runtime',
    }) as string;
    const game = await Games.findOneAsync(gameId);
    expect(game?.seed).toBe('server-runtime');
    expect(game?.state.cards.length).toBe(16);
    expect(game?.state.cards.every((card) => !card.isMatched)).toBe(true);
  });

  test('server-authoritative flips persist a matching pair', async () => {
    const gameId = await startGame({
      playerName: `${prefix}Grace`,
      seed: 'matching-pair',
    });
    const game = await Games.findOneAsync(gameId);
    const first = game!.state.cards.findIndex((card, index, cards) =>
      cards.findIndex((candidate) => candidate.symbol === card.symbol) !== index);
    const second = game!.state.cards.findIndex((card, index) =>
      index !== first && card.symbol === game!.state.cards[first].symbol);

    await flipGameCard({ gameId, cardIndex: first, now: 100 });
    await flipGameCard({ gameId, cardIndex: second, now: 200 });
    const matched = await Games.findOneAsync(gameId);
    expect(matched?.state.cards[first].isMatched).toBe(true);
    expect(matched?.state.cards[second].isMatched).toBe(true);
    expect(matched?.state.moves).toBe(1);
  });
});
