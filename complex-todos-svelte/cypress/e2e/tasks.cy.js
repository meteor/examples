import {visit} from './utilities/commons.js';
import {TEST} from './constants/test.js';
import {doLogin} from './utilities/doLogin.js';

describe('Tasks', function()
{
  beforeEach(function()
  {
    visit('/');
    doLogin();
  });

  it('Should show the add task form when logged in', function()
  {
    cy.get('[data-testid="new-task-input"]').should('be.visible');
    cy.get('[data-testid="add-task-btn"]').should('be.visible');
  });

  it('Should add a new task', function()
  {
    cy.get('[data-testid="new-task-input"]').type(TEST.TASK.PUBLIC);
    cy.get('[data-testid="add-task-btn"]').click();

    cy.get('[data-testid="task-text"]').should('contain', TEST.TASK.PUBLIC);
  });

  it('Should toggle task as checked', function()
  {
    // Make sure there's a task first
    cy.get('[data-testid="new-task-input"]').type('Task to check');
    cy.get('[data-testid="add-task-btn"]').click();
    cy.get('[data-testid="task-card"]').should('exist');

    cy.get('[data-testid="task-checkbox"]').first().click();
    cy.get('[data-testid="task-card"]').first().should('have.class', 'opacity-50');
  });

  it('Should toggle task privacy', function()
  {
    cy.get('[data-testid="new-task-input"]').type('Task for privacy');
    cy.get('[data-testid="add-task-btn"]').click();
    cy.get('[data-testid="task-card"]').should('exist');

    cy.get('[data-testid="toggle-private-btn"]').first().click();
    cy.contains('Private').should('be.visible');
  });

  it('Should delete a task', function()
  {
    cy.get('[data-testid="new-task-input"]').type('Task to delete');
    cy.get('[data-testid="add-task-btn"]').click();
    cy.get('[data-testid="task-card"]').should('exist');

    cy.get('[data-testid="task-card"]').then(($cards) =>
    {
      const count = $cards.length;
      cy.get('[data-testid="delete-task-btn"]').first().click();
      cy.get('[data-testid="task-card"]').should('have.length', count - 1);
    });
  });
});
