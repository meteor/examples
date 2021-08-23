import {Meteor} from 'meteor/meteor';
import {Tasks} from '../database/tasks.js';
import {TASKS_PUBLICATION} from '../enums/publications.js';

Meteor.publish(TASKS_PUBLICATION.TASKS, function tasksPublication()
{
  return Tasks.find({
    $or: [
      {private: {$ne: true}},
      {owner: this.userId}
    ]
  });
});