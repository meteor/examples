import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { TEAM, DEMO_PASSWORD } from '/imports/api/team';
import { page, room, notice } from './state';

import './app.html';
import './calendar';
import './list';
import './editor';

Template.app.onCreated(function () {
  this.subscribe('team');
  this.subscribe('roles.mine');
  // Being on a page is subscribing to its room: switching pages leaves one room
  // and joins the other. Meteor runs the subscription again when the user changes.
  this.autorun(() => this.subscribe('page.presence', page.get()));
  // A demo: sign in as the first account, then switch from the header.
  this.autorun(() => {
    if (!Meteor.userId() && !Meteor.loggingIn()) Meteor.loginWithPassword(TEAM[0].username, DEMO_PASSWORD);
  });
});

Template.app.helpers({
  room,
  team: () => TEAM,
  isMe: (username) => Meteor.user()?.username === username,
  current: (name) => (page.get() === name ? 'page' : null),
  onList: () => page.get() === 'list',
  notice: () => notice.get(),
});

Template.app.events({
  'change .sign-in'(event) {
    Meteor.loginWithPassword(event.currentTarget.value, DEMO_PASSWORD);
  },
  'click .dismiss'() {
    notice.set('');
  },
});
