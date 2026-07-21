import { Mongo } from 'meteor/mongo';

export const Games = new Mongo.Collection('games');

export const ACTIVE_STATUSES = ['waiting', 'playing'];
export const TERMINAL_STATUSES = ['won', 'lost'];

async function dropIndexIfPresent(rawCollection, name) {
  try {
    await rawCollection.dropIndex(name);
  } catch (error) {
    const message = error?.message ?? '';

    if (error?.codeName === 'IndexNotFound' || message.includes('index not found')) {
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
        name: 'roomCode_unique_string',
        unique: true,
        partialFilterExpression: { roomCode: { $type: 'string' } },
      }
    ),
    rawCollection.createIndex({ ownerId: 1, updatedAt: -1 }),
    rawCollection.createIndex({ participantIds: 1 }),
    rawCollection.createIndex({ ownerIds: 1, updatedAt: -1 }),
  ]);
}
