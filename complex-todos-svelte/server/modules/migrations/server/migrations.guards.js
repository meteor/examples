import {Migrations} from '../database/migrations.js';

// This collection is defined on server side only but
// We may want to use a server side database in the shared space
// Thus, defining guards is always a good practice
Migrations.allow({
  /**
   * @locus server
   * @returns {boolean}
   */
  insert()
  {
    return false;
  },
  /**
   * @locus server
   * @returns {boolean}
   */
  update()
  {
    return false;
  },
  /**
   * @locus server
   * @returns {boolean}
   */
  remove()
  {
    return false;
  }
});