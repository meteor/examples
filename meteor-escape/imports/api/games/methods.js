import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import {
  createInitialState,
  resolveAction,
  resolveTimeout,
} from './engine';
import {
  ACTIVE_PARTICIPANT_INDEX_NAME,
  ACTIVE_STATUSES,
  gamesStorageReady,
  Games,
  ROOM_CODE_INDEX_NAME,
  WAITING_CREW_OWNERSHIP_INDEX_NAME,
} from './collection';
import {
  AnswerSchema,
  CreateCrewSchema,
  JoinCrewSchema,
  RematchSchema,
  StartSoloSchema,
  parseGameDocument,
  parseOrThrow,
} from './schema';
import { scheduleGameTurn } from './server/cpu';
import { persistGameTransition } from './server/persistence';

const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sanitizeStoredGame(game) {
  const { _id, ...document } = game;
  return parseGameDocument(document);
}

function getTurnPlayer(game) {
  return game.players.find((player) => player.role === game.turn) ?? null;
}

function shouldScheduleCpu(game) {
  return game.status === 'playing' && game.turn === 'copilot' && game.players[1]?.type === 'cpu';
}

export function shouldHonorTestMode(
  requestedTestMode,
  {
    isDevelopment = Meteor.isDevelopment,
    e2eEnv = process.env.METEOR_ESCAPE_E2E,
  } = {}
) {
  return Boolean(requestedTestMode && isDevelopment && e2eEnv === '1');
}

async function findOwnedGameOrThrow({ ownerId, playerId, gameId }) {
  const game = await Games.findOneAsync({
    _id: gameId,
    players: {
      $elemMatch: {
        id: playerId,
        ownerId,
      },
    },
  });

  if (!game) {
    throw new Meteor.Error('not-found', 'Game not found');
  }

  return game;
}

async function maybeSettleTimeout(game, now) {
  const storedGame = sanitizeStoredGame(game);
  if (
    storedGame.status !== 'playing' ||
    storedGame.endsAt === null ||
    storedGame.turnEndsAt === null ||
    (now <= storedGame.endsAt && now <= storedGame.turnEndsAt)
  ) {
    return game;
  }

  const transition = await persistGameTransition(
    game,
    resolveTimeout(storedGame, { now }),
    now
  );
  return transition.game ?? game;
}

function createSoloDocument({ ownerId, playerId, now, testMode = false }) {
  const state = createInitialState({ mode: 'solo', ownerId, playerId, now, testMode });

  return parseGameDocument({
    ...state,
    ownerIds: [ownerId],
    copilotId: state.copilotId,
    participantIds: [playerId],
    players: [
      { id: playerId, ownerId, role: 'player', type: 'human' },
      { id: state.copilotId, ownerId: null, role: 'copilot', type: 'cpu' },
    ],
    createdAt: new Date(now),
    updatedAt: new Date(now),
  });
}

async function generateRoomCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const roomCode = Array.from({ length: 6 }, () => {
      const index = Math.floor(Random.fraction() * ROOM_CODE_ALPHABET.length);
      return ROOM_CODE_ALPHABET[index];
    }).join('');
    const existing = await Games.findOneAsync({ roomCode });

    if (!existing) {
      return roomCode;
    }
  }

  throw new Meteor.Error('room-code-unavailable', 'Unable to allocate room code');
}

function buildWaitingCaptainQuery(ownerId, playerId) {
  return {
    ownerId,
    playerId,
    mode: 'crew',
    status: 'waiting',
    players: {
      $elemMatch: {
        id: playerId,
        ownerId,
        role: 'player',
        type: 'human',
      },
    },
  };
}

async function findExistingWaitingCrewGame(ownerId, playerId) {
  return Games.findOneAsync(buildWaitingCaptainQuery(ownerId, playerId));
}

async function findActiveGameForParticipant(ownerId, playerId) {
  return Games.findOneAsync(
    {
      status: { $in: ACTIVE_STATUSES },
      participantIds: playerId,
      players: {
        $elemMatch: {
          id: playerId,
          ownerId,
          type: 'human',
        },
      },
    },
    { sort: { updatedAt: -1 } }
  );
}

function isDuplicateKeyError(error) {
  return error?.code === 11000 || error?.codeName === 'DuplicateKey';
}

function errorMentionsIndex(error, indexName) {
  const message = error?.message ?? error?.errmsg ?? '';
  return message.includes(indexName);
}

function isWaitingCrewOwnershipDuplicate(error) {
  if (!isDuplicateKeyError(error)) {
    return false;
  }

  if (errorMentionsIndex(error, WAITING_CREW_OWNERSHIP_INDEX_NAME)) {
    return true;
  }

  const keyPattern = error?.keyPattern;
  return Boolean(
    keyPattern?.mode === 1 &&
      keyPattern?.status === 1 &&
      keyPattern?.ownerId === 1 &&
      keyPattern?.playerId === 1
  );
}

function isRoomCodeDuplicate(error) {
  if (!isDuplicateKeyError(error)) {
    return false;
  }

  if (errorMentionsIndex(error, ROOM_CODE_INDEX_NAME)) {
    return true;
  }

  return error?.keyPattern?.roomCode === 1;
}

function isActiveParticipantDuplicate(error) {
  if (!isDuplicateKeyError(error)) {
    return false;
  }

  return (
    errorMentionsIndex(error, ACTIVE_PARTICIPANT_INDEX_NAME) ||
    error?.keyPattern?.participantIds === 1
  );
}

function activeGameError() {
  return new Meteor.Error('active-game', 'Finish or resume the active mission first');
}

Meteor.methods({
  async 'games.startSolo'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, testMode: requestedTestMode } = parseOrThrow(StartSoloSchema, payload);
    const existingActiveGame = await findActiveGameForParticipant(ownerId, playerId);

    if (existingActiveGame) {
      if (existingActiveGame.mode === 'solo') {
        return { gameId: existingActiveGame._id };
      }

      throw activeGameError();
    }

    const testMode = shouldHonorTestMode(requestedTestMode);
    const now = Date.now();
    let gameId;

    try {
      gameId = await Games.insertAsync(
        createSoloDocument({ ownerId, playerId, now, testMode })
      );
    } catch (error) {
      if (!isActiveParticipantDuplicate(error)) {
        throw error;
      }

      const concurrentGame = await findActiveGameForParticipant(ownerId, playerId);
      if (concurrentGame?.mode === 'solo') {
        return { gameId: concurrentGame._id };
      }

      throw activeGameError();
    }

    const game = await Games.findOneAsync(gameId);
    scheduleGameTurn(game, now);

    return { gameId };
  },

  async 'games.answer'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, gameId, action } = parseOrThrow(AnswerSchema, payload);
    const now = Date.now();
    const existing = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const game = await maybeSettleTimeout(existing, now);
    const storedGame = sanitizeStoredGame(game);
    if (game._id !== existing._id || game.updatedAt?.getTime?.() !== existing.updatedAt?.getTime?.()) {
      if (storedGame.status === 'playing') {
        scheduleGameTurn(game, now);
      }
    }

    if (storedGame.status !== 'playing') {
      throw new Meteor.Error('invalid-state', 'Game is not active');
    }

    if (storedGame.turnEndsAt === null || now > storedGame.turnEndsAt) {
      throw new Meteor.Error('stale-action', 'Turn already expired');
    }

    const turnPlayer = getTurnPlayer(storedGame);
    if (
      turnPlayer === null ||
      turnPlayer.type !== 'human' ||
      turnPlayer.id !== playerId ||
      turnPlayer.ownerId !== ownerId
    ) {
      throw new Meteor.Error('stale-action', 'Turn already advanced');
    }

    const transition = await persistGameTransition(
      game,
      resolveAction(storedGame, { actorId: playerId, action, now }),
      now
    );

    if (!transition.applied || !transition.game) {
      throw new Meteor.Error('stale-action', 'Turn already advanced');
    }

    const nextGame = transition.game;

    if (nextGame.status === 'playing' || shouldScheduleCpu(nextGame)) {
      scheduleGameTurn(nextGame, now);
    }

    return { gameId };
  },

  async 'games.createCrew'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId } = parseOrThrow(CreateCrewSchema, payload);
    const existingWaitingGame = await findExistingWaitingCrewGame(ownerId, playerId);

    if (existingWaitingGame) {
      return { gameId: existingWaitingGame._id, roomCode: existingWaitingGame.roomCode };
    }

    if (await findActiveGameForParticipant(ownerId, playerId)) {
      throw activeGameError();
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const now = Date.now();
      const roomCode = await generateRoomCode();
      const state = createInitialState({ mode: 'crew', ownerId, playerId, now, roomCode });

      try {
        const gameId = await Games.insertAsync(
          parseGameDocument({
            ...state,
            ownerIds: [ownerId],
            copilotId: null,
            participantIds: [playerId],
            players: [{ id: playerId, ownerId, role: 'player', type: 'human' }],
            roomCode,
            status: 'waiting',
            endsAt: null,
            turnEndsAt: null,
            createdAt: new Date(now),
            updatedAt: new Date(now),
          })
        );

        return { gameId, roomCode };
      } catch (error) {
        if (isWaitingCrewOwnershipDuplicate(error)) {
          const concurrentWaitingGame = await findExistingWaitingCrewGame(ownerId, playerId);

          if (concurrentWaitingGame) {
            return {
              gameId: concurrentWaitingGame._id,
              roomCode: concurrentWaitingGame.roomCode,
            };
          }
        }

        if (isActiveParticipantDuplicate(error)) {
          const concurrentGame = await findActiveGameForParticipant(ownerId, playerId);

          if (concurrentGame?.mode === 'crew' && concurrentGame.status === 'waiting') {
            return {
              gameId: concurrentGame._id,
              roomCode: concurrentGame.roomCode,
            };
          }

          throw activeGameError();
        }

        if (isRoomCodeDuplicate(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Meteor.Error('room-code-unavailable', 'Unable to allocate room code');
  },

  async 'games.joinCrew'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, roomCode } = parseOrThrow(JoinCrewSchema, payload);
    const waitingGame = await Games.findOneAsync({
      roomCode,
      mode: 'crew',
      status: 'waiting',
    });

    if (!waitingGame) {
      throw new Meteor.Error('not-found', 'Room code not found');
    }

    if (
      waitingGame.players.some(
        (player) => player.id === playerId || player.ownerId === ownerId
      )
    ) {
      throw new Meteor.Error('duplicate-join', 'Player already joined');
    }

    if (await findActiveGameForParticipant(ownerId, playerId)) {
      throw activeGameError();
    }

    const now = Date.now();
    const state = createInitialState({
      mode: 'crew',
      ownerId: waitingGame.ownerId,
      playerId: waitingGame.playerId,
      now,
      roomCode,
    });
    const nextDocument = parseGameDocument({
      ...state,
      ownerIds: [...waitingGame.ownerIds, ownerId],
      copilotId: playerId,
      participantIds: [waitingGame.playerId, playerId],
      players: [
        {
          id: waitingGame.playerId,
          ownerId: waitingGame.players[0].ownerId,
          role: 'player',
          type: 'human',
        },
        { id: playerId, ownerId, role: 'copilot', type: 'human' },
      ],
      roomCode,
      createdAt: waitingGame.createdAt,
      updatedAt: new Date(now),
    });
    let updatedCount;

    try {
      updatedCount = await Games.updateAsync(
        { _id: waitingGame._id, status: 'waiting' },
        { $set: nextDocument }
      );
    } catch (error) {
      if (isActiveParticipantDuplicate(error)) {
        throw activeGameError();
      }

      throw error;
    }

    if (updatedCount === 0) {
      throw new Meteor.Error('not-found', 'Room code not found');
    }

    const game = await Games.findOneAsync(waitingGame._id);
    scheduleGameTurn(game, now);

    return { gameId: waitingGame._id };
  },

  async 'games.rematch'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, gameId, testMode: requestedTestMode } = parseOrThrow(RematchSchema, payload);
    const existing = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const game = sanitizeStoredGame(existing);
    const testMode = shouldHonorTestMode(requestedTestMode);

    if (!['won', 'lost'].includes(game.status)) {
      throw new Meteor.Error('invalid-state', 'Game is not finished');
    }

    const existingActiveGame = await findActiveGameForParticipant(ownerId, playerId);
    if (existingActiveGame) {
      return { gameId: existingActiveGame._id };
    }

    const now = Date.now();
    let nextDocument;

    if (game.mode === 'solo' || game.players[1]?.type === 'cpu') {
      nextDocument = createSoloDocument({
        ownerId: game.ownerId,
        playerId: game.playerId,
        now,
        testMode,
      });
    } else {
      const roomCode = await generateRoomCode();
      const state = createInitialState({
        mode: 'crew',
        ownerId: game.ownerId,
        playerId: game.playerId,
        now,
        roomCode,
      });
      nextDocument = parseGameDocument({
        ...state,
        ownerIds: [...game.ownerIds],
        copilotId: game.copilotId,
        participantIds: [...game.participantIds],
        players: game.players,
        roomCode,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
    }

    let nextGameId;

    try {
      nextGameId = await Games.insertAsync(nextDocument);
    } catch (error) {
      if (!isActiveParticipantDuplicate(error)) {
        throw error;
      }

      const concurrentGame = await findActiveGameForParticipant(ownerId, playerId);
      if (concurrentGame) {
        return { gameId: concurrentGame._id };
      }

      throw activeGameError();
    }
    const nextGame = await Games.findOneAsync(nextGameId);
    scheduleGameTurn(nextGame, now);
    return { gameId: nextGameId };
  },
});
