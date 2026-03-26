import {memcache} from '../../cache/cacheService.js';
import {CACHE_KEY} from '../enums/cacheKey.js';
import {Meteor} from 'meteor/meteor';

class UserCache
{
  /**
   * Returns cached profile info
   * @locus server
   * @param userId {string}
   * @returns {object|null}
   */
  async get(userId)
  {
    if(memcache.hasKey(`${CACHE_KEY.USER}.${userId}`))
    {
      return memcache.getValue(`${CACHE_KEY.USER}.${userId}`);
    }
    else
    {
      let userFromDB = await Meteor.users.findOneAsync(userId);

      if(userFromDB !== null)
      {
        memcache.setValue(`${CACHE_KEY.USER}.${userId}`, userFromDB);
      }

      return userFromDB;
    }
  }
  /**
   * Adds provided user to the cache
   * @locus server
   * @param user {object}
   */
  cache(user)
  {
    memcache.setValue(`${CACHE_KEY.USER}.${user._id}`, user);
  }
  /**
   * Removes cache of provided profile
   * @locus server
   * @param userId {string}
   */
  remove(userId)
  {
    memcache.remove(`${CACHE_KEY.USER}.${userId}`);
  }
}

export const userCache = new UserCache();