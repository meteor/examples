import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { calculateScore } from '../game/score';
import { createDeck } from '../game/shuffle';
import {
  createInitialState,
  flipCard,
  GameRuleError,
  hideUnmatched,
} from '../game/rules';
import { Games } from './games';
import { validateCardIndex, validateGameId, validatePlayerName } from './validation';

function testClock(value: unknown): number {
  if (value === undefined) return Date.now();
  if (!(Meteor.isTest || Meteor.isAppTest)) {
    throw new Meteor.Error('test-option-forbidden', 'Explicit clock is test-only');
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Meteor.Error('invalid-clock', 'Clock must be a finite number');
  }
  return value;
}

function selectedSeed(value: unknown): string {
  if (value !== undefined && typeof value !== 'string') {
    throw new Meteor.Error('invalid-seed', 'Seed must be text');
  }
  if (value !== undefined && !(Meteor.isTest || Meteor.isAppTest)) {
    throw new Meteor.Error('test-option-forbidden', 'Explicit seed is test-only');
  }
  return value as string | undefined || Random.id();
}

export async function startGame({
  playerName: rawPlayerName,
  seed: rawSeed,
}: {
  playerName: unknown;
  seed?: unknown;
}): Promise<string> {
  const playerName = validatePlayerName(rawPlayerName);
  const seed = selectedSeed(rawSeed);
  const now = Date.now();
  return Games.insertAsync({
    playerName,
    seed,
    state: createInitialState(createDeck(seed), now),
    createdAt: now,
    updatedAt: now,
    revision: 0,
  });
}

async function resolveMismatch(gameId: string, revision: number): Promise<void> {
  const game = await Games.findOneAsync({ _id: gameId, revision });
  if (!game || game.state.status !== 'resolving') return;
  await Games.updateAsync(
    { _id: gameId, revision },
    {
      $set: { state: hideUnmatched(game.state), updatedAt: Date.now() },
      $inc: { revision: 1 },
    },
  );
}

export async function flipGameCard({
  gameId: rawGameId,
  cardIndex: rawCardIndex,
  now: rawNow,
}: {
  gameId: unknown;
  cardIndex: unknown;
  now?: unknown;
}): Promise<void> {
  const gameId = validateGameId(rawGameId);
  const cardIndex = validateCardIndex(rawCardIndex);
  const now = testClock(rawNow);
  const game = await Games.findOneAsync(gameId);
  if (!game) throw new Meteor.Error('game-not-found', 'Game does not exist');

  let state;
  try {
    state = flipCard(game.state, cardIndex, now);
  } catch (error) {
    if (error instanceof GameRuleError) {
      throw new Meteor.Error(`game-${error.code}`, error.message);
    }
    throw error;
  }

  const revision = game.revision ?? 0;
  const set: Record<string, unknown> = { state, updatedAt: now };
  if (state.status === 'completed') {
    set.score = calculateScore({
      moves: state.moves,
      durationMs: now - state.startedAt,
    });
  }
  const updated = await Games.updateAsync(
    { _id: gameId, revision },
    { $set: set, $inc: { revision: 1 } },
  );
  if (updated !== 1) {
    throw new Meteor.Error('game-conflict', 'Game changed while card was being flipped');
  }
  if (state.status === 'resolving') {
    Meteor.setTimeout(() => {
      resolveMismatch(gameId, revision + 1).catch((error) => {
        console.error('[memory] mismatch resolution failed', error);
      });
    }, 650);
  }
}

Meteor.methods({
  'memory.start'(args) {
    return startGame(args);
  },
  'memory.flip'(args) {
    return flipGameCard(args);
  },
});
