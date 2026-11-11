import { Meteor } from 'meteor/meteor';
import { Tasks } from './collection';

Meteor.publish('tasks', function () {
  return Tasks.find({}, { sort: { createdAt: -1 }, limit: 100 });
});
