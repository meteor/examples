import {waitForMeteorSubscriptions} from '../../support/commands.js';

/**
 * Wait for provided ms
 * @param timeMs {number}
 */
export function wait(timeMs = 500)
{
  cy.wait(timeMs);
}

/**
 * Subscription aware visit function
 * @param url {string}
 */
export function visit(url)
{
  cy.visit(url);
  
  waitForMeteorSubscriptions();
}