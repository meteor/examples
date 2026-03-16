import {log} from '../../../imports/shared/logger/logger.js';
import {DUMMY_USERS} from './fixtures/dummyUsers.js';
import {DUMMY_TASKS} from './fixtures/dummyTasks.js';
import {taskRepository} from '../../../imports/modules/tasks/taskRepository.js';
import {Tasks} from '../../../imports/modules/tasks/database/tasks.js';

/**
 * This service adds dummy data to test all features including franchise and admin actions
 * the user which will be added is an admin account. Thus, the tester can check everything
 * @development
 * @locus server
 */
class DummiesService
{
  /**
   * @constructor
   * @development
   * @locus server
   */
  constructor()
  {
    if(Meteor.isProduction)
    {
      return true;
    }

    this.tasks = DUMMY_TASKS;
    this.users = DUMMY_USERS;
  }

  /**
   * Clears all database
   * @development
   * @locus server
   */
  async clearDatabase()
  {
    log.debug('DummiesService.clearDatabase');

    // Clear known application collections
    await Tasks.removeAsync({});
    await Meteor.users.removeAsync({});
  }

  /**
   * Inserts dummy data
   * @development
   * @locus server
   */
  async insertDummyData()
  {
    log.debug('DummiesService.insertDummyData');

    await this._insertTasks();
    await this._insertUsers();
  }

  /**
   * @development
   * @locus server
   * @private
   */
  async _insertTasks()
  {
    log.debug('DummiesService._insertTasks');

    this.tasks.forEach(task =>
    {
      taskRepository.insertBulk(task);
    });

    await taskRepository.executeBulk();
  }

  /**
   * @development
   * @locus server
   * @private
   */
  async _insertUsers()
  {
    log.debug('DummiesService._insertUsers');

    for(const user of this.users)
    {
      await Meteor.users.insertAsync(user);
    }
  }
}

export const dummiesService = new DummiesService();