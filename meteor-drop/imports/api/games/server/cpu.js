import { Meteor } from 'meteor/meteor';
import { chooseCpuColumn, dropMeteor } from '../engine';
import { Games } from '../collection';
import { parseGameDocument } from '../schema';
import { persistGameTransition } from './persistence';

const CPU_DELAY_MS = 900;
const scheduledTurns = new Map();

function sanitizeStoredGame(game) {
  const { _id, ...document } = game;
  return parseGameDocument(document);
}

function clearScheduledTurn(gameId) {
  const existing = scheduledTurns.get(gameId);
  if (!existing) {
    return;
  }

  Meteor.clearTimeout(existing.handle);
  scheduledTurns.delete(gameId);
}

function isCpuTurn(game) {
  return (
    game.status === 'playing' &&
    game.turn === 'rival' &&
    game.rivalId !== null &&
    game.players[1]?.type === 'cpu'
  );
}

function deleteScheduledTurnIfCurrent(gameId, scheduledTurn) {
  if (scheduledTurns.get(gameId) !== scheduledTurn) {
    return false;
  }

  scheduledTurns.delete(gameId);
  return true;
}

export function scheduleCpuTurn(gameId) {
  clearScheduledTurn(gameId);

  void Games.findOneAsync(gameId)
    .then((game) => {
      if (game) {
        scheduleGameTurn(game);
      }
    })
    .catch((error) => {
      Meteor._debug('Meteor Drop CPU scheduling failed', error);
    });
}

export function scheduleGameTurn(game) {
  const storedGame = sanitizeStoredGame(game);
  clearScheduledTurn(game._id);

  if (!isCpuTurn(storedGame)) {
    return;
  }

  const scheduledTurn = {
    handle: null,
    expectedMoveCount: storedGame.moveCount,
  };
  scheduledTurn.handle = Meteor.setTimeout(async () => {
    if (!deleteScheduledTurnIfCurrent(game._id, scheduledTurn)) {
      return;
    }

    try {
      await runScheduledTurn(
        game._id,
        { expectedMoveCount: scheduledTurn.expectedMoveCount },
        Date.now()
      );
    } catch (error) {
      Meteor._debug('Meteor Drop CPU move failed', error);
    }
  }, CPU_DELAY_MS);

  scheduledTurns.set(game._id, scheduledTurn);
}

export async function runScheduledTurn(
  gameId,
  { expectedMoveCount } = {},
  now = Date.now()
) {
  const game = await Games.findOneAsync(gameId);
  if (!game) {
    return null;
  }

  const storedGame = sanitizeStoredGame(game);
  if (
    !isCpuTurn(storedGame) ||
    (expectedMoveCount !== undefined && storedGame.moveCount !== expectedMoveCount)
  ) {
    return game;
  }

  const column = chooseCpuColumn(storedGame);
  if (column === null) {
    return game;
  }

  const transition = await persistGameTransition(
    game,
    dropMeteor(storedGame, {
      actorId: storedGame.rivalId,
      column,
      now,
    }),
    now
  );

  return transition.game;
}

export function runCpuTurn(gameId, now = Date.now()) {
  return runScheduledTurn(gameId, {}, now);
}

export async function recoverActiveGameTurns() {
  const activeGames = await Games.find({
    status: 'playing',
    turn: 'rival',
    'players.1.type': 'cpu',
  }).fetchAsync();

  for (const game of activeGames) {
    scheduleGameTurn(game);
  }

  return activeGames.length;
}

export function resetScheduledTurnsForTests() {
  for (const gameId of scheduledTurns.keys()) {
    clearScheduledTurn(gameId);
  }
}

export function hasScheduledTurnForTests(gameId) {
  return scheduledTurns.has(gameId);
}

export function getScheduledTurnForTests(gameId) {
  return scheduledTurns.get(gameId);
}

export function deleteScheduledTurnIfCurrentForTests(gameId, scheduledTurn) {
  return deleteScheduledTurnIfCurrent(gameId, scheduledTurn);
}
