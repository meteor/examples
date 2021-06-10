import {log} from '../../../imports/shared/logger/logger.js';
import {DUMMY_USERS} from './fixtures/dummyUsers.js';
import {DUMMY_TASKS} from './fixtures/dummyTasks.js';
import {taskRepository} from '../../../imports/modules/tasks/taskRepository.js';
import {Mongo} from 'meteor/mongo';

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
  clearDatabase()
  {
    log.debug(__fn);
    
    const collections = Mongo.Collection.getAll();
    
    // Add special collections here to prevent restart to start the tests
    const restrictedCollections = ['roles', 'migrations', 'jobs_data', 'jobs_dominator_3'];
    
    collections.forEach(collection =>
    {
      if(!restrictedCollections.includes(collection))
      {
        collection.instance.remove({});
      }
    });
  }
  
  /**
   * Inserts dummy data
   * @development
   * @locus server
   * @returns {boolean}
   */
  insertDummyData()
  {
    log.debug(__fn);
    
    this._insertTasks();
    this._insertUsers();
  }
  
  /**
   * @development
   * @locus server
   * @private
   */
  _insertTasks()
  {
    log.debug(__fn);
    
    this.tasks.forEach(task =>
    {
      taskRepository.insertBulk(task);
    });
    
    taskRepository.executeBulk();
  }
  
  /**
   * @development
   * @locus server
   * @private
   */
  _insertUsers()
  {
    log.debug(__fn);
    
    this.users.forEach(user =>
    {
      Meteor.users.insert(user);
    });
  }
}

export const dummiesService = new DummiesService();