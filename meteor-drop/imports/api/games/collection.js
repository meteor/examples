import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Games = new Mongo.Collection('meteorDropGames');

export const ACTIVE_STATUSES = ['waiting', 'playing'];
export const TERMINAL_STATUSES = ['won', 'draw'];
export const ROOM_CODE_INDEX_NAME = 'roomCode_unique_string';
export const WAITING_LIVE_MATCH_INDEX_NAME = 'waitingLiveMatch_unique';
export const ACTIVE_PARTICIPANT_INDEX_NAME = 'activeParticipant_unique';

async function dropIndexIfPresent(rawCollection, name) {
  try {
    await rawCollection.dropIndex(name);
  } catch (error) {
    const message = error?.message ?? '';

    if (
      error?.codeName === 'IndexNotFound' ||
      error?.codeName === 'NamespaceNotFound' ||
      message.includes('index not found') ||
      message.includes('ns not found')
    ) {
      return;
    }

    throw error;
  }
}

async function retireDuplicateActiveGames(rawCollection, now = new Date()) {
  const activeGames = await rawCollection
    .find(
      { status: { $in: ACTIVE_STATUSES } },
      {
        projection: { _id: 1, participantIds: 1 },
        sort: { updatedAt: -1, createdAt: -1, _id: 1 },
      }
    )
    .toArray();
  const claimedParticipants = new Set();
  const duplicateIds = [];

  for (const game of activeGames) {
    const participantIds = Array.isArray(game.participantIds) ? game.participantIds : [];
    if (participantIds.some((participantId) => claimedParticipants.has(participantId))) {
      duplicateIds.push(game._id);
      continue;
    }

    participantIds.forEach((participantId) => claimedParticipants.add(participantId));
  }

  if (duplicateIds.length === 0) {
    return 0;
  }

  const result = await rawCollection.updateMany(
    { _id: { $in: duplicateIds }, status: { $in: ACTIVE_STATUSES } },
    {
      $set: {
        status: 'draw',
        winner: null,
        winningCells: [],
        updatedAt: now,
      },
    }
  );

  return result.modifiedCount;
}

async function createActiveParticipantIndex(rawCollection) {
  let duplicateError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await retireDuplicateActiveGames(rawCollection);

    try {
      return await rawCollection.createIndex(
        { participantIds: 1 },
        {
          name: ACTIVE_PARTICIPANT_INDEX_NAME,
          unique: true,
          partialFilterExpression: { status: { $in: ACTIVE_STATUSES } },
        }
      );
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      duplicateError = error;
    }
  }

  throw duplicateError;
}

export async function ensureGamesIndexes() {
  const rawCollection = Games.rawCollection();
  await dropIndexIfPresent(rawCollection, 'roomCode_1');
  await dropIndexIfPresent(rawCollection, 'participantIds_1');
  await createActiveParticipantIndex(rawCollection);

  await Promise.all([
    rawCollection.createIndex(
      { roomCode: 1 },
      {
        name: ROOM_CODE_INDEX_NAME,
        unique: true,
        partialFilterExpression: { roomCode: { $type: 'string' } },
      }
    ),
    rawCollection.createIndex(
      { mode: 1, status: 1, ownerId: 1, playerId: 1 },
      {
        name: WAITING_LIVE_MATCH_INDEX_NAME,
        unique: true,
        partialFilterExpression: { mode: 'live', status: 'waiting' },
      }
    ),
    rawCollection.createIndex({ ownerId: 1, updatedAt: -1 }),
    rawCollection.createIndex({ ownerIds: 1, updatedAt: -1 }),
  ]);
}

export const gamesStorageReady = Meteor.isServer ? ensureGamesIndexes() : Promise.resolve();
