import {Meteor} from 'meteor/meteor';
import {UNIT_TEST} from '../../../tests/enums/users.js';

/**
 * @type {{readonly details: (*), readonly _id: *}}
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
    else
    {
      const {userCache} = require('../../modules/users/server/user.cache.js');
      return userCache.get(this._id);
    }
  }
};