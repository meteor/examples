import {visit} from './utilities/commons.js';

describe('Navigation', function()
{
  it('Should load the tasks page by default', function()
  {
    visit('/');

    cy.get('[data-testid="nav-tasks"]').should('exist');
    cy.get('[data-testid="nav-about"]').should('exist');
  });

  it('Should navigate to About page', function()
  {
    visit('/');

    cy.get('[data-testid="nav-about"]').click();
    cy.url().should('include', '/about');
    cy.contains('About This App').should('be.visible');
  });

  it('Should navigate back to Tasks page', function()
  {
    visit('/');

    cy.get('[data-testid="nav-about"]').click();
    cy.get('[data-testid="nav-tasks"]').click();
    cy.url().should('include', '/tasks');
  });
});
