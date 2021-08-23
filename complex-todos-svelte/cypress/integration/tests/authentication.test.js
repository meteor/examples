import {visit} from '../utilities/commons.js';
import {TEST} from '../constants/test.js';
import {doLogin} from '../utilities/doLogin.js';
import {doLogout} from '../utilities/doLogout.js';

describe('Authentication', function()
{
  it('Sign up - Fail - Passwords must match', function()
  {
    visit('/');
    
    cy.get('#login-sign-in-link').click();
    
    cy.get('#signup-link').click();
    
    cy.get('#login-username').clear().type(TEST.USER.TEST.USERNAME);
    
    cy.get('#login-password').clear().type('password1');
    
    cy.get('#login-password-again').clear().type('password2');
    
    cy.get('#login-buttons-password').click();
    
    cy.get('.message.error-message').should('contain', 'Passwords don\'t match');
  });
  
  it('Sign up - Fail - Password must long', function()
  {
    visit('/');
    
    cy.get('#login-sign-in-link').click();
    
    cy.get('#signup-link').click();
    
    cy.get('#login-username').clear().type(TEST.USER.TEST.USERNAME);
    
    cy.get('#login-password').clear().type('pass');
    
    cy.get('#login-password-again').clear().type('pass');
    
    cy.get('#login-buttons-password').click();
    
    cy.get('.message.error-message').should('contain', 'Password must be at least 6 characters long');
  });
  
  it('Sign up - Success', function()
  {
    visit('/');
    
    cy.get('#login-sign-in-link').click();
    
    cy.get('#signup-link').click();
    
    cy.get('#login-username').clear().type(TEST.USER.TEST.USERNAME);
    
    cy.get('#login-password').clear().type(TEST.USER.TEST.PASSWORD);
    
    cy.get('#login-password-again').clear().type(TEST.USER.TEST.PASSWORD);
    
    cy.get('#login-buttons-password').click();
    
    cy.get('#login-name-link').should('contain', TEST.USER.TEST.USERNAME);
  });
  
  it('Sign in - Fail - Incorrect password', function()
  {
    visit('/');
    
    cy.get('#login-sign-in-link').click();
    
    cy.get('#login-username').clear().type(TEST.USER.TEST.USERNAME);
    
    cy.get('#login-password').clear().type('pass');
    
    cy.get('#login-buttons-password').click();
    
    cy.get('.message.error-message').should('contain', 'Incorrect password');
  });
  
  it('Sign in - Fail - User not found', function()
  {
    visit('/');
    
    cy.get('#login-sign-in-link').click();
    
    cy.get('#login-username').clear().type('user');
    
    cy.get('#login-password').clear().type('pass');
    
    cy.get('#login-buttons-password').click();
    
    cy.get('.message.error-message').should('contain', 'User not found');
  });
  
  it('Sign in - Success', function()
  {
    visit('/');
    
    doLogin();
  });
  
  it('Sign out', function()
  {
    visit('/');
    
    doLogout()
    
    cy.get('#login-sign-in-link').should('contain', 'Sign in');
  });
});