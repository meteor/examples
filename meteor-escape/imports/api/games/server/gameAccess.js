import { Meteor } from 'meteor/meteor';
import {
  ACTIVE_PARTICIPANT_INDEX_NAME,
  ACTIVE_STATUSES,
  Games,
  ROOM_CODE_INDEX_NAME,
  WAITING_CREW_OWNERSHIP_INDEX_NAME,
} from '../collection';

export async function findOwnedGameOrThrow({ ownerId, playerId, gameId }) {
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

export function findExistingWaitingCrewGame(ownerId, playerId) {
  return Games.findOneAsync(buildWaitingCaptainQuery(ownerId, playerId));
}

export function findActiveGameForParticipant(ownerId, playerId) {
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

export function isWaitingCrewOwnershipDuplicate(error) {
  if (!isDuplicateKeyError(error)) return false;
  if (errorMentionsIndex(error, WAITING_CREW_OWNERSHIP_INDEX_NAME)) return true;

  const keyPattern = error?.keyPattern;
  return Boolean(
    keyPattern?.mode === 1 &&
      keyPattern?.status === 1 &&
      keyPattern?.ownerId === 1 &&
      keyPattern?.playerId === 1
  );
}

export function isRoomCodeDuplicate(error) {
  if (!isDuplicateKeyError(error)) return false;
  if (errorMentionsIndex(error, ROOM_CODE_INDEX_NAME)) return true;
  return error?.keyPattern?.roomCode === 1;
}

export function isActiveParticipantDuplicate(error) {
  if (!isDuplicateKeyError(error)) return false;
  return (
    errorMentionsIndex(error, ACTIVE_PARTICIPANT_INDEX_NAME) ||
    error?.keyPattern?.participantIds === 1
  );
}

export function activeGameError() {
  return new Meteor.Error('active-game', 'Finish or resume the active mission first');
}

