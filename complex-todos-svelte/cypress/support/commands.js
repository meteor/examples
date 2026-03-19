/**
 * Wait for Meteor to be loaded and ready on the page.
 */
export function waitForMeteor()
{
  cy.window({timeout: 15000}).should('have.property', 'Meteor');
}
