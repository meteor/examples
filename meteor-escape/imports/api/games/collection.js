import { Mongo } from 'meteor/mongo';

export const Games = new Mongo.Collection('games');

export const ACTIVE_STATUSES = ['waiting', 'playing'];
export const TERMINAL_STATUSES = ['won', 'lost'];

export async function ensureGamesIndexes() {
  const rawCollection = Games.rawCollection();

  await Promise.all([
    rawCollection.createIndex({ roomCode: 1 }, { unique: true, sparse: true }),
    rawCollection.createIndex({ ownerId: 1, updatedAt: -1 }),
    rawCollection.createIndex({ participantIds: 1 }),
    rawCollection.createIndex({ ownerIds: 1, updatedAt: -1 }),
  ]);
}
