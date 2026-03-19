/**
 * Logout by clicking the Sign Out button
 */
export function doLogout()
{
  cy.get('[data-testid="sign-out-btn"]').click();
}
