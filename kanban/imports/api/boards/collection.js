import { Mongo } from 'meteor/mongo';

// { _id, title, columns: [{ id, title }], createdAt }
export const Boards = new Mongo.Collection('boards');
