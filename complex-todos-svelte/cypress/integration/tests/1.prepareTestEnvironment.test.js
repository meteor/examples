import {visit, wait} from '../utilities/commons.js';

describe('Prepare Test Environment', function()
{
  it('Clear database', function()
  {
    visit('/');
    
    cy.window().then((win) =>
    {
      win.Meteor.call('clear.database');
    });
  
    wait(1000);
    
    cy.url().should('contain', 'localhost');
  });
  
  it('Insert dummy data', function()
  {
    visit('/');
  
    cy.window().then((win) =>
    {
      win.Meteor.call('insert.dummy.data');
    });
  
    wait(1000);
    
    cy.url().should('contain', 'localhost');
  });
});
