import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Presence } from 'meteor/dupontbertrand:presence';
import { Appointments } from '/imports/api/appointments';
import { canChange, canCreate } from '/imports/api/permissions';
import { room, edit, showError } from './state';

import './calendar.html';

Template.appointmentCalendar.onCreated(function () {
  // The calendar says which range it shows; only that range is published.
  this.range = new ReactiveVar(null);
  this.autorun(() => {
    const range = this.range.get();
    if (range) this.subscribe('appointments.between', range.start, range.end);
  });
});

// Functions given to the calendar come from helpers that return them.
Template.appointmentCalendar.helpers({
  room,
  appointments: () => Appointments.find({}, { sort: { start: 1 } }),
  setRange() {
    const instance = Template.instance();
    return (range) => instance.range.set(range);
  },
  // The Meteor.callAsync promise itself: the calendar reads its stubPromise to
  // show the move at once.
  move: () => ({ _id, revision, allDay }, { start, end }) =>
    Meteor.callAsync('appointments.move', _id, revision, { start, end, allDay: Boolean(allDay) }),
  create: () => ({ start, end, allDay }) => {
    const call = Meteor.callAsync('appointments.create', { title: 'New appointment', start, end, allDay: Boolean(allDay) });
    call.stubPromise.then(edit, () => {});
    call.catch(showError);
    return call;
  },
  open: () => (appointment) => edit(appointment._id),
  showError: () => showError,
  eventColor: () => (appointment) => Meteor.users.findOne(appointment.ownerId)?.profile?.color,
  canMove: () => (appointment) => canChange(Meteor.userId(), appointment),
  canSelect: () => () => canCreate(Meteor.userId()),
  mayCreate: () => canCreate(Meteor.userId()),
  businessHours: () => ({ days: [1, 2, 3, 4, 5], start: 9, end: 18 }),
});

// The others who have this appointment open in their editor.
Template.appointmentEvent.helpers({
  editors() {
    return Presence.members(room()).filter((member) => member.state?.editing === this._id);
  },
});
