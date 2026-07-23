import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { createInitialState, dropMeteor, getAvailableColumns } from './engine';
import { gamesStorageReady, Games } from './collection';
import {
  CreateLiveMatchSchema,
  DropMeteorSchema,
  JoinLiveMatchSchema,
  RematchSchema,
  StartSoloSchema,
  parseGameDocument,
  parseOrThrow,
} from './schema';
import { scheduleGameTurn } from './server/cpu';
import {
  activeGameError,
  findActiveGameForParticipant,
  findExistingWaitingLiveMatch,
  findOwnedGameOrThrow,
  isActiveParticipantDuplicate,
  isRoomCodeDuplicate,
  isWaitingLiveMatchDuplicate,
} from './server/gameAccess';
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
  return (
    game.status === 'playing' &&
    game.turn === 'rival' &&
    game.players[1]?.type === 'cpu'
  );
}

export function shouldHonorTestMode(
  requestedTestMode,
  {
    isDevelopment = Meteor.isDevelopment,
    e2eEnv = process.env.METEOR_DROP_E2E,
  } = {}
) {
  return Boolean(requestedTestMode && isDevelopment && e2eEnv === '1');
}

function createSoloDocument({ ownerId, playerId, now, testMode = false }) {
  const state = createInitialState({
    mode: 'solo',
    ownerId,
    playerId,
    now,
    testMode,
  });

  return parseGameDocument({
    ...state,
    ownerIds: [ownerId],
    participantIds: [playerId],
    players: [
      { id: playerId, ownerId, role: 'player', type: 'human' },
      { id: state.rivalId, ownerId: null, role: 'rival', type: 'cpu' },
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

    if (!(await Games.findOneAsync({ roomCode }))) {
      return roomCode;
    }
  }

  throw new Meteor.Error('room-code-unavailable', 'Unable to allocate room code');
}

Meteor.methods({
  async 'games.startSolo'(payload) {
    await gamesStorageReady;
    const {
      ownerId,
      playerId,
      testMode: requestedTestMode,
    } = parseOrThrow(StartSoloSchema, payload);
    const existingActiveGame = await findActiveGameForParticipant(ownerId, playerId);

    if (existingActiveGame) {
      if (existingActiveGame.mode === 'solo') {
        return { gameId: existingActiveGame._id };
      }

      throw activeGameError();
    }

    const now = Date.now();
    const testMode = shouldHonorTestMode(requestedTestMode);

    try {
      const gameId = await Games.insertAsync(
        createSoloDocument({ ownerId, playerId, now, testMode })
      );
      return { gameId };
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
  },

  async 'games.dropMeteor'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, gameId, column } = parseOrThrow(
      DropMeteorSchema,
      payload
    );
    const game = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const storedGame = sanitizeStoredGame(game);

    if (storedGame.status !== 'playing') {
      throw new Meteor.Error('invalid-state', 'Match is not active');
    }

    const turnPlayer = getTurnPlayer(storedGame);
    if (
      turnPlayer === null ||
      turnPlayer.type !== 'human' ||
      turnPlayer.id !== playerId ||
      turnPlayer.ownerId !== ownerId
    ) {
      throw new Meteor.Error('stale-move', 'Turn already advanced');
    }

    if (!getAvailableColumns(storedGame).includes(column)) {
      throw new Meteor.Error('column-full', 'Choose another column');
    }

    const now = Date.now();
    const transition = await persistGameTransition(
      game,
      dropMeteor(storedGame, { actorId: playerId, column, now }),
      now
    );

    if (!transition.applied || !transition.game) {
      throw new Meteor.Error('stale-move', 'Turn already advanced');
    }

    if (shouldScheduleCpu(transition.game)) {
      scheduleGameTurn(transition.game);
    }

    return { gameId };
  },

  async 'games.createLiveMatch'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId } = parseOrThrow(CreateLiveMatchSchema, payload);
    const existingWaitingGame = await findExistingWaitingLiveMatch(ownerId, playerId);

    if (existingWaitingGame) {
      return {
        gameId: existingWaitingGame._id,
        roomCode: existingWaitingGame.roomCode,
      };
    }

    if (await findActiveGameForParticipant(ownerId, playerId)) {
      throw activeGameError();
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const now = Date.now();
      const roomCode = await generateRoomCode();
      const state = createInitialState({
        mode: 'live',
        ownerId,
        playerId,
        now,
        roomCode,
      });

      try {
        const gameId = await Games.insertAsync(
          parseGameDocument({
            ...state,
            ownerIds: [ownerId],
            rivalId: null,
            participantIds: [playerId],
            players: [
              { id: playerId, ownerId, role: 'player', type: 'human' },
            ],
            status: 'waiting',
            createdAt: new Date(now),
            updatedAt: new Date(now),
          })
        );

        return { gameId, roomCode };
      } catch (error) {
        if (isWaitingLiveMatchDuplicate(error)) {
          const concurrentWaitingGame = await findExistingWaitingLiveMatch(
            ownerId,
            playerId
          );
          if (concurrentWaitingGame) {
            return {
              gameId: concurrentWaitingGame._id,
              roomCode: concurrentWaitingGame.roomCode,
            };
          }
        }

        if (isActiveParticipantDuplicate(error)) {
          const concurrentGame = await findActiveGameForParticipant(ownerId, playerId);
          if (concurrentGame?.mode === 'live' && concurrentGame.status === 'waiting') {
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

  async 'games.joinLiveMatch'(payload) {
    await gamesStorageReady;
    const { ownerId, playerId, roomCode } = parseOrThrow(JoinLiveMatchSchema, payload);
    const waitingGame = await Games.findOneAsync({
      roomCode,
      mode: 'live',
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
      mode: 'live',
      ownerId: waitingGame.ownerId,
      playerId: waitingGame.playerId,
      now,
      roomCode,
    });
    const nextDocument = parseGameDocument({
      ...state,
      ownerIds: [...waitingGame.ownerIds, ownerId],
      rivalId: playerId,
      participantIds: [waitingGame.playerId, playerId],
      players: [
        {
          id: waitingGame.playerId,
          ownerId: waitingGame.players[0].ownerId,
          role: 'player',
          type: 'human',
        },
        { id: playerId, ownerId, role: 'rival', type: 'human' },
      ],
      createdAt: waitingGame.createdAt,
      updatedAt: new Date(now),
    });

    try {
      const updatedCount = await Games.updateAsync(
        { _id: waitingGame._id, status: 'waiting' },
        { $set: nextDocument }
      );
      if (updatedCount === 0) {
        throw new Meteor.Error('not-found', 'Room code not found');
      }
    } catch (error) {
      if (isActiveParticipantDuplicate(error)) {
        throw activeGameError();
      }

      throw error;
    }

    return { gameId: waitingGame._id };
  },

  async 'games.rematch'(payload) {
    await gamesStorageReady;
    const {
      ownerId,
      playerId,
      gameId,
      testMode: requestedTestMode,
    } = parseOrThrow(RematchSchema, payload);
    const existing = await findOwnedGameOrThrow({ ownerId, playerId, gameId });
    const game = sanitizeStoredGame(existing);

    if (!['won', 'draw'].includes(game.status)) {
      throw new Meteor.Error('invalid-state', 'Match is not finished');
    }

    const existingActiveGame = await findActiveGameForParticipant(ownerId, playerId);
    if (existingActiveGame) {
      return { gameId: existingActiveGame._id };
    }

    const now = Date.now();
    const testMode = shouldHonorTestMode(requestedTestMode);
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
        mode: 'live',
        ownerId: game.ownerId,
        playerId: game.playerId,
        now,
        roomCode,
      });
      nextDocument = parseGameDocument({
        ...state,
        ownerIds: [...game.ownerIds],
        rivalId: game.rivalId,
        participantIds: [...game.participantIds],
        players: game.players,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      });
    }

    try {
      const nextGameId = await Games.insertAsync(nextDocument);
      return { gameId: nextGameId };
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
  },
});
