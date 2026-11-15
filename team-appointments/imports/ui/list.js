import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { appointmentsTable } from '/imports/api/appointments';
import { edit, showError } from './state';

import './list.html';

Template.appointmentList.onCreated(function () {
  // Sent to the server as is, and checked there. Today is the viewer's date, for
  // whole-day appointments.
  const now = new Date();
  const today = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0')).join('-');
  this.filter = new ReactiveVar({ mine: false, upcoming: true, today });
});

Template.appointmentList.helpers({
  table: () => appointmentsTable,
  filter: () => Template.instance().filter.get(),
  open: () => (appointment) => edit(appointment._id),
  showError: () => showError,
});

Template.appointmentList.events({
  'change .mine, change .upcoming'(event, instance) {
    instance.filter.set({ ...instance.filter.get(), [event.currentTarget.className]: event.currentTarget.checked });
  },
});

// A cell gets { doc, value, column }: here value is the owner's id.
Template.ownerCell.helpers({
  owner() {
    const user = Meteor.users.findOne(this.value);
    return user && { name: user.profile?.name ?? user.username, color: user.profile?.color };
  },
});
