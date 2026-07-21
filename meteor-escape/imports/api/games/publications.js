import { Meteor } from 'meteor/meteor';
import { ACTIVE_STATUSES, Games, TERMINAL_STATUSES } from './collection';

Meteor.publish('games.active', function (ownerId, playerId) {
  if (
    typeof ownerId !== 'string' ||
    ownerId.length === 0 ||
    typeof playerId !== 'string' ||
    playerId.length === 0
  ) {
    return this.ready();
  }

  return Games.find(
    {
      players: {
        $elemMatch: {
          id: playerId,
          ownerId,
        },
      },
      status: { $in: ACTIVE_STATUSES },
    },
    {
      sort: { updatedAt: -1 },
    }
  );
});

Meteor.publish('games.recent', function (ownerId) {
  if (typeof ownerId !== 'string' || ownerId.length === 0) {
    return this.ready();
  }

  return Games.find(
    {
      ownerIds: ownerId,
      status: { $in: TERMINAL_STATUSES },
    },
    {
      sort: { updatedAt: -1 },
      limit: 10,
    }
  );
});
