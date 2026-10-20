import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tasks } from '/imports/api/tasks/collection';

import './tasks.html';

const taskIdOf = (event) => event.currentTarget.closest('li').dataset.id;

Template.tasksPage.onCreated(function () {
  this.error = new ReactiveVar(null);
  this.subscribe('tasks');
});

Template.tasksPage.helpers({
  tasks: () => Tasks.find({}, { sort: { createdAt: -1 } }),
  error: () => Template.instance().error.get(),
  taskClass: (task) => (task.checked ? 'checked' : ''),
});

Template.tasksPage.events({
  async 'submit .new-task'(event, instance) {
    event.preventDefault();
    const input = event.currentTarget.elements.text;
    try {
      await Meteor.callAsync('tasks.insert', input.value);
      input.value = '';
      instance.error.set(null);
    } catch (error) {
      instance.error.set(error.reason ?? error.message);
    }
  },

  async 'change .toggle'(event, instance) {
    await Meteor.callAsync('tasks.toggle', taskIdOf(event), event.currentTarget.checked)
      .catch((error) => instance.error.set(error.reason ?? error.message));
  },

  async 'click .remove'(event, instance) {
    await Meteor.callAsync('tasks.remove', taskIdOf(event))
      .catch((error) => instance.error.set(error.reason ?? error.message));
  },
});
