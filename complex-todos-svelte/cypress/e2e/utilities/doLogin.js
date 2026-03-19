import {TEST} from '../constants/test.js';
import {waitForMeteor} from '../../support/commands.js';

/**
 * Login with test user credentials via the Dialog modal
 */
export function doLogin(username = TEST.USER.TEST.USERNAME, password = TEST.USER.TEST.PASSWORD)
{
  // Open the sign-in dialog
  cy.get('[data-testid="open-sign-in-btn"]').click();

  // Wait for dialog to appear
  cy.get('[data-testid="username-input"]').should('be.visible');

  cy.get('[data-testid="username-input"]').clear().type(username);
  cy.get('[data-testid="password-input"]').clear().type(password);
  cy.get('[data-testid="submit-auth-btn"]').click();

  // Verify we're logged in
  cy.get('[data-testid="logged-in-user"]').should('contain', username);

  waitForMeteor();
}
