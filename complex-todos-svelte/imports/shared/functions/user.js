import {Meteor} from 'meteor/meteor';
import {UNIT_TEST} from '../../../tests/enums/users.js';

/**
 * @type {{readonly _id: *, details: *, getDetailsAsync: function}}
 */
export const User = {
  get _id()
  {
    if(Meteor.isTest)
    {
      return UNIT_TEST.USER_ID;
    }

    return Meteor.userId();
  },
  /**
   * Synchronous getter - works on client (minimongo) and tests only
   */
  get details()
  {
    if(Meteor.isTest)
    {
      return {
        _id: UNIT_TEST.USER_ID,
        username: UNIT_TEST.USERNAME
      };
    }

    if(Meteor.isClient)
    {
      return Meteor.users.findOne(this._id);
    }

    throw new Error('Use User.getDetailsAsync() on the server');
  },
  /**
   * Async method for server-side usage
   * @returns {Promise<object>}
   */
  async getDetailsAsync()
  {
    if(Meteor.isTest)
    {
      return {
        _id: UNIT_TEST.USER_ID,
        username: UNIT_TEST.USERNAME
      };
    }

    if(Meteor.isClient)
    {
      return Meteor.users.findOne(this._id);
    }

    const {userCache} = require('../../modules/users/user.cache.js');
    return userCache.get(this._id);
  }
};