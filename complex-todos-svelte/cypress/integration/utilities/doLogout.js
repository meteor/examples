export function doLogout()
{
  cy.window().then((win) =>
  {
    win.Meteor.logout();
  });
}