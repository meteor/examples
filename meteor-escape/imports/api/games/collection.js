import { Mongo } from 'meteor/mongo';

export const Games = new Mongo.Collection('games');

export const ACTIVE_STATUSES = ['waiting', 'playing'];
export const TERMINAL_STATUSES = ['won', 'lost'];
export const ROOM_CODE_INDEX_NAME = 'roomCode_unique_string';
export const WAITING_CREW_OWNERSHIP_INDEX_NAME = 'waitingCrewOwnership_unique';

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

export async function ensureGamesIndexes() {
  const rawCollection = Games.rawCollection();
  await dropIndexIfPresent(rawCollection, 'roomCode_1');

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
        name: WAITING_CREW_OWNERSHIP_INDEX_NAME,
        unique: true,
        partialFilterExpression: { mode: 'crew', status: 'waiting' },
      }
    ),
    rawCollection.createIndex({ ownerId: 1, updatedAt: -1 }),
    rawCollection.createIndex({ participantIds: 1 }),
    rawCollection.createIndex({ ownerIds: 1, updatedAt: -1 }),
  ]);
}
