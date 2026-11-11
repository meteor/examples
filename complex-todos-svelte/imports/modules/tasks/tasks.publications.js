import {Meteor} from 'meteor/meteor';
import {Tasks} from './database/tasks';
import {TASKS_PUBLICATION} from './enums/publications.js';

Meteor.publish(TASKS_PUBLICATION.TASKS, function tasksPublication()
{
  return Tasks.find({
    $or: [
      {private: {$ne: true}},
      {owner: this.userId}
    ]
  });
});