import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { Boards } from './collection';
import { Cards } from '../cards/collection';
import { cleanTitle } from '../cards/titles';

const DEFAULT_COLUMNS = ['To do', 'Doing', 'Done'];

const requireTitle = (title) => {
  check(title, String);
  const cleaned = cleanTitle(title);
  if (!cleaned) throw new Meteor.Error('empty-title', 'A title is required');
  return cleaned;
};

Meteor.methods({
  async 'boards.create'(title) {
    return Boards.insertAsync({
      title: requireTitle(title),
      columns: DEFAULT_COLUMNS.map((columnTitle) => ({ id: Random.id(), title: columnTitle })),
      createdAt: new Date(),
    });
  },

  async 'boards.addColumn'(boardId, title) {
    check(boardId, String);
    const column = { id: Random.id(), title: requireTitle(title) };
    const updated = await Boards.updateAsync(boardId, { $push: { columns: column } });
    if (!updated) throw new Meteor.Error('board-not-found', 'No such board');
    return column.id;
  },

  async 'boards.renameColumn'(boardId, columnId, title) {
    check([boardId, columnId], [String]);
    return Boards.updateAsync(
      { _id: boardId, 'columns.id': columnId },
      { $set: { 'columns.$.title': requireTitle(title) } },
    );
  },

  async 'boards.removeColumn'(boardId, columnId) {
    check([boardId, columnId], [String]);
    await Boards.updateAsync(boardId, { $pull: { columns: { id: columnId } } });
    return Cards.removeAsync({ boardId, columnId });
  },
});

if (Meteor.isServer) {
  Meteor.methods({
    // Called from a template helper on the landing page: no stub, so the
    // helper's Promise only settles with the server's answer.
    async 'boards.stats'() {
      return {
        boards: await Boards.find().countAsync(),
        cards: await Cards.find().countAsync(),
      };
    },
  });
}
