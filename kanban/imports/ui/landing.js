import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { navigate } from './app';

import './landing.html';

Template.landingPage.onCreated(function () {
  this.error = new ReactiveVar(null);
});

Template.landingPage.helpers({
  // Since Blaze 3.1 a helper may return a Promise: `#let` unwraps it and
  // `@pending`, `@rejected` and `@resolved` tell the template where it stands.
  siteStats: () => Meteor.callAsync('boards.stats'),
  error: () => Template.instance().error.get(),
});

Template.landingPage.events({
  async 'submit .new-board'(event, instance) {
    event.preventDefault();
    try {
      const boardId = await Meteor.callAsync('boards.create', event.currentTarget.elements.title.value);
      navigate(`/b/${boardId}`);
    } catch (error) {
      instance.error.set(error.reason ?? error.message);
    }
  },
});
