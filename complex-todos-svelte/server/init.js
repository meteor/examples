import {log} from '/imports/shared/logger/logger.js';
import {runTasksExpire} from '/imports/modules/jobs/tasks.expire.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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
   * Run scheduled jobs using setInterval
   */
  initializeJobs()
  {
    // Run task expiration every 7 days
    Meteor.setInterval(() =>
    {
      runTasksExpire();
    }, SEVEN_DAYS_MS);
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
