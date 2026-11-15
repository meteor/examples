import assert from 'assert';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/roles';
import { Appointments } from '/imports/api/appointments';

const HOUR = 60 * 60 * 1000;
const start = new Date('2026-11-16T09:00:00Z');
const end = new Date(start.getTime() + HOUR);

// Calls a Method on the server as a given user.
const as = (userId, name, ...args) => Meteor.server.method_handlers[name].apply({ userId, isSimulation: false }, args);

const users = {};

describe('appointment methods', function () {
  before(async function () {
    for (const role of ['admin', 'member', 'viewer']) await Roles.createRoleAsync(role, { unlessExists: true });
    for (const [username, role] of [['admin', 'admin'], ['member', 'member'], ['other', 'member'], ['viewer', 'viewer']]) {
      const existing = await Accounts.findUserByUsername(username);
      users[username] = existing?._id ?? await Accounts.createUserAsync({ username, password: 'test' });
      await Roles.setUserRolesAsync(users[username], role);
    }
  });

  beforeEach(async function () {
    await Appointments.removeAsync({});
  });

  const create = (username, fields = {}) => as(users[username], 'appointments.create', { title: 'Call', start, end, allDay: false, ...fields });

  const revisionOf = async (id) => (await Appointments.findOneAsync(id)).revision;

  it('creates an appointment owned by its author, with a revision drawn by the server', async function () {
    const id = await create('member');
    const appointment = await Appointments.findOneAsync(id);
    assert.deepStrictEqual([appointment.ownerId, typeof appointment.revision, appointment.client], [users.member, 'string', '']);
  });

  it('lets nobody but admins and members create one', async function () {
    await assert.rejects(create('viewer'), { error: 'forbidden' });
    await assert.rejects(as(null, 'appointments.create', { title: 'Call', start, end, allDay: false }), { error: 'forbidden' });
  });

  it('refuses an appointment that ends before it starts or lasts too long', async function () {
    await assert.rejects(create('member', { end: start }), { error: 'invalid' });
    await assert.rejects(create('member', { end: new Date(start.getTime() + 13 * HOUR) }), { error: 'invalid' });
  });

  it('lets a member change their own appointments only, and an admin any', async function () {
    const id = await create('member');
    const later = { start: new Date(start.getTime() + HOUR), end: new Date(end.getTime() + HOUR), allDay: false };
    const first = await revisionOf(id);
    await assert.rejects(as(users.other, 'appointments.move', id, first, later), { error: 'forbidden' });
    await assert.rejects(as(users.viewer, 'appointments.move', id, first, later), { error: 'forbidden' });
    await as(users.member, 'appointments.move', id, first, later);
    const second = await revisionOf(id);
    assert.notStrictEqual(second, first);
    await as(users.admin, 'appointments.update', id, second, { title: 'Call back', client: 'Contoso', notes: '' });
    const appointment = await Appointments.findOneAsync(id);
    assert.deepStrictEqual([appointment.start, appointment.title], [later.start, 'Call back']);
  });

  it('refuses a change made on an outdated revision', async function () {
    const id = await create('member');
    const seen = await revisionOf(id);
    await as(users.member, 'appointments.update', id, seen, { title: 'First', client: '', notes: '' });
    await assert.rejects(as(users.admin, 'appointments.update', id, seen, { title: 'Second', client: '', notes: '' }), { error: 'stale' });
    assert.strictEqual((await Appointments.findOneAsync(id)).title, 'First');
  });

  it('refuses an empty title', async function () {
    const id = await create('member');
    await assert.rejects(as(users.member, 'appointments.update', id, await revisionOf(id), { title: '   ', client: '', notes: '' }), { error: 'invalid' });
  });

  it('leaves the revision alone in the stub, so that no client can predict the next one', async function () {
    const id = await create('member');
    const seen = await revisionOf(id);
    await Meteor.server.method_handlers['appointments.update'].apply({ userId: users.member, isSimulation: true }, [id, seen, { title: 'Stub', client: '', notes: '' }]);
    assert.deepStrictEqual([(await Appointments.findOneAsync(id)).title, await revisionOf(id)], ['Stub', seen]);
  });

  it('lets only those who may change it delete it', async function () {
    const id = await create('member');
    await assert.rejects(as(users.other, 'appointments.remove', id), { error: 'forbidden' });
    await as(users.admin, 'appointments.remove', id);
    assert.strictEqual(await Appointments.findOneAsync(id), undefined);
  });
});
