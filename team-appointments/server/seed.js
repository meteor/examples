import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Appointments } from '/imports/api/appointments';

// A fortnight of appointments around today, so the calendar opens on a full week.
const PLAN = [
  // [day from this week's Monday, start hour, hours, title, client, username]
  [0, 9, 1, 'Kickoff call', 'Northwind', 'maya'],
  [0, 14, 1.5, 'Design review', 'Contoso', 'leo'],
  [1, 10, 1, 'Quarterly check in', 'Fabrikam', 'sara'],
  [1, 15, 2, 'Workshop', 'Northwind', 'leo'],
  [2, 9, 0.5, 'Stand up with the client', 'Tailspin', 'maya'],
  [2, 11, 1, 'Contract renewal', 'Contoso', 'sara'],
  [3, 13, 1, 'Demo of the new release', 'Fabrikam', 'leo'],
  [3, 16, 1, 'Pricing call', 'Tailspin', 'maya'],
  [4, 10, 2, 'Onboarding', 'Wide World', 'sara'],
  [7, 9, 1, 'Kickoff call', 'Wide World', 'leo'],
  [8, 14, 1, 'Follow up', 'Northwind', 'sara'],
  [9, 11, 1.5, 'Roadmap review', 'Contoso', 'maya'],
];

export async function seedAppointments() {
  const users = await Meteor.users.find({}, { fields: { username: 1 } }).fetchAsync();
  const idOf = Object.fromEntries(users.map((user) => [user.username, user._id]));
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  for (const [day, hour, hours, title, client, username] of PLAN) {
    const start = new Date(monday);
    start.setDate(monday.getDate() + day);
    start.setHours(Math.floor(hour), (hour % 1) * 60);
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    await Appointments.insertAsync({ title, client, notes: '', start, end, allDay: false, ownerId: idOf[username], revision: Random.id() });
  }
  // A whole-day event, stored as UTC midnights like the calendar does.
  const offsite = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4));
  await Appointments.insertAsync({ title: 'Team offsite', client: '', notes: '', start: offsite, end: new Date(offsite.getTime() + 24 * 60 * 60 * 1000), allDay: true, ownerId: idOf.maya, revision: Random.id() });
}
