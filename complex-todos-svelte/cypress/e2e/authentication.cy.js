import {visit} from './utilities/commons.js';
import {TEST} from './constants/test.js';
import {doLogin} from './utilities/doLogin.js';
import {doLogout} from './utilities/doLogout.js';

describe('Authentication', function()
{
  beforeEach(function()
  {
    visit('/');
  });

  it('Sign in - Fail - User not found', function()
  {
    cy.get('[data-testid="open-sign-in-btn"]').click();
    cy.get('[data-testid="username-input"]').should('be.visible');

    cy.get('[data-testid="username-input"]').clear().type('nonexistentuser');
    cy.get('[data-testid="password-input"]').clear().type('somepassword');
    cy.get('[data-testid="submit-auth-btn"]').click();

    cy.get('[data-testid="auth-error"]').should('be.visible');
  });

  it('Sign up - Success', function()
  {
    cy.get('[data-testid="open-sign-in-btn"]').click();
    cy.get('[data-testid="username-input"]').should('be.visible');
    cy.get('[data-testid="toggle-auth-mode-btn"]').click();

    cy.get('[data-testid="username-input"]').clear().type(TEST.USER.TEST.USERNAME);
    cy.get('[data-testid="password-input"]').clear().type(TEST.USER.TEST.PASSWORD);
    cy.get('[data-testid="submit-auth-btn"]').click();

    cy.get('[data-testid="logged-in-user"]').should('contain', TEST.USER.TEST.USERNAME);
  });

  it('Sign out', function()
  {
    doLogin();
    doLogout();

    cy.get('[data-testid="open-sign-in-btn"]').should('be.visible');
  });

  it('Sign in - Fail - Incorrect password', function()
  {
    cy.get('[data-testid="open-sign-in-btn"]').click();
    cy.get('[data-testid="username-input"]').should('be.visible');

    cy.get('[data-testid="username-input"]').clear().type(TEST.USER.TEST.USERNAME);
    cy.get('[data-testid="password-input"]').clear().type('wrongpassword');
    cy.get('[data-testid="submit-auth-btn"]').click();

    cy.get('[data-testid="auth-error"]').should('be.visible');
  });

  it('Sign in - Success', function()
  {
    doLogin();

    cy.get('[data-testid="logged-in-user"]').should('contain', TEST.USER.TEST.USERNAME);
  });
});
