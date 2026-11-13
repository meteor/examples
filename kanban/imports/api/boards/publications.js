import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Boards } from './collection';
import { Cards } from '../cards/collection';

// One board and all of its cards: everything a board page needs.
Meteor.publish('board', function (boardId) {
  check(boardId, String);
  return [Boards.find(boardId), Cards.find({ boardId })];
});
