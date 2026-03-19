import {waitForMeteor} from '../../support/commands.js';

/**
 * Wait for provided ms
 * @param timeMs {number}
 */
export function wait(timeMs = 500)
{
  cy.wait(timeMs);
}

/**
 * Visit a URL and wait for Meteor to load
 * @param url {string}
 */
export function visit(url)
{
  cy.visit(url);
  waitForMeteor();
}
