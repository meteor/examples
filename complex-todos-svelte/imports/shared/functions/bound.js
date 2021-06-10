import {Meteor} from 'meteor/meteor';

/**
 * Used in callbacks which should be called with Meteor context
 */
export const bound = Meteor.bindEnvironment((callback) =>
{
  callback();
});