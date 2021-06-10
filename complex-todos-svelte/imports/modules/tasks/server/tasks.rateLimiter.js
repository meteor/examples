import {_} from 'meteor/underscore';
import {RATE_LIMITER} from '../enums/rateLimitter.js';
import {tasksInsert, tasksRemove, tasksUpdateAsChecked, tasksUpdateAsPrivate} from '../tasks.methods.js';

const LISTS_METHODS = _.pluck([
  tasksInsert,
  tasksRemove,
  tasksUpdateAsChecked,
  tasksUpdateAsPrivate
], 'name');

DDPRateLimiter.addRule({
  name(name)
  {
    return _.contains(LISTS_METHODS, name);
  },
  // Rate limit per connection
  connectionId()
  {
    return true;
  }
}, RATE_LIMITER.REQUEST_COUNT, RATE_LIMITER.TIME_INTERVAL);