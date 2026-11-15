import { Roles } from 'meteor/roles';

// Who may do what, with the roles of Meteor's core roles package:
//   admin: every appointment; member: their own; viewer: none.
// One rule, used on the client to offer a gesture at all, and on the server to
// allow the change.
export const ROLES = ['admin', 'member', 'viewer'];
const EDITORS = ['admin', 'member'];

const allows = (isAdmin, isEditor, userId, appointment) => isAdmin || (isEditor && appointment.ownerId === userId);

// Client: synchronous and reactive, on the role assignments the server publishes.
export const canChange = (userId, appointment) => Boolean(userId)
  && allows(Roles.userIsInRole(userId, 'admin'), Roles.userIsInRole(userId, EDITORS), userId, appointment);

export const canCreate = (userId) => Boolean(userId) && Roles.userIsInRole(userId, EDITORS);

// Server: the same rules, read from the database.
export async function canChangeAsync(userId, appointment) {
  if (!userId) return false;
  const [isAdmin, isEditor] = await Promise.all([Roles.userIsInRoleAsync(userId, 'admin'), Roles.userIsInRoleAsync(userId, EDITORS)]);
  return allows(isAdmin, isEditor, userId, appointment);
}

export const canCreateAsync = async (userId) => Boolean(userId) && Roles.userIsInRoleAsync(userId, EDITORS);

export const isTeamMember = async (userId) => Boolean(userId) && Roles.userIsInRoleAsync(userId, ROLES);
