import { Mongo } from 'meteor/mongo';

// { _id, title, columns: [{ _id, title }], createdAt }
export const Boards = new Mongo.Collection('boards');
