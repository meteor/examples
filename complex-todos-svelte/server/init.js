import {log} from '../imports/shared/logger/logger.js';
import {Jobs} from 'meteor/msavin:sjobs';
import {JOB} from './shared/enums/job.js';

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
    Jobs.run(JOB.TASKS.EXPIRE, {
        in: {
          days: 7
        }
      }
    );
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
