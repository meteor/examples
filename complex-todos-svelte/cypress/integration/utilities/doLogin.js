import {waitForMeteorSubscriptions} from '../../support/commands.js';
import {TEST} from "../constants/test.js";

/**
 * Login with provided user name and password (subscription aware)
 * @param username {string}
 * @param password {string}
 */
export function doLogin(username = TEST.USER.DEMO.USERNAME, password = TEST.USER.DEMO.PASSWORD)
{
  cy.visit('/');

  cy.get('#login-sign-in-link').click();

  cy.get('#login-username').clear().type(TEST.USER.TEST.USERNAME);

  cy.get('#login-password').clear().type(TEST.USER.TEST.PASSWORD);

  cy.get('#login-buttons-password').click();

  cy.get('#login-name-link').should('contain', TEST.USER.TEST.USERNAME);

  cy.window().its('Meteor').invoke('userId').should((userId) =>
  {
    expect(userId).not.to.be.null;
  });

  waitForMeteorSubscriptions();
}
