import {log} from '../imports/shared/logger/logger.js';
import {Accounts} from 'meteor/accounts-base';
import App from './ui/App.svelte';

/**
 * Initialize client at startup
 * @locus server
 */
class ClientInit
{
  /**
   * @constructor
   */
  constructor()
  {
    log.info('Client is starting');
    
    this._accountUIConfig();
    
    this._renderApp();
  }
  
  _accountUIConfig()
  {
    log.debug('Configuring accounts user interface');
    
    Accounts.ui.config({
      passwordSignupFields: 'USERNAME_ONLY'
    });
  }
  
  _renderApp()
  {
    log.debug('Rendering app');
    
    new App({
      target: document.getElementById('app')
    });
  }
}

/**
 * No need to export it
 * It will only run once on client initialize
 */
Meteor.startup(function()
{
  new ClientInit;
});