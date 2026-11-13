import { Mongo } from 'meteor/mongo';

// { _id, boardId, columnId, title, description, rank, createdAt, updatedAt }
export const Cards = new Mongo.Collection('cards');
