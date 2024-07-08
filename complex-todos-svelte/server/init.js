import { log } from '../imports/shared/logger/logger.js';

/**
 * Initialize server at startup
 * @locus server
 */
class ServerInit
{
  /**
   * @constructor
   */
  constructor()
  {
    log.info('Server is starting');
    
    this.initializeJobs();
  }
  
  /**
   * Run added jobs
   */
  initializeJobs()
  {
    setInterval(() => {
      Meteor.call('tasks.expire');
    }, 60000)
  }
}

/**
 * No need to export it
 * It will only run once on server initialize
 */
Meteor.startup(function()
{
  new ServerInit;
});
