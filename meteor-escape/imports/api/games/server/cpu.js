import { Meteor } from 'meteor/meteor';
import {
  getRequiredAction,
  resolveAction,
  resolveTimeout,
} from '../engine';
import { Games } from '../collection';
import { parseGameDocument } from '../schema';
import { persistGameTransition } from './persistence';

const CPU_DELAY_MS = 600;
const scheduledTurns = new Map();

function sanitizeStoredGame(game) {
  const { _id, ...document } = game;
  return parseGameDocument(document);
}

export function scheduleCpuTurn(gameId) {
  const existing = scheduledTurns.get(gameId);
  if (existing) {
    Meteor.clearTimeout(existing.handle);
    scheduledTurns.delete(gameId);
  }

  void Games.findOneAsync(gameId).then((game) => {
    if (!game) {
      return;
    }

    scheduleGameTurn(game);
  }).catch((error) => {
    Meteor._debug('Meteor Escape turn scheduling failed', error);
  });
}

function clearScheduledTurn(gameId) {
  const existing = scheduledTurns.get(gameId);
  if (!existing) {
    return;
  }

  Meteor.clearTimeout(existing.handle);
  scheduledTurns.delete(gameId);
}

function getScheduledDelay(game, now = Date.now()) {
  if (game.turnEndsAt === null) {
    return null;
  }

  const isCpuTurn =
    game.turn === 'copilot' &&
    game.copilotId !== null &&
    game.players[1]?.type === 'cpu';

  if (isCpuTurn) {
    return CPU_DELAY_MS;
  }

  return Math.max(0, game.turnEndsAt - now);
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

function deleteScheduledTurnIfCurrent(gameId, scheduledTurn) {
  if (scheduledTurns.get(gameId) !== scheduledTurn) {
    return false;
  }

  scheduledTurns.delete(gameId);
  return true;
}

export function deleteScheduledTurnIfCurrentForTests(gameId, scheduledTurn) {
  return deleteScheduledTurnIfCurrent(gameId, scheduledTurn);
}

export async function recoverActiveGameTurns(now = Date.now()) {
  const activeGames = await Games.find({ status: 'playing' }).fetchAsync();

  for (const game of activeGames) {
    scheduleGameTurn(game, now);
  }

  return activeGames.length;
}

export function scheduleGameTurn(game, now = Date.now()) {
  const storedGame = sanitizeStoredGame(game);
  clearScheduledTurn(game._id);

  if (storedGame.status !== 'playing') {
    return;
  }

  const delay = getScheduledDelay(storedGame, now);
  if (delay === null) {
    return;
  }

  const expectedTurn = storedGame.turn;
  const expectedTurnEndsAt = storedGame.turnEndsAt;
  const scheduledTurn = {
    handle: null,
    expectedTurn,
    expectedTurnEndsAt,
  };
  scheduledTurn.handle = Meteor.setTimeout(async () => {
    if (!deleteScheduledTurnIfCurrent(game._id, scheduledTurn)) {
      return;
    }

    try {
      await runScheduledTurn(
        game._id,
        { expectedTurn, expectedTurnEndsAt },
        Date.now()
      );
    } catch (error) {
      Meteor._debug('Meteor Escape scheduled turn failed', error);
    }
  }, delay);

  scheduledTurns.set(game._id, scheduledTurn);
}

export async function runCpuTurn(gameId, now = Date.now()) {
  return runScheduledTurn(
    gameId,
    { expectedTurn: 'copilot' },
    now
  );
}

export async function runScheduledTurn(
  gameId,
  { expectedTurn, expectedTurnEndsAt } = {},
  now = Date.now()
) {
  const game = await Games.findOneAsync(gameId);
  if (!game) {
    return null;
  }

  if (game.status !== 'playing') {
    return game;
  }

  const storedGame = sanitizeStoredGame(game);
  if (
    expectedTurn !== undefined &&
    storedGame.turn !== expectedTurn
  ) {
    return game;
  }

  if (
    expectedTurnEndsAt !== undefined &&
    storedGame.turnEndsAt !== expectedTurnEndsAt
  ) {
    return game;
  }

  if (
    storedGame.endsAt !== null &&
    storedGame.turnEndsAt !== null &&
    (now > storedGame.endsAt || now > storedGame.turnEndsAt)
  ) {
    const timedOut = resolveTimeout(storedGame, { now });
    const transition = await persistGameTransition(game, timedOut, now);
    const persisted = transition.game;
    if (!persisted) {
      return null;
    }
    if (persisted.status === 'playing') {
      scheduleGameTurn(persisted, now);
    }
    return persisted;
  }

  const turnPlayer = storedGame.players.find((player) => player.role === storedGame.turn) ?? null;
  if (!turnPlayer) {
    return game;
  }

  if (turnPlayer.type !== 'cpu') {
    if (storedGame.turnEndsAt === null) {
      return game;
    }

    if (now <= storedGame.turnEndsAt) {
      scheduleGameTurn(game, now);
      return game;
    }
  }

  const nextState =
    turnPlayer.type === 'cpu' && storedGame.turn === 'copilot' && storedGame.copilotId !== null
      ? resolveAction(storedGame, {
          actorId: storedGame.copilotId,
          action: getRequiredAction(storedGame.emergency),
          now,
        })
      : resolveTimeout(storedGame, {
          now: storedGame.turnEndsAt === null ? now : Math.max(now, storedGame.turnEndsAt + 1),
        });

  const transition = await persistGameTransition(game, nextState, now);
  const persisted = transition.game;
  if (!persisted) {
    return null;
  }
  if (persisted.status === 'playing') {
    scheduleGameTurn(persisted, now);
  }
  return persisted;
}
