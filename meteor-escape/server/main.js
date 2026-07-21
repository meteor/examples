import { Meteor } from 'meteor/meteor';
import '../imports/api/games/methods';
import '../imports/api/games/publications';
import { gamesStorageReady } from '../imports/api/games/collection';
import { recoverActiveGameTurns } from '../imports/api/games/server/cpu';

Meteor.startup(() => {
  void gamesStorageReady
    .then(() => recoverActiveGameTurns())
    .catch((error) => {
      Meteor._debug('Meteor Escape startup recovery failed', error);
      Meteor.setTimeout(() => {
        throw error;
      }, 0);
    });
});
