// The single place that decides who may read the dashboard. This example has
// no accounts, so everyone may. In a real app, check a role (Roles is part of
// Meteor core since 3.4):
//
//   import { Roles } from 'meteor/roles';
//
//   export async function requireAdmin(userId) {
//     return userId != null && Roles.userIsInRoleAsync(userId, 'admin');
//   }
export async function requireAdmin(_userId) {
  return true;
}
