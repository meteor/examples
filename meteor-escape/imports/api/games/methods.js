import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import {
  createInitialState,
  resolveAction,
  resolveTimeout,
} from './engine';
import { Games } from './collection';
import {
  AnswerSchema,
  CreateCrewSchema,
  JoinCrewSchema,
  RematchSchema,
  StartSoloSchema,
  parseGameDocument,
  parseOrThrow,
} from './schema';
import { scheduleCpuTurn } from './server/cpu';

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

async function persistGame(gameId, nextState, now) {
  const stored = parseGameDocument({
    ...nextState,
    updatedAt: new Date(now),
  });

  await Games.updateAsync(gameId, { $set: stored });
  return Games.findOneAsync(gameId);
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

  return persistGame(game._id, resolveTimeout(storedGame, { now }), now);
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

Meteor.methods({
  async 'games.startSolo'(payload) {
    const { ownerId, playerId, testMode } = parseOrThrow(StartSoloSchema, payload);
    const now = Date.now();
    const gameId = await Games.insertAsync(
      createSoloDocument({ ownerId, playerId, now, testMode })
    );

    return { gameId };
  },

  async 'games.answer'(payload) {
    const { ownerId, playerId, gameId, action } = parseOrThrow(AnswerSchema, payload);
    const now = Date.now();
    const existing = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const game = await maybeSettleTimeout(existing, now);
    const storedGame = sanitizeStoredGame(game);

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

    const nextGame = await persistGame(
      gameId,
      resolveAction(storedGame, { actorId: playerId, action, now }),
      now
    );

    if (shouldScheduleCpu(nextGame)) {
      scheduleCpuTurn(gameId);
    }

    return { gameId };
  },

  async 'games.createCrew'(payload) {
    const { ownerId, playerId } = parseOrThrow(CreateCrewSchema, payload);
    const now = Date.now();
    const roomCode = await generateRoomCode();
    const state = createInitialState({ mode: 'crew', ownerId, playerId, now, roomCode });
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
  },

  async 'games.joinCrew'(payload) {
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
    const updatedCount = await Games.updateAsync(
      { _id: waitingGame._id, status: 'waiting' },
      { $set: nextDocument }
    );

    if (updatedCount === 0) {
      throw new Meteor.Error('not-found', 'Room code not found');
    }

    return { gameId: waitingGame._id };
  },

  async 'games.rematch'(payload) {
    const { ownerId, playerId, gameId, testMode } = parseOrThrow(RematchSchema, payload);
    const existing = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const game = sanitizeStoredGame(existing);

    if (!['won', 'lost'].includes(game.status)) {
      throw new Meteor.Error('invalid-state', 'Game is not finished');
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

    const nextGameId = await Games.insertAsync(nextDocument);
    return { gameId: nextGameId };
  },
});
