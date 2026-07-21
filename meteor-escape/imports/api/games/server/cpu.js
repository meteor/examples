import { Meteor } from 'meteor/meteor';
import {
  getRequiredAction,
  resolveAction,
  resolveTimeout,
} from '../engine';
import { Games } from '../collection';
import { parseGameDocument } from '../schema';

const CPU_DELAY_MS = 600;
const scheduledTurns = new Map();

function sanitizeStoredGame(game) {
  const { _id, ...document } = game;
  return parseGameDocument(document);
}

async function persistGame(gameId, nextState, now) {
  const stored = parseGameDocument({
    ...nextState,
    updatedAt: new Date(now),
  });

  await Games.updateAsync(gameId, { $set: stored });
  return Games.findOneAsync(gameId);
}

export function scheduleCpuTurn(gameId) {
  if (scheduledTurns.has(gameId)) {
    return;
  }

  const handle = Meteor.setTimeout(async () => {
    scheduledTurns.delete(gameId);

    try {
      await runCpuTurn(gameId, Date.now());
    } catch (error) {
      Meteor._debug('Meteor Escape CPU turn failed', error);
    }
  }, CPU_DELAY_MS);

  scheduledTurns.set(gameId, handle);
}

export async function runCpuTurn(gameId, now = Date.now()) {
  const game = await Games.findOneAsync(gameId);
  if (!game) {
    return null;
  }

  if (game.status !== 'playing') {
    return game;
  }

  const storedGame = sanitizeStoredGame(game);

  if (
    storedGame.endsAt !== null &&
    storedGame.turnEndsAt !== null &&
    (now > storedGame.endsAt || now > storedGame.turnEndsAt)
  ) {
    const timedOut = resolveTimeout(storedGame, { now });
    return persistGame(gameId, timedOut, now);
  }

  const cpuPlayer = storedGame.players[1];
  if (
    storedGame.turn !== 'copilot' ||
    storedGame.copilotId === null ||
    cpuPlayer?.type !== 'cpu'
  ) {
    return game;
  }

  const nextState = resolveAction(storedGame, {
    actorId: storedGame.copilotId,
    action: getRequiredAction(storedGame.emergency),
    now,
  });

  return persistGame(gameId, nextState, now);
}
