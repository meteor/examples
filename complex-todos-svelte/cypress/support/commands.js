// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

Cypress.Commands.add('allSubscriptionsReady', (options = {}) =>
{
  const log = {
    name: 'allSubscriptionsReady'
  };
  
  const getValue = () =>
  {
    return cy.state('window').DDP._allSubscriptionsReady();
  };
  
  const resolveValue = () =>
  {
    return Cypress.Promise.try(getValue).then((value) =>
    {
      return cy.verifyUpcomingAssertions(value, options, {
        onRetry: resolveValue
      });
    });
  };
  
  return resolveValue().then((value) =>
  {
    Cypress.log(log);
    return value;
  });
});

export function waitForMeteorSubscriptions()
{
  cy.window().its('DDP').invoke('_allSubscriptionsReady').should((ready) =>
  {
    expect(ready).to.be.true;
  });
}
