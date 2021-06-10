import {Mongo} from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Tasks = new Mongo.Collection('tasks');

Tasks.attachSchema(new SimpleSchema({
  text: {
    type: String
  },
  createdAt: {
    type: Date
  },
  owner: {
    type: String
  },
  username: {
    type: String
  },
  checked: {
    type: Boolean,
    optional: true
  },
  expired: {
    type: Boolean,
    optional: true
  },
  private: {
    type: Boolean,
    optional: true
  }
}));

export {Tasks};