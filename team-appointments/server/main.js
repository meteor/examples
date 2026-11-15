import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/roles';
import { Presence } from 'meteor/dupontbertrand:presence';
import { Appointments, appointmentsTable } from '/imports/api/appointments';
import { ROLES, isTeamMember } from '/imports/api/permissions';
import { TEAM, PAGES, DEMO_PASSWORD, roomOf } from '/imports/api/team';
import { seedAppointments } from './seed';

// The calendar's range on screen, for anyone on the team.
Meteor.publish('appointments.between', async function (start, end) {
  check(start, Date);
  check(end, Date);
  if (!(await isTeamMember(this.userId))) return this.ready();
  return Appointments.find({ start: { $lt: end }, end: { $gt: start } });
});

// One appointment, whole, for the editor.
Meteor.publish('appointments.one', async function (id) {
  check(id, String);
  if (!(await isTeamMember(this.userId))) return this.ready();
  return Appointments.find(id);
});

// The list page. Filters come from the browser: check them.
const Day = Match.Where((value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)));
appointmentsTable.publish(async ({ userId, filter }) => {
  if (!(await isTeamMember(userId))) return null;
  check(filter, Match.Maybe({ mine: Match.Optional(Boolean), upcoming: Match.Optional(Boolean), today: Match.Optional(Day) }));
  return {
    ...(filter?.mine ? { ownerId: userId } : {}),
    // Whole days end at a UTC midnight: compare them with the viewer's date.
    ...(filter?.upcoming ? { $or: [
      { allDay: false, end: { $gt: new Date() } },
      { allDay: true, end: { $gt: new Date(`${filter.today ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`) } },
    ] } : {}),
  };
});

// Names and colours of the team, for the calendar and the table.
Meteor.publish('team', async function () {
  if (!(await isTeamMember(this.userId))) return this.ready();
  return Meteor.users.find({}, { fields: { username: 1, 'profile.name': 1, 'profile.color': 1 } });
});

// The roles package publishes nothing: each user gets their own assignments, which
// Roles.userIsInRole reads on the client.
Meteor.publish('roles.mine', function () {
  if (!this.userId) return this.ready();
  return Meteor.roleAssignment.find({ 'user._id': this.userId });
});

// Who is on the same page. The app's rule comes first: only the team.
Meteor.publish('page.presence', async function (page) {
  check(page, Match.Where((value) => PAGES.includes(value)));
  if (!(await isTeamMember(this.userId))) return this.ready();
  return Presence.publish(this, roomOf(page));
});

// The same colour on the calendar and on the pointer.
Presence.configure({
  async identify(userId) {
    const user = await Meteor.users.findOneAsync(userId, { fields: { username: 1, profile: 1 } });
    return { name: user?.profile?.name ?? user?.username, color: user?.profile?.color };
  },
});

// The team is seeded below; nobody signs up from the browser. Names and colours
// live in profile, which Meteor lets each user change unless the app says no.
Accounts.config({ forbidClientAccountCreation: true });
Meteor.users.deny({ update: () => true });

Meteor.startup(async () => {
  for (const role of ROLES) await Roles.createRoleAsync(role, { unlessExists: true });
  for (const { username, name, color, role } of TEAM) {
    const existing = await Accounts.findUserByUsername(username);
    const userId = existing?._id ?? await Accounts.createUserAsync({ username, password: DEMO_PASSWORD, profile: { name, color } });
    await Roles.setUserRolesAsync(userId, role);
  }
  await Appointments.createIndexAsync({ start: 1, end: 1 });
  if (!(await Appointments.find().countAsync())) await seedAppointments();
});
