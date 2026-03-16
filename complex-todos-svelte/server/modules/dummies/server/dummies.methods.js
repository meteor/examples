import {dummiesService} from '../dummiesService.js';

/**
 * These methods and dummiesService are not working
 * in production server
 * @development
 * @locus server
 */
Meteor.methods({
  /**
   * Clears database of the applications to run before tests
   * Some collections such as roles or migrations are scoped out
   * @development
   * @locus server
   */
  async 'clear.database'()
  {
    await dummiesService.clearDatabase();
  },
  /**
   * Inserts dummy data to mimic real world examples before tests
   * @development
   * @locus server
   */
  async 'insert.dummy.data'()
  {
    await dummiesService.insertDummyData();
  }
});