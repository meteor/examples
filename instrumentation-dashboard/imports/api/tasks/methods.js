import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Tasks } from './collection';

Meteor.methods({
  async 'tasks.insert'(text) {
    check(text, String);
    const trimmed = text.trim();
    if (!trimmed) throw new Meteor.Error('empty-task', 'A task needs some text');
    return Tasks.insertAsync({ text: trimmed, checked: false, createdAt: new Date() });
  },

  async 'tasks.toggle'(taskId, checked) {
    check(taskId, String);
    check(checked, Boolean);
    return Tasks.updateAsync(taskId, { $set: { checked } });
  },

  async 'tasks.remove'(taskId) {
    check(taskId, String);
    return Tasks.removeAsync(taskId);
  },
});
