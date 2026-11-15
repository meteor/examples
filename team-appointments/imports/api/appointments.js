import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { BlazeTable } from 'meteor/dupontbertrand:table';
import { canChangeAsync, canCreateAsync } from './permissions';

// { title, client, notes, start, end, allDay, ownerId, revision }, revision being
// a random id the server draws on every change.
export const Appointments = new Mongo.Collection('appointments');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const Text = (max) => Match.Where((value) => typeof value === 'string' && value.length <= max);
const Times = { start: Date, end: Date, allDay: Boolean };
const Details = { title: Text(80), client: Text(80), notes: Text(1000) };

function checkTimes({ start, end, allDay }) {
  const duration = end - start;
  if (!(duration > 0)) throw new Meteor.Error('invalid', 'An appointment ends after it starts.');
  if (duration > (allDay ? 7 * DAY : 12 * HOUR)) throw new Meteor.Error('invalid', 'An appointment lasts at most 12 hours, or 7 days for a whole-day one.');
}

// Every move or edit carries the revision the user saw: if someone changed the
// appointment since, the server refuses and the stub is rolled back. Revisions are
// drawn by the server only, so a stub never shows one the server would accept.
const newRevision = (method) => (method.isSimulation ? {} : { revision: Random.id() });

async function change(method, id, revision, changes) {
  if (!method.isSimulation) {
    const appointment = await Appointments.findOneAsync(id);
    if (!appointment) throw new Meteor.Error('not-found', 'This appointment no longer exists.');
    if (!(await canChangeAsync(method.userId, appointment))) throw new Meteor.Error('forbidden', 'Your role does not allow changing this appointment.');
  }
  const changed = await Appointments.updateAsync({ _id: id, revision }, { $set: { ...changes, ...newRevision(method) } });
  if (!changed && !method.isSimulation) throw new Meteor.Error('stale', 'Someone changed this appointment first.');
}

// Loaded on both sides: every Method has a stub, so the calendar and the table
// show a change at once, and the server's refusal undoes it.
Meteor.methods({
  async 'appointments.create'(fields) {
    check(fields, { ...Times, title: Details.title });
    checkTimes(fields);
    if (!this.isSimulation && !(await canCreateAsync(this.userId))) {
      throw new Meteor.Error('forbidden', 'Your role does not allow creating appointments.');
    }
    return Appointments.insertAsync({ ...fields, client: '', notes: '', ownerId: this.userId, ...newRevision(this) });
  },

  async 'appointments.move'(id, revision, times) {
    check(id, String);
    check(revision, String);
    check(times, Times);
    checkTimes(times);
    await change(this, id, revision, times);
  },

  async 'appointments.update'(id, revision, details) {
    check(id, String);
    check(revision, String);
    check(details, Details);
    if (!details.title.trim()) throw new Meteor.Error('invalid', 'An appointment needs a title.');
    await change(this, id, revision, { ...details, title: details.title.trim() });
  },

  async 'appointments.remove'(id) {
    check(id, String);
    const appointment = await Appointments.findOneAsync(id);
    if (!this.isSimulation && appointment && !(await canChangeAsync(this.userId, appointment))) {
      throw new Meteor.Error('forbidden', 'Your role does not allow deleting this appointment.');
    }
    await Appointments.removeAsync(id);
  },
});

// The list page: sorted, searched and paged by the server. The same definition is
// loaded on both sides; server/main.js says who sees which rows.
export const appointmentsTable = new BlazeTable({
  name: 'appointments',
  collection: Appointments,
  columns: [
    { key: 'start', title: 'When', format: (start, appointment, locale) => when(appointment, locale) },
    { key: 'title', title: 'Appointment', searchable: true },
    { key: 'client', title: 'Client', searchable: true },
    { key: 'ownerId', title: 'With', sortable: false, template: 'ownerCell' },
  ],
  extraFields: ['end', 'allDay'],
  sort: [['start', 1]],
  pageSize: 10,
});

export function when({ start, end, allDay }, locale) {
  // Whole days are stored as UTC midnights, the end excluded.
  if (allDay) return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).formatRange(start, new Date(end - DAY));
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).formatRange(start, end);
}
