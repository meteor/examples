import { Meteor } from 'meteor/meteor';
import '../imports/api/games/methods';
import '../imports/api/games/publications';
import { ensureGamesIndexes } from '../imports/api/games/collection';

Meteor.startup(() => {
  void ensureGamesIndexes().catch((error) => {
    Meteor._debug('Meteor Escape index creation failed', error);
  });
});
