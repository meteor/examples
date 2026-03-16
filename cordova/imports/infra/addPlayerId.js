import {Meteor} from 'meteor/meteor';

Meteor.methods({
  async addPlayerId({playerId}) {
    this.unblock();
    if (Meteor.isClient || !this.userId || !playerId) return null;

    await Meteor.users.updateAsync(this.userId, {$addToSet: {playersIds: playerId}});
  },
});
